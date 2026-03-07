import { useRef } from 'react'
import type { Direction } from '../game/types'

type SwipePoint = {
  x: number
  y: number
}

const MIN_SWIPE_DISTANCE = 24

export function useSwipeControls(onDirection: (direction: Direction) => void) {
  const startPointRef = useRef<SwipePoint | null>(null)

  const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.touches[0]
    startPointRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const start = startPointRef.current
    if (!start) {
      return
    }

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y

    startPointRef.current = null

    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE && Math.abs(deltaY) < MIN_SWIPE_DISTANCE) {
      return
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      onDirection(deltaX > 0 ? 'right' : 'left')
      return
    }

    onDirection(deltaY > 0 ? 'down' : 'up')
  }

  return {
    onTouchStart,
    onTouchEnd,
  }
}
