import { format, isToday } from 'date-fns'
import type { CalendarBlock } from '@/types/app.types'
import TimeGrid from './TimeGrid'
import AllDaySection from './AllDaySection'

interface DayViewProps {
  date: Date
  blocks: CalendarBlock[]
  allDayBlocks: CalendarBlock[]
  activeDragId: string | null
  onSlotClick: (date: string, time: string) => void
  onBlockDoubleClick: (block: CalendarBlock) => void
  onCompleteInstance: (block: CalendarBlock) => void
  onAllDayClick: (block: CalendarBlock) => void
  onAllDayAdd: (date: string) => void
}

export default function DayView({
  date,
  blocks,
  allDayBlocks,
  activeDragId,
  onSlotClick,
  onBlockDoubleClick,
  onCompleteInstance,
  onAllDayClick,
  onAllDayAdd,
}: DayViewProps) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const dayBlocks = blocks.filter((b) => b.date === dateStr)
  const today = isToday(date)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Day header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          borderBottom: '2px solid var(--color-border)',
          flexShrink: 0,
          background: 'var(--bg-surface)',
          minHeight: 0,
        }}
      >
        {/* Left accent bar */}
        <div
          style={{
            width: 4,
            flexShrink: 0,
            background: today ? 'var(--color-primary)' : 'var(--color-border-bright)',
            boxShadow: today ? 'var(--glow-primary)' : 'none',
          }}
        />
        {/* Day name + date string */}
        <div
          style={{
            flex: 1,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <span
            className="font-display"
            style={{
              fontSize: 28,
              lineHeight: 1,
              color: today ? 'var(--color-primary)' : 'var(--color-text)',
              textShadow: today ? 'var(--glow-primary)' : 'none',
              letterSpacing: '0.06em',
            }}
          >
            {format(date, 'EEEE').toUpperCase()}
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: 10,
              color: 'var(--color-text-muted)',
              marginTop: 3,
              letterSpacing: '0.06em',
            }}
          >
            {format(date, 'yyyy-MM-dd')}
          </span>
        </div>
        {/* Large date number */}
        <div
          style={{
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="font-mono"
            style={{
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1,
              color: today ? 'var(--color-primary)' : 'var(--color-border-bright)',
              textShadow: today ? 'var(--glow-primary)' : 'none',
            }}
          >
            {format(date, 'd')}
          </span>
        </div>
      </div>

      {/* All-day section */}
      <div style={{ flexShrink: 0 }}>
        <AllDaySection
          date={dateStr}
          blocks={allDayBlocks}
          onBlockClick={onAllDayClick}
          onAddClick={onAllDayAdd}
        />
      </div>

      {/* Scrollable time grid */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TimeGrid
          date={dateStr}
          blocks={dayBlocks}
          activeDragId={activeDragId}
          isToday={today}
          onSlotClick={onSlotClick}
          onBlockDoubleClick={onBlockDoubleClick}
          onCompleteInstance={onCompleteInstance}
        />
      </div>
    </div>
  )
}
