import type { Direction } from '../game/types'

type DirectionPadProps = {
  onDirectionChange: (direction: Direction) => void
}

type DirectionButtonProps = {
  direction: Direction
  label: string
  className: string
  onDirectionChange: (direction: Direction) => void
}

function DirectionButton({ direction, label, className, onDirectionChange }: DirectionButtonProps) {
  const trigger = () => {
    onDirectionChange(direction)
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={`Move ${direction}`}
      onPointerDown={trigger}
      onClick={trigger}
    >
      {label}
    </button>
  )
}

export function DirectionPad({ onDirectionChange }: DirectionPadProps) {
  return (
    <div className="dpad" aria-label="Direction controls">
      <DirectionButton
        direction="up"
        label="↑"
        className="dpad-btn dpad-up"
        onDirectionChange={onDirectionChange}
      />
      <DirectionButton
        direction="left"
        label="←"
        className="dpad-btn dpad-left"
        onDirectionChange={onDirectionChange}
      />
      <span className="dpad-center" aria-hidden="true" />
      <DirectionButton
        direction="right"
        label="→"
        className="dpad-btn dpad-right"
        onDirectionChange={onDirectionChange}
      />
      <DirectionButton
        direction="down"
        label="↓"
        className="dpad-btn dpad-down"
        onDirectionChange={onDirectionChange}
      />
    </div>
  )
}
