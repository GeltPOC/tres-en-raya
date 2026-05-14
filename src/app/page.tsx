'use client'

import { useState } from 'react'

type Player = 'X' | 'O'
type Cell = Player | null
type Board = Cell[]

function calculateWinner(board: Board): Player | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ]
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player
    }
  }
  return null
}

export default function Home() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X')
  const [scores, setScores] = useState({ X: 0, O: 0 })

  const winner = calculateWinner(board)
  const isDraw = !winner && board.every((cell) => cell !== null)

  function handleClick(index: number) {
    if (board[index] || winner) return
    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)
    const newWinner = calculateWinner(newBoard)
    if (newWinner) {
      setScores((prev) => ({ ...prev, [newWinner]: prev[newWinner] + 1 }))
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
    }
  }

  function resetGame() {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
  }

  function resetAll() {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
    setScores({ X: 0, O: 0 })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-bold text-white mb-8 tracking-tight">Tres en Raya</h1>

      {/* Marcador */}
      <div className="flex gap-8 mb-8">
        <div className="bg-white/10 backdrop-blur rounded-xl px-8 py-4 text-center">
          <div className="text-2xl font-bold text-blue-300">X</div>
          <div className="text-4xl font-bold text-white">{scores.X}</div>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-xl px-8 py-4 text-center">
          <div className="text-2xl font-bold text-pink-300">O</div>
          <div className="text-4xl font-bold text-white">{scores.O}</div>
        </div>
      </div>

      {/* Estado del juego */}
      <div className="mb-6 text-xl font-semibold text-white/90 h-8">
        {winner ? (
          <span className="text-yellow-300">¡Ganó el jugador {winner}! 🎉</span>
        ) : isDraw ? (
          <span className="text-orange-300">¡Empate! 🤝</span>
        ) : (
          <span>
            Turno del jugador{' '}
            <span className={currentPlayer === 'X' ? 'text-blue-300' : 'text-pink-300'}>
              {currentPlayer}
            </span>
          </span>
        )}
      </div>

      {/* Tablero */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className={`w-24 h-24 rounded-2xl text-5xl font-bold transition-all duration-200 shadow-lg
              ${
                cell
                  ? 'cursor-not-allowed'
                  : winner
                  ? 'cursor-not-allowed bg-white/5'
                  : 'cursor-pointer hover:bg-white/30 active:scale-95'
              }
              ${
                cell === 'X'
                  ? 'bg-blue-500/30 text-blue-300'
                  : cell === 'O'
                  ? 'bg-pink-500/30 text-pink-300'
                  : 'bg-white/10'
              }
            `}
          >
            {cell}
          </button>
        ))}
      </div>

      {/* Botones */}
      <div className="flex gap-4">
        <button
          onClick={resetGame}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-all duration-200 active:scale-95"
        >
          Nueva Partida
        </button>
        <button
          onClick={resetAll}
          className="px-6 py-3 bg-red-500/30 hover:bg-red-500/50 text-white font-semibold rounded-xl transition-all duration-200 active:scale-95"
        >
          Reiniciar Todo
        </button>
      </div>
    </main>
  )
}
