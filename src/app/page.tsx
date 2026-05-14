'use client'

import { useState, useCallback } from 'react'

type Cell = 'X' | 'O' | null
type Mode = '2p' | 'ai'
type Difficulty = 'easy' | 'hard'

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
]

function checkWinner(board: Cell[]): { winner: Cell; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line }
    }
  }
  return null
}

function isBoardFull(board: Cell[]): boolean {
  return board.every(cell => cell !== null)
}

function minimax(board: Cell[], isMaximizing: boolean, depth: number): number {
  const result = checkWinner(board)
  if (result?.winner === 'O') return 10 - depth
  if (result?.winner === 'X') return depth - 10
  if (isBoardFull(board)) return 0

  if (isMaximizing) {
    let best = -Infinity
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O'
        best = Math.max(best, minimax(board, false, depth + 1))
        board[i] = null
      }
    }
    return best
  } else {
    let best = Infinity
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'X'
        best = Math.min(best, minimax(board, true, depth + 1))
        board[i] = null
      }
    }
    return best
  }
}

function getBestMove(board: Cell[]): number {
  let bestVal = -Infinity
  let bestMove = -1
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = 'O'
      const val = minimax(board, false, 0)
      board[i] = null
      if (val > bestVal) {
        bestVal = val
        bestMove = i
      }
    }
  }
  return bestMove
}

function getRandomMove(board: Cell[]): number {
  const empty = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1)
  return empty[Math.floor(Math.random() * empty.length)]
}

export default function TresEnRaya() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null))
  const [isXTurn, setIsXTurn] = useState(true)
  const [mode, setMode] = useState<Mode>('2p')
  const [difficulty, setDifficulty] = useState<Difficulty>('hard')
  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 })
  const [gameOver, setGameOver] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [winLine, setWinLine] = useState<number[]>([])
  const [thinking, setThinking] = useState(false)

  const winResult = checkWinner(board)

  const resetBoard = useCallback(() => {
    setBoard(Array(9).fill(null))
    setIsXTurn(true)
    setGameOver(false)
    setStatusMsg('')
    setWinLine([])
    setThinking(false)
  }, [])

  const resetAll = useCallback(() => {
    resetBoard()
    setScore({ X: 0, O: 0, draw: 0 })
  }, [resetBoard])

  const handleAiMove = useCallback((currentBoard: Cell[], currentDifficulty: Difficulty) => {
    setThinking(true)
    setTimeout(() => {
      const newBoard = [...currentBoard]
      const move = currentDifficulty === 'hard' ? getBestMove(newBoard) : getRandomMove(newBoard)
      if (move === -1) {
        setThinking(false)
        return
      }
      newBoard[move] = 'O'
      setBoard(newBoard)
      setThinking(false)

      const res = checkWinner(newBoard)
      if (res) {
        setWinLine(res.line)
        setScore(s => ({ ...s, O: s.O + 1 }))
        setStatusMsg(mode === 'ai' ? '🤖 La IA gana!' : '¡O gana!')
        setGameOver(true)
      } else if (isBoardFull(newBoard)) {
        setScore(s => ({ ...s, draw: s.draw + 1 }))
        setStatusMsg('¡Empate!')
        setGameOver(true)
      } else {
        setIsXTurn(true)
      }
    }, 400)
  }, [mode])

  const handleClick = useCallback((index: number) => {
    if (board[index] || gameOver || thinking) return
    if (mode === 'ai' && !isXTurn) return

    const newBoard = [...board]
    const currentPlayer: Cell = isXTurn ? 'X' : 'O'
    newBoard[index] = currentPlayer
    setBoard(newBoard)

    const res = checkWinner(newBoard)
    if (res) {
      setWinLine(res.line)
      setScore(s => ({ ...s, [res.winner as string]: s[res.winner as 'X' | 'O'] + 1 }))
      setStatusMsg(`¡${res.winner} gana!`)
      setGameOver(true)
      return
    }
    if (isBoardFull(newBoard)) {
      setScore(s => ({ ...s, draw: s.draw + 1 }))
      setStatusMsg('¡Empate!')
      setGameOver(true)
      return
    }

    if (mode === 'ai') {
      setIsXTurn(false)
      handleAiMove(newBoard, difficulty)
    } else {
      setIsXTurn(!isXTurn)
    }
  }, [board, gameOver, thinking, mode, isXTurn, difficulty, handleAiMove])

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode)
    resetBoard()
    setScore({ X: 0, O: 0, draw: 0 })
  }

  const currentTurnLabel = () => {
    if (gameOver) return statusMsg
    if (thinking) return '🤖 Pensando...'
    if (mode === 'ai') return isXTurn ? 'Tu turno (X)' : '🤖 Turno de la IA'
    return `Turno de ${isXTurn ? 'X' : 'O'}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-white">Tres en Raya</h1>
      <p className="text-gray-400 mb-6 text-sm">Tic-Tac-Toe</p>

      {/* Mode selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleModeChange('2p')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            mode === '2p'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          👥 2 Jugadores
        </button>
        <button
          onClick={() => handleModeChange('ai')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            mode === 'ai'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          🤖 vs IA
        </button>
      </div>

      {/* Difficulty (only in AI mode) */}
      {mode === 'ai' && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setDifficulty('easy')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              difficulty === 'easy'
                ? 'bg-green-600 text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Fácil
          </button>
          <button
            onClick={() => setDifficulty('hard')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              difficulty === 'hard'
                ? 'bg-red-600 text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            Difícil
          </button>
        </div>
      )}

      {/* Score */}
      <div className="flex gap-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{score.X}</div>
          <div className="text-xs text-gray-400">{mode === 'ai' ? 'Tú (X)' : 'X'}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400">{score.draw}</div>
          <div className="text-xs text-gray-400">Empate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-rose-400">{score.O}</div>
          <div className="text-xs text-gray-400">{mode === 'ai' ? 'IA (O)' : 'O'}</div>
        </div>
      </div>

      {/* Status */}
      <div className={`mb-4 text-lg font-semibold min-h-[1.75rem] transition-all ${
        gameOver ? 'text-yellow-400 animate-pulse' : 'text-gray-300'
      }`}>
        {currentTurnLabel()}
      </div>

      {/* Board */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {board.map((cell, i) => {
          const isWinCell = winLine.includes(i)
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={!!cell || gameOver || thinking || (mode === 'ai' && !isXTurn)}
              className={`w-24 h-24 rounded-2xl text-5xl font-extrabold flex items-center justify-center transition-all duration-200 border-2 ${
                isWinCell
                  ? 'bg-yellow-500/20 border-yellow-400 scale-105 shadow-lg shadow-yellow-500/30'
                  : cell
                  ? 'bg-white/5 border-white/10 cursor-default'
                  : 'bg-white/5 border-white/10 hover:bg-white/15 hover:border-white/30 hover:scale-105 cursor-pointer'
              }`}
            >
              {cell === 'X' && (
                <span className={`${
                  isWinCell ? 'text-yellow-300' : 'text-blue-400'
                } drop-shadow`}>X</span>
              )}
              {cell === 'O' && (
                <span className={`${
                  isWinCell ? 'text-yellow-300' : 'text-rose-400'
                } drop-shadow`}>O</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={resetBoard}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20"
        >
          Nueva partida
        </button>
        <button
          onClick={resetAll}
          className="px-5 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg font-semibold text-sm transition-all"
        >
          Reiniciar puntos
        </button>
      </div>

      <p className="mt-8 text-xs text-gray-600">GeltPOC / tres-en-raya</p>
    </div>
  )
}
