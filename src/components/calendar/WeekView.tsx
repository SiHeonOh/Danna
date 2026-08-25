import { format, isToday } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { weekDays, TOTAL_SLOTS, minutesToTimeString, formatDisplayTime, SLOT_HEIGHT_PX } from '@/lib/dateUtils'
import { useDateLocale } from '@/hooks/useDateLocale'
import type { CalendarBlock as CalendarBlockType } from '@/types/app.types'
import TimeSlot from './TimeSlot'
import CalendarBlock from './CalendarBlock'
import CurrentTimeLine from './CurrentTimeLine'
import AllDaySection from './AllDaySection'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useEffect, useRef, useState, type ReactNode } from 'react'

interface WeekViewProps {
  date: Date
  blocks: CalendarBlockType[]
  allDayBlocks: CalendarBlockType[]
  dueTasks: CalendarBlockType[]
  activeDragId: string | null
  onSlotClick: (date: string, time: string) => void
  onBlockDoubleClick: (block: CalendarBlockType) => void
  onCompleteInstance: (block: CalendarBlockType) => void
  onAllDayClick: (block: CalendarBlockType) => void
  onAllDayAdd: (date: string) => void
  onDueToggle: (block: CalendarBlockType) => void
  planContent?: ReactNode
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  formatDisplayTime(minutesToTimeString(i * 60)),
)

export default function WeekView({
  date,
  blocks,
  allDayBlocks,
  dueTasks,
  activeDragId,
  onSlotClick,
  onBlockDoubleClick,
  onCompleteInstance,
  onAllDayClick,
  onAllDayAdd,
  onDueToggle,
  planContent,
}: WeekViewProps) {
  const days = weekDays(date)
  const isMobile = useIsMobile()
  // All-day strip expand/collapse — one state for all 7 days (Google Calendar pattern)
  const [allDayExpanded, setAllDayExpanded] = useState(false)

  // The grid's vertical scrollbar lives inside the scroll container, so its
  // 7 columns are computed on a narrower width than the header/all-day rows.
  // Measure the scrollbar and pad those rows so all column lines align.
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollbarW, setScrollbarW] = useState(0)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      setScrollbarW(0)
      return
    }
    const measure = () => setScrollbarW(el.offsetWidth - el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [planContent])
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const labelCol = isMobile ? 28 : 56

  // On mobile each day column is at least 44px wide — allow horizontal scroll if needed
  const minWeekWidth = isMobile ? labelCol + 7 * 44 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', overflowX: isMobile ? 'auto' : 'hidden' }}>
      {/* Day headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${labelCol}px repeat(7, minmax(0, 1fr))`,
          borderBottom: '2px solid var(--color-border)',
          flexShrink: 0,
          minWidth: minWeekWidth || undefined,
          paddingRight: scrollbarW,
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
                  {format(d, 'EEE', { locale: dateLocale }).toUpperCase()}
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
                {isMobile ? format(d, 'EEE d', { locale: dateLocale }) : format(d, 'd')}
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
          gridTemplateColumns: `${labelCol}px repeat(7, minmax(0, 1fr))`,
          borderBottom: '2px solid var(--color-border)',
          flexShrink: 0,
          minWidth: minWeekWidth || undefined,
          paddingRight: scrollbarW,
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
              whiteSpace: 'pre-line',
            }}
          >
            {t('calendar.allDay')}
          </span>
        </div>
        {days.map((d) => (
          <div key={d.toISOString()} style={{ borderRight: '2px solid var(--color-border)', minWidth: 0, overflow: 'hidden' }}>
            <AllDaySection
              date={format(d, 'yyyy-MM-dd')}
              blocks={allDayBlocks}
              dueTasks={dueTasks}
              onBlockClick={onAllDayClick}
              onAddClick={onAllDayAdd}
              onDueToggle={onDueToggle}
              expanded={allDayExpanded}
              onToggleExpand={() => setAllDayExpanded((v) => !v)}
            />
          </div>
        ))}
      </div>

      {/* Scrollable grid — replaced by plan panel when open on mobile */}
      {planContent ?? <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', minWidth: minWeekWidth || undefined }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${labelCol}px repeat(7, minmax(0, 1fr))`,
            height: 1440,
            position: 'relative',
            minWidth: minWeekWidth || undefined,
          }}
        >
          {/* Hour labels */}
          <div style={{ position: 'relative', borderRight: '2px solid var(--color-border)' }}>
            {/* Skip 12AM — it sits at the container's top edge and gets
                clipped under the all-day strip (Google Calendar does the same) */}
            {HOUR_LABELS.map((label, i) => i === 0 ? null : (
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
