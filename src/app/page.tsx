'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

const basePath = '/tres-en-raya'

type Mark = 'X' | 'O' | null
type Board = Mark[]

interface Room {
  id: string
  name: string
  players: number
  status: 'waiting' | 'playing'
}

interface GameState {
  board: Board
  currentTurn: string
  players: { id: string; mark: Mark; name: string }[]
  status: 'waiting' | 'playing' | 'finished'
  winner: string | null
  winningCells: number[]
  isDraw: boolean
  scores: Record<string, number>
}

const WINNING_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
]

function checkWinner(board: Board): { winner: Mark; cells: number[] } | null {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Mark, cells: combo }
    }
  }
  return null
}

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [roomName, setRoomName] = useState('')
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [mySocketId, setMySocketId] = useState<string>('')
  const [notification, setNotification] = useState<string | null>(null)
  const [view, setView] = useState<'login' | 'lobby' | 'game'>('login')
  const [revancha, setRevancha] = useState<{ requested: boolean; byMe: boolean }>({ requested: false, byMe: false })
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showNotification = useCallback((msg: string) => {
    setNotification(msg)
    if (notifTimer.current) clearTimeout(notifTimer.current)
    notifTimer.current = setTimeout(() => setNotification(null), 3500)
  }, [])

  useEffect(() => {
    fetch(`${basePath}/api/socket`).then(() => {
      const s = io({ path: `${basePath}/api/socket_io`, transports: ['websocket', 'polling'] })
      s.on('connect', () => {
        setConnected(true)
        setMySocketId(s.id || '')
      })
      s.on('disconnect', () => setConnected(false))
      s.on('rooms_update', (updatedRooms: Room[]) => setRooms(updatedRooms))
      s.on('game_state', (state: GameState) => {
        setGameState(state)
        if (state.status === 'playing' && view !== 'game') setView('game')
      })
      s.on('room_joined', (roomId: string) => {
        setCurrentRoom(roomId)
        setView('game')
        setRevancha({ requested: false, byMe: false })
      })
      s.on('notification', (msg: string) => showNotification(msg))
      s.on('revancha_requested', () => {
        setRevancha(prev => ({ ...prev, requested: true }))
        showNotification('¡Tu rival quiere una revancha!')
      })
      s.on('revancha_accepted', () => {
        setRevancha({ requested: false, byMe: false })
        showNotification('¡Revancha iniciada!')
      })
      s.on('player_left', () => {
        showNotification('Tu rival abandonó la partida')
        setCurrentRoom(null)
        setGameState(null)
        setView('lobby')
        setRevancha({ requested: false, byMe: false })
      })
      s.on('connect', () => s.emit('get_rooms'))
      setSocket(s)
      return () => { s.disconnect() }
    })
  }, [])

  useEffect(() => {
    if (socket?.connected) setMySocketId(socket.id || '')
  }, [socket, connected])

  const handleLogin = () => {
    const name = nameInput.trim()
    if (!name) return
    setPlayerName(name)
    setView('lobby')
    if (socket) socket.emit('get_rooms')
  }

  const handleCreateRoom = () => {
    const name = roomName.trim() || `Sala de ${playerName}`
    if (!socket) return
    socket.emit('create_room', { roomName: name, playerName })
    setRoomName('')
  }

  const handleJoinRoom = (roomId: string) => {
    if (!socket) return
    socket.emit('join_room', { roomId, playerName })
  }

  const handleMove = (index: number) => {
    if (!socket || !gameState || !currentRoom) return
    if (gameState.status !== 'playing') return
    if (gameState.currentTurn !== mySocketId) return
    if (gameState.board[index]) return
    socket.emit('make_move', { roomId: currentRoom, index })
  }

  const handleRevancha = () => {
    if (!socket || !currentRoom) return
    socket.emit('request_revancha', { roomId: currentRoom })
    setRevancha(prev => ({ ...prev, byMe: true }))
  }

  const handleAcceptRevancha = () => {
    if (!socket || !currentRoom) return
    socket.emit('accept_revancha', { roomId: currentRoom })
    setRevancha({ requested: false, byMe: false })
  }

  const handleLeaveRoom = () => {
    if (!socket || !currentRoom) return
    socket.emit('leave_room', { roomId: currentRoom })
    setCurrentRoom(null)
    setGameState(null)
    setView('lobby')
    setRevancha({ requested: false, byMe: false })
    if (socket) socket.emit('get_rooms')
  }

  const myMark = gameState?.players.find(p => p.id === mySocketId)?.mark
  const isMyTurn = gameState?.currentTurn === mySocketId
  const myScore = gameState?.scores[mySocketId] ?? 0
  const rival = gameState?.players.find(p => p.id !== mySocketId)
  const rivalScore = rival ? (gameState?.scores[rival.id] ?? 0) : 0

  if (view === 'login') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-extrabold mb-2 bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">Tres en Raya</h1>
            <p className="text-slate-400 text-lg">Multijugador en tiempo real</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
            <h2 className="text-xl font-bold mb-6 text-slate-200">¿Cómo te llamas?</h2>
            <input
              type="text"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-pink-400 transition mb-4"
              placeholder="Tu nombre..."
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              maxLength={20}
            />
            <button
              onClick={handleLogin}
              disabled={!nameInput.trim() || !connected}
              className="w-full bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition"
            >
              {connected ? 'Entrar al Lobby' : 'Conectando...'}
            </button>
            <div className="mt-4 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-slate-400">{connected ? 'Conectado al servidor' : 'Sin conexión'}</span>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (view === 'lobby') {
    return (
      <main className="min-h-screen p-4 md:p-8">
        {notification && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fadeIn bg-yellow-400 text-yellow-900 font-bold px-6 py-3 rounded-xl shadow-lg">
            {notification}
          </div>
        )}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">Tres en Raya</h1>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Hola, <span className="text-white font-semibold">{playerName}</span></span>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-700">
            <h2 className="text-lg font-bold mb-4 text-slate-200">Crear nueva sala</h2>
            <div className="flex gap-3">
              <input
                type="text"
                className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-pink-400 transition"
                placeholder="Nombre de la sala (opcional)"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateRoom()}
                maxLength={30}
              />
              <button
                onClick={handleCreateRoom}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white font-bold px-6 py-2.5 rounded-xl transition whitespace-nowrap"
              >
                + Crear
              </button>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-200">Salas disponibles</h2>
              <button
                onClick={() => socket?.emit('get_rooms')}
                className="text-sm text-slate-400 hover:text-white transition"
              >
                ↻ Actualizar
              </button>
            </div>
            {rooms.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-3">🎮</div>
                <p>No hay salas disponibles.</p>
                <p className="text-sm mt-1">¡Crea una para empezar!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map(room => (
                  <div key={room.id} className="flex items-center justify-between bg-slate-700 rounded-xl px-4 py-3 border border-slate-600">
                    <div>
                      <p className="font-semibold text-white">{room.name}</p>
                      <p className="text-sm text-slate-400">{room.players}/2 jugadores · {room.status === 'waiting' ? '⏳ Esperando' : '🔴 En juego'}</p>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={room.status === 'playing' || room.players >= 2}
                      className="bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg transition text-sm"
                    >
                      Unirse
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    )
  }

  // GAME VIEW
  const isFinished = gameState?.status === 'finished'
  const winnerPlayer = gameState?.winner ? gameState.players.find(p => p.id === gameState.winner) : null
  const isWinner = gameState?.winner === mySocketId

  return (
    <main className="min-h-screen p-4 flex flex-col items-center justify-center">
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fadeIn bg-yellow-400 text-yellow-900 font-bold px-6 py-3 rounded-xl shadow-lg">
          {notification}
        </div>
      )}

      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={handleLeaveRoom} className="text-slate-400 hover:text-white transition text-sm flex items-center gap-1">
            ← Salir
          </button>
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">Tres en Raya</h1>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>

        {/* Scores */}
        {gameState && gameState.players.length === 2 && (
          <div className="flex gap-3 mb-5">
            {gameState.players.map(p => (
              <div key={p.id} className={`flex-1 rounded-xl p-3 border-2 transition ${p.id === mySocketId ? 'border-pink-500 bg-pink-500/10' : 'border-blue-500 bg-blue-500/10'} ${gameState.currentTurn === p.id && gameState.status === 'playing' ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-slate-900' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-extrabold ${p.mark === 'X' ? 'cell-x' : 'cell-o'}`}>{p.mark}</span>
                  <span className="text-sm font-semibold text-white truncate">{p.id === mySocketId ? `${p.name} (tú)` : p.name}</span>
                </div>
                <div className="text-2xl font-extrabold mt-1 text-white">{gameState.scores[p.id] ?? 0}</div>
              </div>
            ))}
          </div>
        )}

        {/* Status */}
        <div className="text-center mb-5 h-8">
          {gameState?.status === 'waiting' && (
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              Esperando a otro jugador...
            </div>
          )}
          {gameState?.status === 'playing' && (
            <div className={`font-bold text-lg ${isMyTurn ? 'text-yellow-400 animate-pulse' : 'text-slate-400'}`}>
              {isMyTurn ? '¡Es tu turno!' : `Turno de ${rival?.name ?? '...'}`}
            </div>
          )}
          {isFinished && (
            <div className={`font-extrabold text-xl ${isWinner ? 'text-yellow-400' : gameState?.isDraw ? 'text-slate-300' : 'text-red-400'}`}>
              {gameState?.isDraw ? '¡Empate!' : isWinner ? '🏆 ¡Ganaste!' : `😔 Ganó ${winnerPlayer?.name}`}
            </div>
          )}
        </div>

        {/* Board */}
        <div className={`grid grid-cols-3 gap-3 mb-6 ${isFinished && !gameState?.isDraw ? 'animate-shake' : ''}`}>
          {Array.from({ length: 9 }).map((_, i) => {
            const mark = gameState?.board[i]
            const isWinCell = gameState?.winningCells?.includes(i)
            const canClick = !mark && isMyTurn && gameState?.status === 'playing'
            return (
              <button
                key={i}
                onClick={() => handleMove(i)}
                className={`aspect-square rounded-2xl border-2 text-5xl font-extrabold transition flex items-center justify-center
                  ${isWinCell ? 'winning-cell' : 'border-slate-600 bg-slate-800'}
                  ${canClick ? 'hover:border-yellow-400 hover:bg-slate-700 cursor-pointer' : 'cursor-default'}
                  ${mark ? 'animate-pop' : ''}
                `}
              >
                <span className={mark === 'X' ? 'cell-x' : 'cell-o'}>
                  {mark || ''}
                </span>
              </button>
            )
          })}
        </div>

        {/* Revancha */}
        {isFinished && (
          <div className="flex flex-col gap-3">
            {!revancha.byMe && !revancha.requested && (
              <button
                onClick={handleRevancha}
                className="w-full bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-white font-bold py-3 rounded-xl transition"
              >
                🔄 Pedir Revancha
              </button>
            )}
            {revancha.byMe && !revancha.requested && (
              <div className="text-center text-slate-400 text-sm">Esperando respuesta del rival...</div>
            )}
            {revancha.requested && (
              <button
                onClick={handleAcceptRevancha}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold py-3 rounded-xl transition animate-pop"
              >
                ✅ Aceptar Revancha
              </button>
            )}
            <button
              onClick={handleLeaveRoom}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition"
            >
              🚪 Volver al Lobby
            </button>
          </div>
        )}

        {gameState?.status === 'waiting' && (
          <div className="text-center">
            <p className="text-slate-500 text-sm mb-2">Comparte el link para invitar a alguien</p>
            <button
              onClick={handleLeaveRoom}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition"
            >
              ← Volver al Lobby
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
