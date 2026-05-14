import { Server as SocketIOServer } from 'socket.io'
import { createServer } from 'http'

let io: SocketIOServer | null = null

interface Player {
  id: string
  name: string
  mark: 'X' | 'O'
}

interface Room {
  id: string
  name: string
  players: Player[]
  board: (string | null)[]
  currentTurn: string
  status: 'waiting' | 'playing' | 'finished'
  winner: string | null
  winningCells: number[]
  isDraw: boolean
  scores: Record<string, number>
  revanchaRequests: string[]
}

const rooms = new Map<string, Room>()

const WINNING_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
]

function checkWinner(board: (string | null)[]): { winner: string; cells: number[] } | null {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as string, cells: combo }
    }
  }
  return null
}

function getRoomPublicData(room: Room) {
  return {
    id: room.id,
    name: room.name,
    players: room.players.length,
    status: room.status === 'finished' ? 'playing' : room.status
  }
}

function broadcastRooms(ioInstance: SocketIOServer) {
  const publicRooms = Array.from(rooms.values())
    .filter(r => r.status !== 'finished')
    .map(getRoomPublicData)
  ioInstance.emit('rooms_update', publicRooms)
}

function emitGameState(ioInstance: SocketIOServer, room: Room) {
  const state = {
    board: room.board,
    currentTurn: room.currentTurn,
    players: room.players,
    status: room.status,
    winner: room.winner,
    winningCells: room.winningCells,
    isDraw: room.isDraw,
    scores: room.scores
  }
  ioInstance.to(room.id).emit('game_state', state)
}

export function initSocketServer() {
  if (io) return

  const httpServer = createServer()
  io = new SocketIOServer(httpServer, {
    path: '/tres-en-raya/api/socket_io',
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling']
  })

  const PORT = parseInt(process.env.SOCKET_PORT || '3001', 10)
  httpServer.listen(PORT)

  io.on('connection', (socket) => {
    socket.emit('rooms_update', Array.from(rooms.values())
      .filter(r => r.status !== 'finished')
      .map(getRoomPublicData))

    socket.on('get_rooms', () => {
      socket.emit('rooms_update', Array.from(rooms.values())
        .filter(r => r.status !== 'finished')
        .map(getRoomPublicData))
    })

    socket.on('create_room', ({ roomName, playerName }: { roomName: string; playerName: string }) => {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const player: Player = { id: socket.id, name: playerName || 'Jugador', mark: 'X' }
      const room: Room = {
        id: roomId,
        name: roomName || `Sala de ${playerName}`,
        players: [player],
        board: Array(9).fill(null),
        currentTurn: socket.id,
        status: 'waiting',
        winner: null,
        winningCells: [],
        isDraw: false,
        scores: { [socket.id]: 0 },
        revanchaRequests: []
      }
      rooms.set(roomId, room)
      socket.join(roomId)
      socket.emit('room_joined', roomId)
      emitGameState(io!, room)
      broadcastRooms(io!)
    })

    socket.on('join_room', ({ roomId, playerName }: { roomId: string; playerName: string }) => {
      const room = rooms.get(roomId)
      if (!room) { socket.emit('notification', 'Sala no encontrada'); return }
      if (room.players.length >= 2) { socket.emit('notification', 'Sala llena'); return }
      if (room.status !== 'waiting') { socket.emit('notification', 'La partida ya empezó'); return }

      const player: Player = { id: socket.id, name: playerName || 'Jugador', mark: 'O' }
      room.players.push(player)
      room.scores[socket.id] = 0
      room.status = 'playing'
      socket.join(roomId)
      socket.emit('room_joined', roomId)
      emitGameState(io!, room)
      broadcastRooms(io!)
      io!.to(roomId).emit('notification', '¡La partida comienza!')
    })

    socket.on('make_move', ({ roomId, index }: { roomId: string; index: number }) => {
      const room = rooms.get(roomId)
      if (!room || room.status !== 'playing') return
      if (room.currentTurn !== socket.id) return
      if (room.board[index]) return

      const player = room.players.find(p => p.id === socket.id)
      if (!player) return

      room.board[index] = player.mark

      const result = checkWinner(room.board)
      if (result) {
        const winnerId = room.players.find(p => p.mark === result.winner)?.id
        room.status = 'finished'
        room.winner = winnerId || null
        room.winningCells = result.cells
        if (winnerId) room.scores[winnerId] = (room.scores[winnerId] || 0) + 1
      } else if (room.board.every(c => c !== null)) {
        room.status = 'finished'
        room.isDraw = true
      } else {
        const other = room.players.find(p => p.id !== socket.id)
        room.currentTurn = other?.id || socket.id
      }

      emitGameState(io!, room)
    })

    socket.on('request_revancha', ({ roomId }: { roomId: string }) => {
      const room = rooms.get(roomId)
      if (!room || room.status !== 'finished') return
      if (room.revanchaRequests.includes(socket.id)) return
      room.revanchaRequests.push(socket.id)
      const other = room.players.find(p => p.id !== socket.id)
      if (other) io!.to(other.id).emit('revancha_requested')
      if (room.revanchaRequests.length === 2) {
        startRevancha(io!, room)
      }
    })

    socket.on('accept_revancha', ({ roomId }: { roomId: string }) => {
      const room = rooms.get(roomId)
      if (!room || room.status !== 'finished') return
      if (!room.revanchaRequests.includes(socket.id)) {
        room.revanchaRequests.push(socket.id)
      }
      if (room.revanchaRequests.length >= 2 || room.players.every(p => room.revanchaRequests.includes(p.id))) {
        startRevancha(io!, room)
      } else {
        startRevancha(io!, room)
      }
    })

    socket.on('leave_room', ({ roomId }: { roomId: string }) => {
      handleLeave(socket.id, roomId)
    })

    socket.on('disconnecting', () => {
      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) handleLeave(socket.id, roomId)
      })
    })

    socket.on('disconnect', () => {
      broadcastRooms(io!)
    })
  })
}

function startRevancha(ioInstance: SocketIOServer, room: Room) {
  room.board = Array(9).fill(null)
  room.status = 'playing'
  room.winner = null
  room.winningCells = []
  room.isDraw = false
  room.revanchaRequests = []
  // Swap marks
  room.players = room.players.map(p => ({ ...p, mark: p.mark === 'X' ? 'O' : 'X' })) as typeof room.players
  const xPlayer = room.players.find(p => p.mark === 'X')
  room.currentTurn = xPlayer?.id || room.players[0].id
  ioInstance.to(room.id).emit('revancha_accepted')
  emitGameState(ioInstance, room)
}

function handleLeave(socketId: string, roomId: string) {
  const room = rooms.get(roomId)
  if (!room) return
  const wasInRoom = room.players.some(p => p.id === socketId)
  if (!wasInRoom) return
  room.players = room.players.filter(p => p.id !== socketId)
  if (room.players.length === 0) {
    rooms.delete(roomId)
  } else {
    room.status = 'waiting'
    room.board = Array(9).fill(null)
    room.winner = null
    room.winningCells = []
    room.isDraw = false
    room.revanchaRequests = []
    const remaining = room.players[0]
    room.currentTurn = remaining.id
    remaining.mark = 'X'
    room.scores = { [remaining.id]: room.scores[remaining.id] || 0 }
    if (io) {
      io.to(roomId).emit('player_left')
      emitGameState(io, room)
    }
  }
  if (io) broadcastRooms(io)
}
