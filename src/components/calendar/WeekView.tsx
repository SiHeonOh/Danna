import { format, isToday } from 'date-fns'
import { weekDays, TOTAL_SLOTS, minutesToTimeString, formatDisplayTime, SLOT_HEIGHT_PX } from '@/lib/dateUtils'
import type { CalendarBlock as CalendarBlockType } from '@/types/app.types'
import TimeSlot from './TimeSlot'
import CalendarBlock from './CalendarBlock'
import CurrentTimeLine from './CurrentTimeLine'
import AllDaySection from './AllDaySection'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { ReactNode } from 'react'

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
  planContent?: ReactNode
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
  planContent,
}: WeekViewProps) {
  const days = weekDays(date)
  const isMobile = useIsMobile()
  const labelCol = isMobile ? 28 : 56

  // On mobile each day column is at least 44px wide — allow horizontal scroll if needed
  const minWeekWidth = isMobile ? labelCol + 7 * 44 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', overflowX: isMobile ? 'auto' : 'hidden' }}>
      {/* Day headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${labelCol}px repeat(7, 1fr)`,
          borderBottom: '2px solid var(--color-border)',
          flexShrink: 0,
          minWidth: minWeekWidth || undefined,
        }}
      >
        <div style={{ borderRight: '2px solid var(--color-border)' }} />
        {days.map((d) => {
          const today = isToday(d)
          return (
            <div
              key={d.toISOString()}
              style={{
                height: isMobile ? 44 : 64,
                padding: isMobile ? '4px 2px 0' : '8px 4px 0',
                borderRight: '2px solid var(--color-border)',
                textAlign: 'center',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!isMobile && (
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
              )}
              <span
                className="font-mono"
                style={{
                  display: 'block',
                  fontSize: isMobile ? 13 : 22,
                  fontWeight: 700,
                  color: today ? 'var(--color-primary)' : 'var(--color-text)',
                  textShadow: today ? 'var(--glow-primary)' : 'none',
                  lineHeight: 1.1,
                  marginTop: isMobile ? 0 : 2,
                }}
              >
                {format(d, isMobile ? 'EEE d' : 'd')}
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
          gridTemplateColumns: `${labelCol}px repeat(7, 1fr)`,
          borderBottom: '2px solid var(--color-border)',
          flexShrink: 0,
          minWidth: minWeekWidth || undefined,
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
            className="font-mono"
            style={{
              fontSize: 8,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.06em',
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            ALL{'\n'}DAY
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

      {/* Scrollable grid — replaced by plan panel when open on mobile */}
      {planContent ?? <div style={{ flex: 1, overflowY: 'auto', minWidth: minWeekWidth || undefined }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${labelCol}px repeat(7, 1fr)`,
            height: 1440,
            position: 'relative',
            minWidth: minWeekWidth || undefined,
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
                  right: isMobile ? 3 : 8,
                  fontSize: isMobile ? 8 : 10,
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
      </div>}
    </div>
  )
}
