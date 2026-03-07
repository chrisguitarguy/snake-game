import { describe, expect, it } from 'vitest'
import {
  createInitialSnapshot,
  queueDirection,
  resetGame,
  spawnFood,
  stepGame,
} from './logic'

describe('snake logic', () => {
  it('prevents immediate reverse turns', () => {
    const game = resetGame(12)
    const queued = queueDirection(game, 'left')

    expect(queued.queuedDirection).toBe('right')
  })

  it('grows and scores when food is eaten', () => {
    const initial = resetGame(10)
    const head = initial.snake[0]

    const result = stepGame(
      {
        ...initial,
        food: { x: head.x + 1, y: head.y },
      },
      10,
      () => 0,
    )

    expect(result.ateFood).toBe(true)
    expect(result.collided).toBe(false)
    expect(result.snapshot.score).toBe(1)
    expect(result.snapshot.snake).toHaveLength(initial.snake.length + 1)
  })

  it('ends game when snake hits wall', () => {
    const result = stepGame(
      {
        snake: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
        direction: 'left',
        queuedDirection: 'left',
        food: { x: 5, y: 5 },
        score: 0,
        status: 'running',
      },
      8,
    )

    expect(result.collided).toBe(true)
    expect(result.snapshot.status).toBe('over')
  })

  it('spawns food on open cells only', () => {
    const food = spawnFood(
      2,
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
      () => 0,
    )

    expect(food).toEqual({ x: 1, y: 1 })
  })

  it('does not step game while idle', () => {
    const idle = createInitialSnapshot(16)
    const result = stepGame(idle, 16)

    expect(result.snapshot).toEqual(idle)
    expect(result.collided).toBe(false)
  })
})
