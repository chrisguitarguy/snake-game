import type { Cell, Direction, GameSnapshot, StepResult } from './types'

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

const DIRECTION_DELTA: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export const DEFAULT_GRID_SIZE = 20

export function areCellsEqual(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y
}

export function canTurn(current: Direction, next: Direction): boolean {
  return OPPOSITE_DIRECTION[current] !== next
}

export function sanitizeDirection(current: Direction, next: Direction): Direction {
  return canTurn(current, next) ? next : current
}

export function isCellOnSnake(cell: Cell, snake: Cell[]): boolean {
  return snake.some((part) => areCellsEqual(part, cell))
}

export function spawnFood(
  gridSize: number,
  snake: Cell[],
  random: () => number = Math.random,
): Cell {
  const openCells: Cell[] = []

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const cell = { x, y }
      if (!isCellOnSnake(cell, snake)) {
        openCells.push(cell)
      }
    }
  }

  if (openCells.length === 0) {
    return { x: 0, y: 0 }
  }

  const index = Math.floor(random() * openCells.length)
  return openCells[index]
}

export function createInitialSnake(gridSize: number): Cell[] {
  const center = Math.floor(gridSize / 2)
  return [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
  ]
}

export function createInitialSnapshot(
  gridSize: number = DEFAULT_GRID_SIZE,
  random: () => number = Math.random,
): GameSnapshot {
  const snake = createInitialSnake(gridSize)

  return {
    snake,
    direction: 'right',
    queuedDirection: 'right',
    food: spawnFood(gridSize, snake, random),
    score: 0,
    status: 'idle',
  }
}

export function getNextHead(head: Cell, direction: Direction): Cell {
  const delta = DIRECTION_DELTA[direction]
  return {
    x: head.x + delta.x,
    y: head.y + delta.y,
  }
}

function isOutOfBounds(cell: Cell, gridSize: number): boolean {
  return cell.x < 0 || cell.y < 0 || cell.x >= gridSize || cell.y >= gridSize
}

export function stepGame(
  snapshot: GameSnapshot,
  gridSize: number,
  random: () => number = Math.random,
): StepResult {
  if (snapshot.status !== 'running') {
    return { snapshot, ateFood: false, collided: false }
  }

  const direction = sanitizeDirection(snapshot.direction, snapshot.queuedDirection)
  const currentHead = snapshot.snake[0]
  const nextHead = getNextHead(currentHead, direction)
  const ateFood = areCellsEqual(nextHead, snapshot.food)
  const bodyToCheck = ateFood ? snapshot.snake : snapshot.snake.slice(0, -1)
  const collided = isOutOfBounds(nextHead, gridSize) || isCellOnSnake(nextHead, bodyToCheck)

  if (collided) {
    return {
      snapshot: {
        ...snapshot,
        direction,
        queuedDirection: direction,
        status: 'over',
      },
      ateFood: false,
      collided: true,
    }
  }

  const nextSnake = [nextHead, ...snapshot.snake]
  if (!ateFood) {
    nextSnake.pop()
  }

  return {
    snapshot: {
      ...snapshot,
      snake: nextSnake,
      direction,
      queuedDirection: direction,
      food: ateFood ? spawnFood(gridSize, nextSnake, random) : snapshot.food,
      score: ateFood ? snapshot.score + 1 : snapshot.score,
      status: 'running',
    },
    ateFood,
    collided: false,
  }
}

export function queueDirection(snapshot: GameSnapshot, direction: Direction): GameSnapshot {
  const safeDirection = sanitizeDirection(snapshot.direction, direction)
  return {
    ...snapshot,
    queuedDirection: safeDirection,
  }
}

export function getTickMs(score: number): number {
  const speedStep = Math.floor(score / 3)
  return Math.max(65, 150 - speedStep * 8)
}

export function getStatusMessage(snapshot: GameSnapshot): string {
  if (snapshot.status === 'idle') {
    return 'Press Start to begin.'
  }
  if (snapshot.status === 'paused') {
    return 'Paused. Press Resume to continue.'
  }
  if (snapshot.status === 'over') {
    return 'Game over. Hit Restart for another run.'
  }
  return 'Use arrows or swipe to steer.'
}

export function pointsForWin(gridSize: number): number {
  return gridSize * gridSize - 3
}

export function isVictory(snapshot: GameSnapshot, gridSize: number): boolean {
  return snapshot.score >= pointsForWin(gridSize)
}

export function withStatus(snapshot: GameSnapshot, status: GameSnapshot['status']): GameSnapshot {
  return {
    ...snapshot,
    status,
  }
}

export function clearTailPreview(snapshot: GameSnapshot): Cell {
  return snapshot.snake[snapshot.snake.length - 1]
}

export function tailWillMove(snapshot: GameSnapshot): boolean {
  const head = snapshot.snake[0]
  const nextHead = getNextHead(head, sanitizeDirection(snapshot.direction, snapshot.queuedDirection))
  return !areCellsEqual(nextHead, snapshot.food)
}

export function wouldCollideNext(snapshot: GameSnapshot, gridSize: number): boolean {
  const head = snapshot.snake[0]
  const direction = sanitizeDirection(snapshot.direction, snapshot.queuedDirection)
  const nextHead = getNextHead(head, direction)
  const bodyToCheck = tailWillMove(snapshot) ? snapshot.snake.slice(0, -1) : snapshot.snake
  return isOutOfBounds(nextHead, gridSize) || isCellOnSnake(nextHead, bodyToCheck)
}

export function keepRunning(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.status === 'running') {
    return snapshot
  }
  return {
    ...snapshot,
    status: 'running',
  }
}

export function pause(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.status !== 'running') {
    return snapshot
  }
  return {
    ...snapshot,
    status: 'paused',
  }
}

export function resetGame(
  gridSize: number = DEFAULT_GRID_SIZE,
  random: () => number = Math.random,
): GameSnapshot {
  return {
    ...createInitialSnapshot(gridSize, random),
    status: 'running',
  }
}
