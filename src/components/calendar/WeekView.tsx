import { format, isToday } from 'date-fns'
import { weekDays, TOTAL_SLOTS, minutesToTimeString, formatDisplayTime, SLOT_HEIGHT_PX } from '@/lib/dateUtils'
import type { CalendarBlock as CalendarBlockType } from '@/types/app.types'
import TimeSlot from './TimeSlot'
import CalendarBlock from './CalendarBlock'
import CurrentTimeLine from './CurrentTimeLine'
import AllDaySection from './AllDaySection'

interface WeekViewProps {
  date: Date
  blocks: CalendarBlockType[]
  allDayBlocks: CalendarBlockType[]
  activeDragId: string | null
  onSlotClick: (date: string, time: string) => void
  onBlockDoubleClick: (block: CalendarBlockType) => void
  onCompleteInstance: (block: CalendarBlockType) => void
  onAllDayClick: (block: CalendarBlockType) => void
  onAllDayAdd: (date: string) => void
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  formatDisplayTime(minutesToTimeString(i * 60)),
)

export default function WeekView({
  date,
  blocks,
  allDayBlocks,
  activeDragId,
  onSlotClick,
  onBlockDoubleClick,
  onCompleteInstance,
  onAllDayClick,
  onAllDayAdd,
}: WeekViewProps) {
  const days = weekDays(date)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Day headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '56px repeat(7, 1fr)',
          borderBottom: '2px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <div style={{ borderRight: '2px solid var(--color-border)' }} />
        {days.map((d) => {
          const today = isToday(d)
          return (
            <div
              key={d.toISOString()}
              style={{
                height: 64,
                padding: '8px 4px 0',
                borderRight: '2px solid var(--color-border)',
                textAlign: 'center',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="font-display"
                style={{
                  fontSize: 13,
                  color: today ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  letterSpacing: '0.1em',
                  lineHeight: 1,
                }}
              >
                {format(d, 'EEE').toUpperCase()}
              </span>
              <span
                className="font-mono"
                style={{
                  display: 'block',
                  fontSize: 22,
                  fontWeight: 700,
                  color: today ? 'var(--color-primary)' : 'var(--color-text)',
                  textShadow: today ? 'var(--glow-primary)' : 'none',
                  lineHeight: 1.1,
                  marginTop: 2,
                }}
              >
                {format(d, 'd')}
              </span>
              {today && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: 'var(--color-primary)',
                    boxShadow: 'var(--glow-primary)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* All-day row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '56px repeat(7, 1fr)',
          borderBottom: '2px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            borderRight: '2px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="font-display"
            style={{
              fontSize: 9,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.1em',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
            }}
          >
            ALL-DAY
          </span>
        </div>
        {days.map((d) => (
          <div key={d.toISOString()} style={{ borderRight: '2px solid var(--color-border)' }}>
            <AllDaySection
              date={format(d, 'yyyy-MM-dd')}
              blocks={allDayBlocks}
              onBlockClick={onAllDayClick}
              onAddClick={onAllDayAdd}
            />
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '56px repeat(7, 1fr)',
            height: 1440,
            position: 'relative',
          }}
        >
          {/* Hour labels */}
          <div style={{ position: 'relative', borderRight: '2px solid var(--color-border)' }}>
            {HOUR_LABELS.map((label, i) => (
              <div
                key={i}
                className="font-mono"
                style={{
                  position: 'absolute',
                  top: i * 60 * (SLOT_HEIGHT_PX / 15) - 6,
                  right: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  textAlign: 'right',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => {
            const dateStr = format(d, 'yyyy-MM-dd')
            const dayBlocks = blocks.filter((b) => b.date === dateStr)

            return (
              <div
                key={dateStr}
                className="time-grid"
                style={{ borderRight: '2px solid var(--color-border)', height: 1440 }}
              >
                {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
                  <TimeSlot key={i} date={dateStr} slotIndex={i} onClick={onSlotClick} />
                ))}
                {dayBlocks.map((block) => (
                  <CalendarBlock
                    key={block.key}
                    block={block}
                    isDragging={activeDragId === block.key}
                    onDoubleClick={onBlockDoubleClick}
                    onCompleteInstance={onCompleteInstance}
                  />
                ))}
                {isToday(d) && <CurrentTimeLine />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
