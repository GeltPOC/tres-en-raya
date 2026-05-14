'use client'

import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

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

const BASE_PATH = '/tres-en-raya'

let socket: Socket | null = null

export default function Home() {
  const [room, setRoom] = useState<Room | null>(null)
  const [myPlayer, setMyPlayer] = useState<Player | null>(null)
  const [roomInput, setRoomInput] = useState('')
  const [status, setStatus] = useState('')
  const [connected, setConnected] = useState(false)
  const [phase, setPhase] = useState<'lobby' | 'waiting' | 'playing'>('lobby')

  useEffect(() => {
    socket = io({ path: `${BASE_PATH}/socket.io` })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('joined', ({ player, room: r }: { player: Player; room: Room }) => {
      setMyPlayer(player)
      setRoom(r)
      setPhase('waiting')
      setStatus('Esperando al segundo jugador...')
    })

    socket.on('roomFull', () => {
      setStatus('La sala está llena. Prueba con otro código.')
    })

    socket.on('gameStart', (r: Room) => {
      setRoom(r)
      setPhase('playing')
      setStatus('')
    })

    socket.on('roomUpdate', (r: Room) => {
      setRoom(r)
    })

    socket.on('playerLeft', () => {
      setStatus('El otro jugador se ha desconectado.')
      setPhase('lobby')
      setRoom(null)
      setMyPlayer(null)
    })

    return () => {
      socket?.disconnect()
    }
  }, [])

  const joinRoom = useCallback(() => {
    const id = roomInput.trim()
    if (!id || !socket) return
    socket.emit('joinRoom', id)
  }, [roomInput])

  const makeMove = useCallback((index: number) => {
    if (!socket || !room || !myPlayer) return
    if (room.currentTurn !== myPlayer.id) return
    if (room.board[index] !== null) return
    if (room.gameOver) return
    socket.emit('makeMove', { roomId: room.id, index })
  }, [room, myPlayer])

  const restart = useCallback(() => {
    if (!socket || !room) return
    socket.emit('restartGame', room.id)
  }, [room])

  const isMyTurn = room && myPlayer && room.currentTurn === myPlayer.id && !room.gameOver

  function renderCell(value: string | null, index: number) {
    const color = value === 'X' ? 'text-blue-400' : 'text-red-400'
    return (
      <button
        key={index}
        onClick={() => makeMove(index)}
        className={`flex items-center justify-center w-24 h-24 text-5xl font-bold border-2 border-gray-600 rounded-xl transition-all ${
          !value && isMyTurn ? 'hover:bg-gray-700 cursor-pointer' : 'cursor-default'
        } ${value ? color : ''} bg-gray-800`}
      >
        {value || ''}
      </button>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Tres en Raya</h1>
      <p className="text-gray-400 mb-8 text-sm">
        {connected ? '🟢 Conectado' : '🔴 Desconectado'}
      </p>

      {phase === 'lobby' && (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <p className="text-gray-300 text-center">Introduce un código de sala para jugar con alguien.</p>
          <input
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:border-blue-400"
            placeholder="Código de sala..."
            value={roomInput}
            onChange={e => setRoomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
          />
          <button
            onClick={joinRoom}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold transition-colors"
          >
            Unirse a sala
          </button>
          {status && <p className="text-yellow-400 text-sm text-center">{status}</p>}
        </div>
      )}

      {phase === 'waiting' && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-300">Sala: <span className="text-blue-400 font-bold">{room?.id}</span></p>
          <p className="text-gray-300">Eres el jugador <span className={`font-bold ${myPlayer?.mark === 'X' ? 'text-blue-400' : 'text-red-400'}`}>{myPlayer?.mark}</span></p>
          <p className="text-yellow-400 animate-pulse">{status}</p>
        </div>
      )}

      {phase === 'playing' && room && myPlayer && (
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-6 text-sm">
            <span className="text-blue-400 font-bold">X: {room.players.find(p => p.mark === 'X')?.name}</span>
            <span className="text-red-400 font-bold">O: {room.players.find(p => p.mark === 'O')?.name}</span>
          </div>

          {!room.gameOver && (
            <p className="text-gray-300">
              {isMyTurn ? '🟢 Tu turno' : '⏳ Turno del rival'}
            </p>
          )}

          {room.gameOver && (
            <div className="text-center">
              {room.winner
                ? <p className="text-2xl font-bold">
                    {room.winner === myPlayer.mark ? '🎉 ¡Ganaste!' : '😞 Perdiste'}
                  </p>
                : <p className="text-2xl font-bold">🤝 ¡Empate!</p>
              }
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {room.board.map((cell, i) => renderCell(cell, i))}
          </div>

          {room.gameOver && room.players.length === 2 && (
            <button
              onClick={restart}
              className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 font-semibold transition-colors"
            >
              Jugar de nuevo
            </button>
          )}
        </div>
      )}
    </main>
  )
}
