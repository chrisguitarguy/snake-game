import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_GRID_SIZE,
  createInitialSnapshot,
  getStatusMessage,
  getTickMs,
  isVictory,
  keepRunning,
  pause,
  queueDirection,
  resetGame,
  stepGame,
  withStatus,
} from '../game/logic'
import type { Direction, GameSnapshot } from '../game/types'
import { useSwipeControls } from '../hooks/useSwipeControls'

const CELL_SIZE = 24
const BOARD_PIXELS = DEFAULT_GRID_SIZE * CELL_SIZE
const BEST_SCORE_KEY = 'snake-pwa-best-score'

function readBestScore(): number {
  const value = window.localStorage.getItem(BEST_SCORE_KEY)
  if (!value) {
    return 0
  }

  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    return 0
  }

  return parsed
}

export function SnakeGame() {
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => createInitialSnapshot(DEFAULT_GRID_SIZE))
  const [bestScore, setBestScore] = useState(() => readBestScore())
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const previousTimeRef = useRef<number>(0)
  const accumulatorRef = useRef<number>(0)
  const bestScoreRef = useRef(bestScore)

  useEffect(() => {
    bestScoreRef.current = bestScore
  }, [bestScore])

  const syncBestScore = useCallback((score: number) => {
    if (score <= bestScoreRef.current) {
      return
    }

    bestScoreRef.current = score
    setBestScore(score)
    window.localStorage.setItem(BEST_SCORE_KEY, String(score))
  }, [])

  const drawGame = useCallback((frame: GameSnapshot) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    context.fillStyle = '#f6f2e8'
    context.fillRect(0, 0, BOARD_PIXELS, BOARD_PIXELS)

    const pulse = Math.max(0, Math.sin(performance.now() / 180) * 0.15)
    context.fillStyle = '#e4572e'
    context.beginPath()
    context.arc(
      frame.food.x * CELL_SIZE + CELL_SIZE / 2,
      frame.food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE * (0.36 + pulse),
      0,
      Math.PI * 2,
    )
    context.fill()

    frame.snake.forEach((part, index) => {
      context.fillStyle = index === 0 ? '#1a7f64' : '#2eaa8f'
      context.fillRect(part.x * CELL_SIZE + 1, part.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)

      if (index === 0) {
        context.fillStyle = '#f6f2e8'
        const eyeOffsetX = frame.direction === 'left' ? 6 : frame.direction === 'right' ? 14 : 9
        const eyeOffsetYBase = frame.direction === 'up' ? 6 : frame.direction === 'down' ? 14 : 9
        context.fillRect(part.x * CELL_SIZE + eyeOffsetX, part.y * CELL_SIZE + eyeOffsetYBase, 3, 3)
        context.fillRect(
          part.x * CELL_SIZE + (frame.direction === 'left' ? 6 : frame.direction === 'right' ? 14 : 13),
          part.y * CELL_SIZE + (frame.direction === 'up' ? 13 : frame.direction === 'down' ? 14 : 9),
          3,
          3,
        )
      }
    })
  }, [])

  useEffect(() => {
    drawGame(snapshot)
  }, [drawGame, snapshot])

  useEffect(() => {
    if (snapshot.status !== 'running') {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const tickMs = getTickMs(snapshot.score)

    const loop = (time: number) => {
      if (previousTimeRef.current === 0) {
        previousTimeRef.current = time
      }

      const delta = time - previousTimeRef.current
      previousTimeRef.current = time
      accumulatorRef.current += delta

      if (accumulatorRef.current >= tickMs) {
        accumulatorRef.current %= tickMs

        setSnapshot((current) => {
          const result = stepGame(current, DEFAULT_GRID_SIZE)
          syncBestScore(result.snapshot.score)
          if (!result.collided && isVictory(result.snapshot, DEFAULT_GRID_SIZE)) {
            return withStatus(result.snapshot, 'over')
          }
          return result.snapshot
        })
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
      rafRef.current = null
      previousTimeRef.current = 0
      accumulatorRef.current = 0
    }
  }, [snapshot.score, snapshot.status, syncBestScore])

  const handleDirection = useCallback((direction: Direction) => {
    setSnapshot((current) => queueDirection(current, direction))
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, Direction | undefined> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      }

      const direction = keyMap[event.key]
      if (!direction) {
        return
      }

      event.preventDefault()
      handleDirection(direction)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [handleDirection])

  const { onTouchEnd, onTouchStart } = useSwipeControls(handleDirection)

  const statusText = useMemo(() => getStatusMessage(snapshot), [snapshot])

  const onStart = () => {
    setSnapshot((current) => keepRunning(current))
  }

  const onPause = () => {
    setSnapshot((current) => pause(current))
  }

  const onRestart = () => {
    setSnapshot(resetGame(DEFAULT_GRID_SIZE))
    previousTimeRef.current = 0
    accumulatorRef.current = 0
  }

  return (
    <main className="shell">
      <section className="title-card">
        <p className="eyebrow">Progressive Web App</p>
        <h1>Snake Sprint</h1>
        <p className="subtitle">No backend, no shared state, just responsive React gameplay.</p>
      </section>

      <section className="scoreboard" aria-label="Scoreboard">
        <div>
          <span>Score</span>
          <strong>{snapshot.score}</strong>
        </div>
        <div>
          <span>Best</span>
          <strong>{bestScore}</strong>
        </div>
        <div>
          <span>Speed</span>
          <strong>{Math.round(1000 / getTickMs(snapshot.score))} fps</strong>
        </div>
      </section>

      <div className="board-wrap" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <canvas
          aria-label="Snake board"
          className="board"
          ref={canvasRef}
          width={BOARD_PIXELS}
          height={BOARD_PIXELS}
        />
      </div>

      <p className="status">{statusText}</p>

      <div className="actions">
        <button type="button" onClick={onStart} disabled={snapshot.status === 'running'}>
          {snapshot.status === 'paused' ? 'Resume' : 'Start'}
        </button>
        <button type="button" onClick={onPause} disabled={snapshot.status !== 'running'}>
          Pause
        </button>
        <button type="button" onClick={onRestart}>
          Restart
        </button>
      </div>

      <p className="tips">Controls: Arrow keys / WASD / swipe on mobile.</p>
    </main>
  )
}
