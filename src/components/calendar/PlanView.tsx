import { format, isToday, startOfDay, endOfDay } from 'date-fns'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { formatDisplayTime, timeStringToMinutes } from '@/lib/dateUtils'
import { usePlanner } from '@/context/PlannerContext'
import { useCalendarView, useAllDayItems } from '@/hooks/useCalendarView'
import type { CalendarBlock, Item, Tag } from '@/types/app.types'
import TimeGrid from './TimeGrid'
import AllDaySection from './AllDaySection'
import { useIsMobile } from '@/hooks/useIsMobile'

interface PlanViewProps {
  date: Date
  activeDragId: string | null
  onSlotClick: (date: string, time: string) => void
  onBlockDoubleClick: (block: CalendarBlock) => void
  onCompleteInstance: (block: CalendarBlock) => void
  onAllDayClick: (block: CalendarBlock) => void
  onAllDayAdd: (date: string) => void
  onNewTask: () => void
  onEditItem: (itemId: string) => void
}

function priorityDot(priority: Item['priority']) {
  if (!priority) return null
  const colors: Record<string, string> = { high: 'var(--color-secondary)', medium: '#C8900A', low: 'var(--color-text-muted)' }
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6,
      background: colors[priority] ?? '#555', borderRadius: '50%',
      flexShrink: 0, marginTop: 5,
    }} />
  )
}

function TodoDropZone({ dateStr, children }: { dateStr: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'todo-drop',
    data: { type: 'todo', date: dateStr },
  })
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 32,
        transition: 'background 0.1s',
        background: isOver ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent',
        outline: isOver ? '1px dashed var(--color-primary)' : 'none',
      }}
    >
      {children}
    </div>
  )
}

function InboxDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'inbox-drop',
    data: { type: 'inbox' },
  })
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 32,
        transition: 'background 0.1s',
        background: isOver ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent',
        outline: isOver ? '1px dashed var(--color-primary)' : 'none',
      }}
    >
      {children}
    </div>
  )
}

function DraggableInboxTask({
  item,
  tag,
  onToggleComplete,
  onDoubleClick,
}: {
  item: Item
  tag: Tag | null
  onToggleComplete: () => void
  onDoubleClick: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `unscheduled::${item.id}`,
    data: { type: 'unscheduled', item },
  })
  const tagColor = tag?.color ?? '#555555'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '6px 8px',
        marginBottom: 3,
        borderLeft: `3px dashed ${tagColor}`,
        background: `${tagColor}14`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        opacity: isDragging ? 0.4 : 1,
      }}
      onDoubleClick={onDoubleClick}
    >
      <input
        type="checkbox"
        className="cyber-checkbox"
        checked={item.is_completed}
        onChange={onToggleComplete}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ marginTop: 1, borderColor: tagColor, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        {tag && (
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', marginBottom: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, background: tagColor, flexShrink: 0 }} />
            {tag.name}
          </div>
        )}
        <div className="font-display" style={{
          fontSize: 12,
          color: 'var(--color-text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {item.title}
        </div>
      </div>
      {priorityDot(item.priority)}
    </div>
  )
}

export default function PlanView({
  date,
  activeDragId,
  onSlotClick,
  onBlockDoubleClick,
  onCompleteInstance,
  onAllDayClick,
  onAllDayAdd,
  onNewTask,
  onEditItem,
}: PlanViewProps) {
  const { items, tags, rules, overrides, tagById, toggleComplete, upsertOverride } = usePlanner()
  const dateStr = format(date, 'yyyy-MM-dd')
  const from = startOfDay(date)
  const to = endOfDay(date)

  const blocks = useCalendarView({ items, rules, overrides, tags, from, to })
  const allDayBlocks = useAllDayItems(items, rules, overrides, tags, from, to)

  const scheduledBlocks = blocks
    .filter((b) => b.date === dateStr)
    .sort((a, b) => timeStringToMinutes(a.start_time) - timeStringToMinutes(b.start_time))

  // Tasks assigned to this day but with no time — the "To Do" list
  const todoTasks = items.filter((item) =>
    item.type === 'task' && item.date === dateStr && !item.start_time
  )

  // Truly unscheduled tasks — no date, no goal_period
  const inboxTasks = items.filter((item) =>
    item.type === 'task' && !item.date && !item.goal_period
  )

  const allDayForDay = allDayBlocks.filter((b) => b.date === dateStr)

  async function handleToggleBlock(block: CalendarBlock) {
    if (block.is_recurring) {
      await upsertOverride(block.item.id, block.original_date, { is_completed: !block.is_completed })
    } else {
      await toggleComplete(block.item.id, block.is_completed)
    }
  }

  const today = isToday(date)
  const remainingCount = scheduledBlocks.filter((b) => !b.is_completed).length
  const doneCount = scheduledBlocks.filter((b) => b.is_completed).length
  const isMobile = useIsMobile()

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, overflow: 'hidden', height: '100%' }}>

      {/* ── Task list panel (left on desktop, top on mobile) ── */}
      <div style={{
        width: isMobile ? '100%' : 300,
        height: isMobile ? '42vh' : undefined,
        maxHeight: isMobile ? '42vh' : undefined,
        flexShrink: 0,
        borderRight: isMobile ? 'none' : '2px solid var(--color-border)',
        borderBottom: isMobile ? '2px solid var(--color-border)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-surface)',
      }}>

        {/* Panel header — hidden on mobile (date already visible in day view behind overlay) */}
        {!isMobile && <div style={{
          display: 'flex',
          alignItems: 'stretch',
          borderBottom: '2px solid var(--color-border)',
          flexShrink: 0,
          background: 'var(--bg-surface)',
        }}>
          {/* Left accent bar */}
          <div style={{
            width: 4,
            flexShrink: 0,
            background: today ? 'var(--color-primary)' : 'var(--color-border-bright)',
            boxShadow: today ? 'var(--glow-primary)' : 'none',
          }} />
          <div style={{ flex: 1, padding: '10px 12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span className="font-display" style={{
                fontSize: 20,
                color: today ? 'var(--color-primary)' : 'var(--color-text)',
                textShadow: today ? 'var(--glow-primary)' : 'none',
                letterSpacing: '0.06em',
                lineHeight: 1,
              }}>
                {format(date, 'EEEE').toUpperCase()}
              </span>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                {format(date, 'yyyy-MM-dd')}
              </span>
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
              <span style={{ color: today ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {remainingCount}
              </span>
              {' REMAINING · '}
              <span>{doneCount} DONE</span>
            </div>
          </div>
        </div>}

        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ALL-DAY section */}
          {allDayForDay.length > 0 && (
            <>
              {/* Stencil header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid var(--color-border)', flexShrink: 0, background: 'var(--bg-elevated)' }}>
                <div style={{ width: 3, height: 13, background: 'var(--color-accent)', flexShrink: 0 }} />
                <span style={{ fontFamily: "'Maratype', 'Barlow Condensed', sans-serif", fontSize: 11, color: 'var(--color-accent)', letterSpacing: '0.14em', textTransform: 'uppercase', flexShrink: 0 }}>ALL-DAY</span>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border-bright)', opacity: 0.4 }} />
                <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{allDayForDay.length}</span>
              </div>
              <div style={{ padding: '6px 10px 8px' }}>
                {allDayForDay.map((block) => {
                  const tagColor = block.tag?.color ?? 'var(--color-accent)'
                  return (
                    <div
                      key={block.key}
                      onClick={() => onBlockDoubleClick(block)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '5px 8px',
                        marginBottom: 3,
                        borderLeft: `3px solid ${tagColor}`,
                        background: `${tagColor}18`,
                        cursor: 'pointer',
                      }}
                    >
                      <span className="font-display" style={{ fontSize: 12, color: 'var(--color-text)' }}>
                        {block.title}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* SCHEDULED section */}
          <>
            {/* Stencil header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid var(--color-border)', flexShrink: 0, background: 'var(--bg-elevated)' }}>
              <div style={{ width: 3, height: 13, background: 'var(--color-primary)', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Maratype', 'Barlow Condensed', sans-serif", fontSize: 11, color: 'var(--color-primary)', letterSpacing: '0.14em', textTransform: 'uppercase', flexShrink: 0 }}>SCHEDULED</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border-bright)', opacity: 0.4 }} />
              <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{scheduledBlocks.length}</span>
            </div>

            {scheduledBlocks.length === 0 ? (
              <div style={{ padding: '10px 14px' }}>
                <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
                  Nothing scheduled.
                  <br />Click a time slot on the right to add something.
                </p>
              </div>
            ) : (
              <div style={{ padding: '6px 10px 8px' }}>
                {scheduledBlocks.map((block) => {
                  const tagColor = block.tag?.color ?? '#555555'
                  const done = block.is_completed
                  return (
                    <div
                      key={block.key}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '7px 10px',
                        marginBottom: 3,
                        borderLeft: `3px ${block.item.type === 'task' ? 'dashed' : 'solid'} ${tagColor}`,
                        background: done ? `${tagColor}10` : `${tagColor}22`,
                        cursor: 'pointer',
                        opacity: done ? 0.6 : 1,
                      }}
                      onDoubleClick={!isMobile ? () => onBlockDoubleClick(block) : undefined}
                      onClick={isMobile ? () => onBlockDoubleClick(block) : undefined}
                    >
                      {block.item.type === 'task' && (
                        <input
                          type="checkbox"
                          className="cyber-checkbox"
                          checked={done}
                          onChange={() => handleToggleBlock(block)}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{ marginTop: 1, borderColor: tagColor, flexShrink: 0 }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="font-mono" style={{
                          fontSize: 9,
                          color: 'var(--color-text-muted)',
                          marginBottom: 2,
                        }}>
                          {formatDisplayTime(block.start_time)}–{formatDisplayTime(block.end_time)}
                          {block.tag && (
                            <>
                              {' · '}
                              <span style={{
                                display: 'inline-block', width: 6, height: 6,
                                background: tagColor, marginRight: 3,
                                verticalAlign: 'middle',
                              }} />
                              {block.tag.name}
                            </>
                          )}
                        </div>
                        <div className="font-display" style={{
                          fontSize: 12,
                          color: 'var(--color-text)',
                          textDecoration: done ? 'line-through' : 'none',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {block.title}
                        </div>
                      </div>
                      {block.item.type === 'task' && priorityDot(block.item.priority)}
                    </div>
                  )
                })}
              </div>
            )}
          </>

          {/* TO DO section — tasks assigned to this day, no time yet */}
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid var(--color-border)', flexShrink: 0, background: 'var(--bg-elevated)', borderTop: '2px solid var(--color-border)', marginTop: 4 }}>
              <div style={{ width: 3, height: 13, background: 'var(--color-primary)', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Maratype', 'Barlow Condensed', sans-serif", fontSize: 11, color: 'var(--color-primary)', letterSpacing: '0.14em', textTransform: 'uppercase', flexShrink: 0 }}>TO DO</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border-bright)', opacity: 0.4 }} />
              <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', marginRight: 6 }}>
                {todoTasks.filter((t) => !t.is_completed).length}
              </span>
              <button
                className="btn-neon"
                style={{ padding: '2px 8px', fontSize: 9, flexShrink: 0 }}
                onClick={() => onSlotClick(dateStr, '')}
              >
                + TASK
              </button>
            </div>

            <TodoDropZone dateStr={dateStr}>
            <div style={{ padding: '6px 10px 8px' }}>
              {todoTasks.filter((t) => !t.is_completed).length === 0 && (
                <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '6px 4px', padding: 0 }}>
                  No tasks for this day.
                  <br />Drag onto the timeline to schedule.
                </p>
              )}
              {todoTasks.filter((t) => !t.is_completed).map((item) => {
                const tag = tagById(item.tag_id)
                return (
                  <DraggableInboxTask
                    key={item.id}
                    item={item}
                    tag={tag ?? null}
                    onToggleComplete={() => toggleComplete(item.id, item.is_completed)}
                    onDoubleClick={() => onEditItem(item.id)}
                  />
                )
              })}

              {todoTasks.filter((t) => t.is_completed).length > 0 && (
                <div style={{ marginTop: 8, opacity: 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 2, height: 11, background: 'var(--color-border-bright)', flexShrink: 0 }} />
                    <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>COMPLETED</span>
                  </div>
                  {todoTasks.filter((t) => t.is_completed).map((item) => {
                    const tag = tagById(item.tag_id)
                    const tagColor = tag?.color ?? '#555555'
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', marginBottom: 2, borderLeft: `2px dashed ${tagColor}` }}>
                        <input
                          type="checkbox"
                          className="cyber-checkbox"
                          checked={true}
                          onChange={() => toggleComplete(item.id, item.is_completed)}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{ borderColor: tagColor, flexShrink: 0 }}
                        />
                        <div className="font-display" style={{ fontSize: 11, color: 'var(--color-text-muted)', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            </TodoDropZone>
          </>

          {/* INBOX section — truly unscheduled tasks (no date) */}
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid var(--color-border)', flexShrink: 0, background: 'var(--bg-elevated)', borderTop: '2px solid var(--color-border)', marginTop: 4 }}>
              <div style={{ width: 3, height: 13, background: 'var(--color-primary)', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Maratype', 'Barlow Condensed', sans-serif", fontSize: 11, color: 'var(--color-primary)', letterSpacing: '0.14em', textTransform: 'uppercase', flexShrink: 0 }}>INBOX</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border-bright)', opacity: 0.4 }} />
              <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', marginRight: 6 }}>
                {inboxTasks.filter((t) => !t.is_completed).length}
              </span>
              <button
                className="btn-neon"
                style={{ padding: '2px 8px', fontSize: 9, flexShrink: 0 }}
                onClick={onNewTask}
              >
                + TASK
              </button>
            </div>

            <InboxDropZone>
            <div style={{ padding: '6px 10px 8px' }}>
              {inboxTasks.filter((t) => !t.is_completed).length === 0 && (
                <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '6px 4px', padding: 0 }}>
                  No unscheduled tasks.
                </p>
              )}
              {inboxTasks.filter((t) => !t.is_completed).map((item) => {
                const tag = tagById(item.tag_id)
                return (
                  <DraggableInboxTask
                    key={item.id}
                    item={item}
                    tag={tag ?? null}
                    onToggleComplete={() => toggleComplete(item.id, item.is_completed)}
                    onDoubleClick={() => onEditItem(item.id)}
                  />
                )
              })}

              {inboxTasks.filter((t) => t.is_completed).length > 0 && (
                <div style={{ marginTop: 8, opacity: 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 2, height: 11, background: 'var(--color-border-bright)', flexShrink: 0 }} />
                    <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>COMPLETED</span>
                  </div>
                  {inboxTasks.filter((t) => t.is_completed).map((item) => {
                    const tag = tagById(item.tag_id)
                    const tagColor = tag?.color ?? '#555555'
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', marginBottom: 2, borderLeft: `2px dashed ${tagColor}` }}>
                        <input
                          type="checkbox"
                          className="cyber-checkbox"
                          checked={true}
                          onChange={() => toggleComplete(item.id, item.is_completed)}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{ borderColor: tagColor, flexShrink: 0 }}
                        />
                        <div className="font-display" style={{ fontSize: 11, color: 'var(--color-text-muted)', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            </InboxDropZone>
          </>
        </div>
      </div>

      {/* ── Right: Time grid ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* All-day strip */}
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
            blocks={blocks.filter((b) => b.date === dateStr)}
            activeDragId={activeDragId}
            isToday={isToday(date)}
            onSlotClick={onSlotClick}
            onBlockDoubleClick={onBlockDoubleClick}
            onCompleteInstance={onCompleteInstance}
          />
        </div>
      </div>
    </div>
  )
}
