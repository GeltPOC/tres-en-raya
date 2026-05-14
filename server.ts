import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

type Player = {
  id: string
  mark: 'X' | 'O'
  name: string
}

type Room = {
  id: string
  players: Player[]
  board: (string | null)[]
  currentTurn: string
  winner: string | null
  gameOver: boolean
}

const rooms = new Map<string, Room>()

function checkWinner(board: (string | null)[]): string | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ]
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as string
    }
  }
  return null
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    path: '/tres-en-raya/socket.io',
    cors: { origin: '*' }
  })

  io.on('connection', (socket) => {
    console.log('connected:', socket.id)

    socket.on('joinRoom', (roomId: string) => {
      const roomsArray = Array.from(rooms.values())
      const existing = roomsArray.find(r =>
        r.players.some(p => p.id === socket.id)
      )
      if (existing) return

      let room = rooms.get(roomId)
      if (!room) {
        room = {
          id: roomId,
          players: [],
          board: Array(9).fill(null),
          currentTurn: '',
          winner: null,
          gameOver: false
        }
        rooms.set(roomId, room)
      }

      if (room.players.length >= 2) {
        socket.emit('roomFull')
        return
      }

      const mark: 'X' | 'O' = room.players.length === 0 ? 'X' : 'O'
      const player: Player = { id: socket.id, mark, name: `Jugador ${mark}` }
      room.players.push(player)
      socket.join(roomId)

      if (room.players.length === 1) {
        room.currentTurn = socket.id
      }

      socket.emit('joined', { player, room })
      io.to(roomId).emit('roomUpdate', room)

      if (room.players.length === 2) {
        io.to(roomId).emit('gameStart', room)
      }
    })

    socket.on('makeMove', ({ roomId, index }: { roomId: string; index: number }) => {
      const room = rooms.get(roomId)
      if (!room || room.gameOver) return
      if (room.currentTurn !== socket.id) return
      if (room.board[index] !== null) return

      const player = room.players.find(p => p.id === socket.id)
      if (!player) return

      room.board[index] = player.mark

      const winner = checkWinner(room.board)
      if (winner) {
        room.winner = winner
        room.gameOver = true
      } else if (room.board.every(c => c !== null)) {
        room.gameOver = true
      } else {
        const other = room.players.find(p => p.id !== socket.id)
        if (other) room.currentTurn = other.id
      }

      io.to(roomId).emit('roomUpdate', room)
    })

    socket.on('restartGame', (roomId: string) => {
      const room = rooms.get(roomId)
      if (!room || room.players.length < 2) return
      room.board = Array(9).fill(null)
      room.winner = null
      room.gameOver = false
      room.currentTurn = room.players[0].id
      io.to(roomId).emit('gameStart', room)
      io.to(roomId).emit('roomUpdate', room)
    })

    socket.on('disconnect', () => {
      rooms.forEach((room, roomId) => {
        const idx = room.players.findIndex(p => p.id === socket.id)
        if (idx !== -1) {
          room.players.splice(idx, 1)
          if (room.players.length === 0) {
            rooms.delete(roomId)
          } else {
            room.gameOver = true
            io.to(roomId).emit('playerLeft', room)
            io.to(roomId).emit('roomUpdate', room)
          }
        }
      })
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
