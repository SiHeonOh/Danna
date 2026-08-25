import { useEffect, useMemo, useRef } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { addDays, format, isToday } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/hooks/useDateLocale'
import { formatDisplayTime } from '@/lib/dateUtils'
import type { CalendarBlock } from '@/types/app.types'

// FLOW — a horizontally-scrolling task river: dates along the top X axis,
// one column per day, that day's tasks stacked beneath. Scheduled tasks
// (solid edge, time label) and deadline-only tasks (dashed edge) together,
// completed sinking to the bottom. Side-scroll to travel through time.
// Rows drag between day columns ('flow::' / 'flowday::' in CalendarRoot).

const COL_WIDTH = 232
const DAYS_BEFORE = 14 // history visible to the left of currentDate
const DAYS_AFTER = 60

interface FlowViewProps {
  date: Date
  blocks: CalendarBlock[]      // scheduled (timed) blocks in range
  dueTasks: CalendarBlock[]    // dated, untimed tasks in range
  onRowClick: (block: CalendarBlock) => void
  onToggle: (block: CalendarBlock) => void
  onAddTask: (date: string) => void
}

interface DayTask {
  block: CalendarBlock
  scheduled: boolean
}

function TaskRow({ block, scheduled, onRowClick, onToggle }: {
  block: CalendarBlock
  scheduled: boolean
  onRowClick: (b: CalendarBlock) => void
  onToggle: (b: CalendarBlock) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `flow::${block.key}`,
    data: { type: 'flow', block },
  })
  const tagColor = block.tag?.color ?? 'var(--color-accent)'
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onRowClick(block)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        padding: '5px 7px',
        background: `${tagColor}14`,
        borderLeft: `3px ${scheduled ? 'solid' : 'dashed'} ${tagColor}`,
        cursor: 'grab',
        opacity: isDragging ? 0.35 : block.is_completed ? 0.45 : 1,
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <input
        type="checkbox"
        className="cyber-checkbox"
        checked={block.is_completed}
        onChange={() => onToggle(block)}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ borderColor: tagColor, marginTop: 1 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="font-display"
          style={{
            fontSize: 12,
            color: 'var(--color-text)',
            lineHeight: 1.25,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            textDecoration: block.is_completed ? 'line-through' : 'none',
          }}
        >
          {block.title}
        </div>
        <div className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 1, display: 'flex', gap: 6 }}>
          {scheduled ? (
            <span>{formatDisplayTime(block.start_time)}</span>
          ) : (
            <span style={{ letterSpacing: '0.08em' }}>DUE</span>
          )}
          {block.tag && <span style={{ color: tagColor }}>{block.tag.name}</span>}
        </div>
      </div>
    </div>
  )
}

function FlowColumn({ day, tasks, onRowClick, onToggle, onAddTask }: {
  day: Date
  tasks: DayTask[]
  onRowClick: (b: CalendarBlock) => void
  onToggle: (b: CalendarBlock) => void
  onAddTask: (date: string) => void
}) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const ds = format(day, 'yyyy-MM-dd')
  const today = isToday(day)
  const weekend = day.getDay() === 0 || day.getDay() === 6
  const openCount = tasks.filter((x) => !x.block.is_completed).length

  const { setNodeRef, isOver } = useDroppable({
    id: `flowday::${ds}`,
    data: { type: 'flowday', date: ds },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        width: COL_WIDTH,
        flexShrink: 0,
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        background: isOver
          ? 'color-mix(in srgb, var(--color-primary) 10%, var(--bg-surface))'
          : today
            ? 'color-mix(in srgb, var(--color-primary) 4%, var(--bg-surface))'
            : weekend ? 'var(--bg-base)' : 'var(--bg-surface)',
        transition: 'background 0.1s',
      }}
    >
      {/* X-axis date header */}
      <div
        style={{
          padding: '8px 10px 6px',
          borderBottom: `2px solid ${today || isOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span className="font-mono" style={{
          fontSize: 20, fontWeight: 700, lineHeight: 1,
          color: today ? 'var(--color-primary)' : 'var(--color-text)',
        }}>
          {format(day, 'd')}
        </span>
        <span className="font-display" style={{
          fontSize: 11,
          color: today ? 'var(--color-primary)' : 'var(--color-text-muted)',
          letterSpacing: '0.1em',
        }}>
          {format(day, 'EEE', { locale: dateLocale }).toUpperCase()}
        </span>
        <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          {openCount > 0 ? openCount : ''}
        </span>
      </div>

      {/* Task stack */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px 4px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tasks.map(({ block, scheduled }) => (
          <TaskRow key={block.key} block={block} scheduled={scheduled} onRowClick={onRowClick} onToggle={onToggle} />
        ))}
        <button
          onClick={() => onAddTask(ds)}
          className="font-mono"
          style={{
            background: 'transparent',
            border: '1px dashed var(--color-border)',
            color: 'var(--color-text-muted)',
            padding: '4px 0',
            fontSize: 10,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            marginTop: tasks.length ? 2 : 0,
          }}
        >
          {t('flow.addTask')}
        </button>
      </div>
    </div>
  )
}

export default function FlowView({ date, blocks, dueTasks, onRowClick, onToggle, onAddTask }: FlowViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const days = useMemo(() => {
    const start = addDays(date, -DAYS_BEFORE)
    return Array.from({ length: DAYS_BEFORE + DAYS_AFTER + 1 }, (_, i) => addDays(start, i))
  }, [date])

  // Tasks per day: scheduled task blocks (with time) + due chips (no time)
  const byDay = useMemo(() => {
    const map = new Map<string, DayTask[]>()
    const push = (b: CalendarBlock, scheduled: boolean) => {
      const list = map.get(b.date) ?? []
      list.push({ block: b, scheduled })
      map.set(b.date, list)
    }
    blocks.forEach((b) => { if (b.item.type === 'task') push(b, true) })
    dueTasks.forEach((b) => push(b, false))
    for (const list of map.values()) {
      list.sort((a, b) =>
        Number(a.block.is_completed) - Number(b.block.is_completed) ||
        a.block.start_time.localeCompare(b.block.start_time))
    }
    return map
  }, [blocks, dueTasks])

  // Open with today (or currentDate) one column in from the left edge
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = (DAYS_BEFORE - 1) * COL_WIDTH
  }, [days])

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex' }}>
      {days.map((d) => (
        <FlowColumn
          key={format(d, 'yyyy-MM-dd')}
          day={d}
          tasks={byDay.get(format(d, 'yyyy-MM-dd')) ?? []}
          onRowClick={onRowClick}
          onToggle={onToggle}
          onAddTask={onAddTask}
        />
      ))}
    </div>
  )
}
