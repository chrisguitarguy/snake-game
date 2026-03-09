import { useRef, useState } from 'react'
import type { Direction } from '../game/types'

type JoystickProps = {
  onDirectionChange: (direction: Direction) => void
}

type Point = {
  x: number
  y: number
}

const MAX_RADIUS = 34
const DEAD_ZONE = 10
const SNAP_RADIUS = 28

export function Joystick({ onDirectionChange }: JoystickProps) {
  const [active, setActive] = useState(false)
  const [knobOffset, setKnobOffset] = useState<Point>({ x: 0, y: 0 })
  const pointerIdRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lastDirectionRef = useRef<Direction | null>(null)

  const getDirection = (x: number, y: number): Direction => {
    if (Math.abs(x) > Math.abs(y)) {
      return x > 0 ? 'right' : 'left'
    }
    return y > 0 ? 'down' : 'up'
  }

  const updateFromPointer = (clientX: number, clientY: number) => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const rect = container.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = clientX - centerX
    const dy = clientY - centerY
    const distance = Math.hypot(dx, dy)

    if (distance < DEAD_ZONE) {
      setKnobOffset({ x: 0, y: 0 })
      return
    }

    const direction = getDirection(dx, dy)

    const snapDistance = Math.min(MAX_RADIUS, SNAP_RADIUS)
    const snappedOffset: Point =
      direction === 'left'
        ? { x: -snapDistance, y: 0 }
        : direction === 'right'
          ? { x: snapDistance, y: 0 }
          : direction === 'up'
            ? { x: 0, y: -snapDistance }
            : { x: 0, y: snapDistance }

    setKnobOffset(snappedOffset)

    if (direction !== lastDirectionRef.current) {
      lastDirectionRef.current = direction
      onDirectionChange(direction)
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerIdRef.current = event.pointerId
    setActive(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromPointer(event.clientX, event.clientY)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!active || pointerIdRef.current !== event.pointerId) {
      return
    }

    updateFromPointer(event.clientX, event.clientY)
  }

  const resetJoystick = () => {
    setActive(false)
    setKnobOffset({ x: 0, y: 0 })
    pointerIdRef.current = null
    lastDirectionRef.current = null
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return
    }
    resetJoystick()
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return
    }
    resetJoystick()
  }

  return (
    <div className="joystick-wrap" aria-label="Joystick controller">
      <div
        className={`joystick ${active ? 'active' : ''}`}
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <span
          className="joystick-knob"
          style={{
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          }}
        />
      </div>
    </div>
  )
}
