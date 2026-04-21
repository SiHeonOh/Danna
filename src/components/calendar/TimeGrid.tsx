import { TOTAL_SLOTS, formatDisplayTime, minutesToTimeString } from '@/lib/dateUtils'
import type { CalendarBlock as CalendarBlockType } from '@/types/app.types'
import TimeSlot from './TimeSlot'
import CalendarBlock from './CalendarBlock'
import CurrentTimeLine from './CurrentTimeLine'

interface TimeGridProps {
  date: string
  blocks: CalendarBlockType[]
  activeDragId: string | null
  isToday: boolean
  onSlotClick: (date: string, time: string) => void
  onBlockDoubleClick: (block: CalendarBlockType) => void
  onCompleteInstance: (block: CalendarBlockType) => void
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  formatDisplayTime(minutesToTimeString(i * 60)),
)

export default function TimeGrid({
  date,
  blocks,
  activeDragId,
  isToday,
  onSlotClick,
  onBlockDoubleClick,
  onCompleteInstance,
}: TimeGridProps) {
  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Hour labels */}
      <div
        style={{
          width: 56,
          flexShrink: 0,
          position: 'relative',
          height: 1440,
          borderRight: '2px solid var(--color-border)',
          background: 'var(--bg-surface)',
        }}
      >
        {HOUR_LABELS.map((label, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: i * 60 - 7,
              right: 0,
              left: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: 8,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {/* Tick mark on the border */}
            <span
              className="font-mono"
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: i === 0 ? 'transparent' : 'var(--color-text-muted)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Grid column */}
      <div className="time-grid" style={{ flex: 1 }}>
        {/* Drop slots */}
        {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
          <TimeSlot key={i} date={date} slotIndex={i} onClick={onSlotClick} />
        ))}

        {/* Calendar blocks */}
        {blocks.map((block) => (
          <CalendarBlock
            key={block.key}
            block={block}
            isDragging={activeDragId === block.key}
            onDoubleClick={onBlockDoubleClick}
            onCompleteInstance={onCompleteInstance}
          />
        ))}

        {/* Current time line */}
        {isToday && <CurrentTimeLine />}
      </div>
    </div>
  )
}
