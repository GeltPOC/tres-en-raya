'use client'

import { useState, useCallback } from 'react'

type Cell = 'X' | 'O' | null
type Board = Cell[]

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
]

function checkWinner(board: Board): { winner: Cell; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line }
    }
  }
  return null
}

function XIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
      <line x1="12" y1="12" x2="52" y2="52" stroke="#f472b6" strokeWidth="8" strokeLinecap="round" />
      <line x1="52" y1="12" x2="12" y2="52" stroke="#f472b6" strokeWidth="8" strokeLinecap="round" />
    </svg>
  )
}

function OIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
      <circle cx="32" cy="32" r="20" stroke="#60a5fa" strokeWidth="8" strokeLinecap="round" />
    </svg>
  )
}

export default function Home() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null))
  const [isXTurn, setIsXTurn] = useState(true)
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 })
  const [animatedCells, setAnimatedCells] = useState<Set<number>>(new Set())
  const [gameKey, setGameKey] = useState(0)

  const result = checkWinner(board)
  const isDraw = !result && board.every(cell => cell !== null)
  const gameOver = !!result || isDraw

  const handleClick = useCallback((index: number) => {
    if (board[index] || gameOver) return

    const newBoard = [...board]
    newBoard[index] = isXTurn ? 'X' : 'O'
    setBoard(newBoard)
    setIsXTurn(prev => !prev)
    setAnimatedCells(prev => new Set([...prev, index]))

    const newResult = checkWinner(newBoard)
    const newDraw = !newResult && newBoard.every(cell => cell !== null)

    if (newResult) {
      setScores(prev => ({ ...prev, [newResult.winner as string]: prev[newResult.winner as 'X' | 'O'] + 1 }))
    } else if (newDraw) {
      setScores(prev => ({ ...prev, draw: prev.draw + 1 }))
    }
  }, [board, isXTurn, gameOver])

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null))
    setIsXTurn(true)
    setAnimatedCells(new Set())
    setGameKey(prev => prev + 1)
  }, [])

  const winningLine = result?.line ?? []

  const currentPlayer = isXTurn ? 'X' : 'O'

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e]">
      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-black tracking-tight mb-1">
          <span className="text-pink-400">Tres</span>
          <span className="text-white"> en </span>
          <span className="text-blue-400">Raya</span>
        </h1>
        <p className="text-gray-400 text-sm">Tic-Tac-Toe clásico</p>
      </div>

      {/* Scoreboard */}
      <div className="flex gap-4 mb-8">
        <div className="flex flex-col items-center bg-white/5 border border-pink-500/30 rounded-2xl px-6 py-3 min-w-[80px]">
          <span className="text-pink-400 font-black text-2xl">{scores.X}</span>
          <span className="text-gray-400 text-xs font-semibold">Jugador X</span>
        </div>
        <div className="flex flex-col items-center bg-white/5 border border-gray-500/30 rounded-2xl px-6 py-3 min-w-[80px]">
          <span className="text-gray-300 font-black text-2xl">{scores.draw}</span>
          <span className="text-gray-400 text-xs font-semibold">Empates</span>
        </div>
        <div className="flex flex-col items-center bg-white/5 border border-blue-500/30 rounded-2xl px-6 py-3 min-w-[80px]">
          <span className="text-blue-400 font-black text-2xl">{scores.O}</span>
          <span className="text-gray-400 text-xs font-semibold">Jugador O</span>
        </div>
      </div>

      {/* Status */}
      <div className="mb-6 h-12 flex items-center justify-center">
        {!gameOver ? (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2">
            <span className="text-gray-300 text-sm font-semibold">Turno de</span>
            <span className={`font-black text-lg ${currentPlayer === 'X' ? 'text-pink-400' : 'text-blue-400'}`}>
              {currentPlayer === 'X' ? '✕' : '◯'} Jugador {currentPlayer}
            </span>
          </div>
        ) : (
          <div key={`result-${gameKey}`} className="animate-fade-in">
            {result ? (
              <div className={`flex items-center gap-2 rounded-full px-6 py-2 font-black text-lg ${
                result.winner === 'X'
                  ? 'bg-pink-500/20 border border-pink-500/50 text-pink-300'
                  : 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
              }`}>
                <span>🎉</span>
                <span>¡Jugador {result.winner} gana!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-500/20 border border-gray-500/50 rounded-full px-6 py-2 font-black text-lg text-gray-300">
                <span>🤝</span>
                <span>¡Empate!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Board */}
      <div
        key={`board-${gameKey}`}
        className="grid grid-cols-3 gap-3 mb-8"
        style={{ width: 'min(90vw, 320px)', height: 'min(90vw, 320px)' }}
      >
        {board.map((cell, index) => {
          const isWinningCell = winningLine.includes(index)
          const isAnimated = animatedCells.has(index)

          return (
            <button
              key={index}
              onClick={() => handleClick(index)}
              disabled={!!cell || gameOver}
              className={`
                relative rounded-2xl flex items-center justify-center
                transition-all duration-200
                border-2
                ${
                  isWinningCell
                    ? cell === 'X'
                      ? 'bg-pink-500/25 border-pink-400 shadow-lg shadow-pink-500/30'
                      : 'bg-blue-500/25 border-blue-400 shadow-lg shadow-blue-500/30'
                    : cell
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer active:scale-95'
                }
              `}
            >
              {cell && (
                <div
                  className={`w-3/5 h-3/5 ${isAnimated ? 'animate-pop-in' : ''}`}
                >
                  {cell === 'X' ? <XIcon /> : <OIcon />}
                </div>
              )}
              {!cell && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-20 transition-opacity duration-150">
                  <div className="w-3/5 h-3/5">
                    {currentPlayer === 'X' ? <XIcon /> : <OIcon />}
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Reset Button */}
      <button
        onClick={resetGame}
        className="
          px-8 py-3 rounded-full font-bold text-sm
          bg-gradient-to-r from-pink-500 to-blue-500
          text-white shadow-lg shadow-purple-500/30
          hover:from-pink-400 hover:to-blue-400
          hover:shadow-purple-500/50
          active:scale-95
          transition-all duration-200
        "
      >
        Nueva Partida
      </button>

      {/* Win lines decoration */}
      <div className="mt-8 flex gap-2 opacity-30">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
        ))}
      </div>
    </main>
  )
}
