import { format, isToday, isSameMonth, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { usePlanner } from '@/context/PlannerContext'
import { useCalendarView, useAllDayItems } from '@/hooks/useCalendarView'
import type { CalendarBlock } from '@/types/app.types'

interface MonthViewProps {
  date: Date
  onDayClick: (date: Date) => void
  onBlockDoubleClick: (block: CalendarBlock) => void
}

export default function MonthView({ date, onDayClick, onBlockDoubleClick }: MonthViewProps) {
  const { items, tags, rules, overrides, toggleComplete } = usePlanner()
  const { t } = useTranslation()
  const DOW = t('calendar.dow', { returnObjects: true }) as string[]

  const monthStart = startOfMonth(date)
  const monthEnd   = endOfMonth(date)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 1 })
  const days       = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const blocks     = useCalendarView({ items, rules, overrides, tags, from: gridStart, to: gridEnd })
  const allDay     = useAllDayItems(items, rules, overrides, tags, gridStart, gridEnd)

  function blocksForDay(d: Date): CalendarBlock[] {
    const ds = format(d, 'yyyy-MM-dd')
    return [...allDay.filter(b => b.date === ds), ...blocks.filter(b => b.date === ds)]
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  // Unscheduled to-do tasks for each day (date set, no time)
  function todoForDay(d: Date) {
    const ds = format(d, 'yyyy-MM-dd')
    return items.filter(i => i.type === 'task' && i.date === ds && !i.start_time)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* Day-of-week header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        borderBottom: '2px solid var(--color-border)',
        flexShrink: 0,
        background: 'var(--bg-elevated)',
      }}>
        {DOW.map((d) => (
          <div key={d} style={{
            padding: '6px 0',
            textAlign: 'center',
            borderRight: '1px solid var(--color-border)',
          }}>
            <span className="font-mono" style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.1em',
            }}>
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gridTemplateRows: `repeat(${days.length / 7}, 1fr)`,
        flex: 1,
        overflow: 'hidden',
      }}>
        {days.map((day) => {
          const inMonth   = isSameMonth(day, date)
          const todayFlag = isToday(day)
          const ds        = format(day, 'yyyy-MM-dd')
          const dayBlocks = blocksForDay(day)
          const todos     = todoForDay(day)
          const MAX_VISIBLE = 3
          const overflow  = dayBlocks.length + todos.length - MAX_VISIBLE

          return (
            <div
              key={ds}
              onClick={() => onDayClick(day)}
              style={{
                borderRight: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)',
                padding: '4px 5px',
                overflow: 'hidden',
                cursor: 'pointer',
                background: todayFlag
                  ? 'color-mix(in srgb, var(--color-primary) 6%, var(--bg-surface))'
                  : inMonth
                    ? 'var(--bg-surface)'
                    : 'var(--bg-base)',
                opacity: inMonth ? 1 : 0.45,
                position: 'relative',
                transition: 'background 0.1s',
              }}
            >
              {/* Date number */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 3,
              }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: todayFlag ? 'var(--color-primary)' : 'var(--color-text)',
                    lineHeight: 1,
                    background: todayFlag ? 'transparent' : 'transparent',
                  }}
                >
                  {format(day, 'd')}
                </span>
                {todayFlag && (
                  <span className="font-mono" style={{
                    fontSize: 8,
                    color: 'var(--color-primary)',
                    letterSpacing: '0.08em',
                  }}>
                    TODAY
                  </span>
                )}
              </div>

              {/* Today accent bar */}
              {todayFlag && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: 2,
                  background: 'var(--color-primary)',
                }} />
              )}

              {/* TO DO tasks (no time) — checkbox completes, row click edits */}
              {todos.slice(0, MAX_VISIBLE).map((item) => {
                const tag = tags.find(t => t.id === item.tag_id)
                const color = tag?.color ?? '#555555'
                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onBlockDoubleClick({
                        key: item.id, item, date: item.date ?? '', start_time: item.start_time ?? '',
                        end_time: item.end_time ?? '', title: item.title, is_completed: item.is_completed,
                        is_recurring: false, original_date: item.date ?? '', override_id: null,
                        tag: tag ?? null,
                      })
                    }}
                    style={{
                      fontSize: 10,
                      padding: '1px 4px',
                      marginBottom: 2,
                      borderLeft: `2px dashed ${color}`,
                      background: `${color}18`,
                      color: 'var(--color-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: "'JetBrains Mono', monospace",
                      opacity: item.is_completed ? 0.4 : 1,
                      cursor: 'pointer',
                    }}
                    title={item.title}
                  >
                    <input
                      type="checkbox"
                      className="cyber-checkbox checkbox-sm"
                      checked={item.is_completed}
                      onChange={() => toggleComplete(item.id, item.is_completed)}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{ borderColor: color }}
                    />
                    <span style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textDecoration: item.is_completed ? 'line-through' : 'none',
                    }}>
                      {item.title}
                    </span>
                  </div>
                )
              })}

              {/* Scheduled blocks */}
              {dayBlocks.slice(0, Math.max(0, MAX_VISIBLE - todos.length)).map((block) => {
                const color = block.tag?.color ?? '#555555'
                const isAllDay = block.start_time === '00:00' && block.end_time === '00:00'
                return (
                  <div
                    key={block.key}
                    onClick={(e) => { e.stopPropagation(); onBlockDoubleClick(block) }}
                    style={{
                      fontSize: 10,
                      padding: '1px 4px',
                      marginBottom: 2,
                      borderLeft: `2px ${block.item.type === 'task' ? 'dashed' : 'solid'} ${color}`,
                      background: `${color}22`,
                      color: 'var(--color-text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: "'JetBrains Mono', monospace",
                      opacity: block.is_completed ? 0.4 : 1,
                      textDecoration: block.is_completed ? 'line-through' : 'none',
                    }}
                    title={`${isAllDay ? '' : format(new Date(`2000-01-01T${block.start_time}`), 'h:mma') + ' '}${block.title}`}
                  >
                    {!isAllDay && (
                      <span style={{ color, marginRight: 3, fontSize: 9 }}>
                        {format(new Date(`2000-01-01T${block.start_time}`), 'h:mm')}
                      </span>
                    )}
                    {block.title}
                  </div>
                )
              })}

              {/* Overflow count */}
              {overflow > 0 && (
                <div className="font-mono" style={{
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  marginTop: 1,
                }}>
                  +{overflow} more
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
