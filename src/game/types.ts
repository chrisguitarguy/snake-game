export type Direction = 'up' | 'down' | 'left' | 'right'

export type GameStatus = 'idle' | 'running' | 'paused' | 'over'

export type Cell = {
  x: number
  y: number
}

export type GameSnapshot = {
  snake: Cell[]
  direction: Direction
  queuedDirection: Direction
  food: Cell
  score: number
  status: GameStatus
}

export type StepResult = {
  snapshot: GameSnapshot
  ateFood: boolean
  collided: boolean
}
