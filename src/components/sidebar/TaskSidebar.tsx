import { useState, useRef } from 'react'
import { usePlanner } from '@/context/PlannerContext'
import { UnscheduledTask } from './UnscheduledTask'
import TagFilter from './TagFilter'
import type { GoalPeriod, Item } from '@/types/app.types'
import { useIsMobile } from '@/hooks/useIsMobile'

type Tab = 'inbox' | 'weekly' | 'monthly'

interface TaskSidebarProps {
  onNewTask: () => void
  onEditItem: (itemId: string) => void
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

function GoalItem({
  item,
  tagColor,
  tagName,
  onToggle,
  onEdit,
}: {
  item: Item
  tagColor: string
  tagName: string | null
  onToggle: () => void
  onEdit: () => void
}) {
  return (
    <div
      onDoubleClick={onEdit}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '8px 10px',
        marginBottom: 4,
        borderLeft: `3px solid ${tagColor}`,
        background: item.is_completed ? 'transparent' : `${tagColor}18`,
        opacity: item.is_completed ? 0.45 : 1,
        cursor: 'pointer',
        transition: 'opacity 0.15s',
      }}
    >
      <input
        type="checkbox"
        className="cyber-checkbox"
        checked={item.is_completed}
        onChange={onToggle}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ marginTop: 2, borderColor: tagColor, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        {(tagName || item.priority) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            {tagName && (
              <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ display: 'inline-block', width: 5, height: 5, background: tagColor }} />
                {tagName}
              </span>
            )}
            {item.priority && (
              <span className="font-mono" style={{
                fontSize: 8,
                color: item.priority === 'high' ? 'var(--color-secondary)' : item.priority === 'medium' ? '#C8900A' : 'var(--color-text-muted)',
                letterSpacing: '0.1em',
              }}>
                {item.priority.toUpperCase()}
              </span>
            )}
          </div>
        )}
        <div
          className="font-display"
          style={{
            fontSize: 12,
            color: 'var(--color-text)',
            textDecoration: item.is_completed ? 'line-through' : 'none',
            lineHeight: 1.3,
            wordBreak: 'break-word',
          }}
        >
          {item.title}
        </div>
        {item.description && (
          <div style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            marginTop: 3,
            lineHeight: 1.4,
          }}>
            {item.description}
          </div>
        )}
      </div>
    </div>
  )
}

function GoalTab({
  period,
  onEditItem,
}: {
  period: GoalPeriod
  onEditItem: (id: string) => void
}) {
  const { items, tagById, toggleComplete, createItem } = usePlanner()
  const [newTitle, setNewTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const goals = items
    .filter((i) => i.type === 'task' && i.goal_period === period)
    .sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1
      return (PRIORITY_ORDER[a.priority ?? ''] ?? 3) - (PRIORITY_ORDER[b.priority ?? ''] ?? 3)
    })

  const incomplete = goals.filter((g) => !g.is_completed)
  const complete = goals.filter((g) => g.is_completed)

  async function handleAdd() {
    const title = newTitle.trim()
    if (!title) return
    await createItem({
      type: 'task',
      title,
      description: null,
      tag_id: null,
      date: null,
      start_time: null,
      end_time: null,
      is_completed: false,
      priority: null,
      goal_period: period,
    })
    setNewTitle('')
    inputRef.current?.focus()
  }

  const label = period === 'weekly' ? 'WEEK' : 'MONTH'
  const accent = 'var(--color-primary)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Progress bar */}
      {goals.length > 0 && (
        <div style={{ padding: '8px 10px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
              {complete.length} / {goals.length} COMPLETE
            </span>
            <span className="font-mono" style={{ fontSize: 10, color: accent }}>
              {Math.round((complete.length / goals.length) * 100)}%
            </span>
          </div>
          <div style={{
            height: 3,
            background: 'var(--color-border)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${(complete.length / goals.length) * 100}%`,
              background: accent,
              boxShadow: 'var(--glow-primary)',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* Goal list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
        {incomplete.length === 0 && complete.length === 0 && (
          <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: '8px 4px' }}>
            No {label.toLowerCase()} goals yet.
            <br />Type below to add one.
          </p>
        )}

        {incomplete.map((item) => {
          const tag = tagById(item.tag_id)
          return (
            <GoalItem
              key={item.id}
              item={item}
              tagColor={tag?.color ?? 'var(--color-border-bright)'}
              tagName={tag?.name ?? null}
              onToggle={() => toggleComplete(item.id, item.is_completed)}
              onEdit={() => onEditItem(item.id)}
            />
          )
        })}

        {complete.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 4, paddingLeft: 4, borderTop: '1px solid var(--color-border)', paddingTop: 6 }}>
              <div style={{ width: 2, height: 11, background: 'var(--color-border-bright)', flexShrink: 0 }} />
              <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>
                COMPLETED
              </span>
            </div>
            {complete.map((item) => {
              const tag = tagById(item.tag_id)
              return (
                <GoalItem
                  key={item.id}
                  item={item}
                  tagColor={tag?.color ?? 'var(--color-border-bright)'}
                  tagName={tag?.name ?? null}
                  onToggle={() => toggleComplete(item.id, item.is_completed)}
                  onEdit={() => onEditItem(item.id)}
                />
              )
            })}
          </>
        )}
      </div>

      {/* Quick-add input */}
      <div style={{
        padding: '8px 8px',
        borderTop: '2px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            placeholder={`Add ${label.toLowerCase()} goal...`}
            style={{ flex: 1, padding: '5px 8px', fontSize: 12, border: '2px solid var(--color-border-bright)' }}
          />
          <button
            className="btn-neon"
            onClick={handleAdd}
            disabled={!newTitle.trim()}
            style={{ padding: '4px 10px', fontSize: 11, flexShrink: 0 }}
          >
            +
          </button>
        </div>
        <div className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 4 }}>
          Double-click any goal to edit details
        </div>
      </div>
    </div>
  )
}

export default function TaskSidebar({ onNewTask, onEditItem }: TaskSidebarProps) {
  const { items, tags, toggleComplete, tagById, activeTagFilter, setActiveTagFilter } = usePlanner()
  const [activeTab, setActiveTab] = useState<Tab>('inbox')
  const isMobile = useIsMobile()

  const unscheduled = items.filter((item) => {
    if (item.type !== 'task') return false
    if (item.date) return false
    if (item.goal_period) return false
    if (activeTagFilter && item.tag_id !== activeTagFilter) return false
    return true
  })

  const incomplete = unscheduled.filter((i) => !i.is_completed)
  const complete = unscheduled.filter((i) => i.is_completed)

  const TABS: { id: Tab; label: string; accent: string }[] = [
    { id: 'inbox',   label: 'INBOX',   accent: 'var(--color-primary)' },
    { id: 'weekly',  label: 'WEEK',    accent: 'var(--color-primary)' },
    { id: 'monthly', label: 'MONTH',   accent: 'var(--color-primary)' },
  ]

  return (
    <div style={{
      width: isMobile ? '100%' : 240,
      flexShrink: isMobile ? undefined : 0,
      borderRight: isMobile ? 'none' : '2px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-surface)',
      overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid var(--color-border)',
        flexShrink: 0,
        gap: 4,
        padding: '4px 4px 0',
        background: 'var(--bg-elevated)',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="font-display"
            style={{
              flex: 1,
              padding: '6px 4px',
              fontSize: 11,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'background 0.1s, color 0.1s',
              background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : 'var(--color-text-muted)',
              border: activeTab === tab.id
                ? '2px solid var(--color-primary)'
                : '2px solid var(--color-border-bright)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* INBOX tab */}
      {activeTab === 'inbox' && (
        <>
          {/* Stencil section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid var(--color-border)', flexShrink: 0, background: 'var(--bg-elevated)' }}>
            <div style={{ width: 3, height: 13, background: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Maratype', 'Barlow Condensed', sans-serif", fontSize: 11, color: 'var(--color-primary)', letterSpacing: '0.14em', textTransform: 'uppercase', flexShrink: 0 }}>UNSCHEDULED</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border-bright)', opacity: 0.4 }} />
            <button className="btn-neon" style={{ padding: '2px 8px', fontSize: 10, flexShrink: 0 }} onClick={onNewTask}>
              + TASK
            </button>
          </div>

          {/* Tag filter */}
          <div style={{ borderBottom: '1px solid var(--color-border)' }}>
            <TagFilter tags={tags} activeFilter={activeTagFilter} onFilterChange={setActiveTagFilter} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
            {incomplete.length === 0 && complete.length === 0 && (
              <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: '8px 4px' }}>
                No unscheduled tasks.
                <br />Drag tasks onto the calendar to schedule them.
              </p>
            )}
            {incomplete.map((item) => (
              <UnscheduledTask
                key={item.id}
                item={item}
                tag={tagById(item.tag_id)}
                onToggleComplete={() => toggleComplete(item.id, item.is_completed)}
                onDoubleClick={() => onEditItem(item.id)}
              />
            ))}
            {complete.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, marginBottom: 4, paddingLeft: 2 }}>
                  <div style={{ width: 2, height: 11, background: 'var(--color-border-bright)', flexShrink: 0 }} />
                  <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>
                    COMPLETED
                  </span>
                </div>
                {complete.map((item) => (
                  <UnscheduledTask
                    key={item.id}
                    item={item}
                    tag={tagById(item.tag_id)}
                    onToggleComplete={() => toggleComplete(item.id, item.is_completed)}
                    onDoubleClick={() => onEditItem(item.id)}
                  />
                ))}
              </>
            )}
          </div>
        </>
      )}

      {/* WEEKLY tab */}
      {activeTab === 'weekly' && (
        <GoalTab period="weekly" onEditItem={onEditItem} />
      )}

      {/* MONTHLY tab */}
      {activeTab === 'monthly' && (
        <GoalTab period="monthly" onEditItem={onEditItem} />
      )}
    </div>
  )
}
