import { useDraggable } from '@dnd-kit/core'
import type { Item, Tag } from '@/types/app.types'

interface UnscheduledTaskProps {
  item: Item
  tag: Tag | null
  onToggleComplete: () => void
  onDoubleClick: () => void
}

export function UnscheduledTask({ item, tag, onToggleComplete, onDoubleClick }: UnscheduledTaskProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `unscheduled::${item.id}`,
    data: { type: 'unscheduled', item },
  })

  const tagColor = tag?.color ?? '#444444'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onDoubleClick={onDoubleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        borderLeft: `4px dashed ${tagColor}`,
        background: `${tagColor}14`,
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
        userSelect: 'none',
        marginBottom: 4,
      }}
    >
      <input
        type="checkbox"
        className="cyber-checkbox"
        checked={item.is_completed}
        onChange={onToggleComplete}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ borderColor: tagColor }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="font-display"
          style={{
            fontSize: 12,
            color: 'var(--color-text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecoration: item.is_completed ? 'line-through' : 'none',
            opacity: item.is_completed ? 0.45 : 1,
            lineHeight: 1.3,
          }}
        >
          {item.title}
        </div>
        {item.priority && (
          <div className="font-mono" style={{
            fontSize: 9,
            fontWeight: 700,
            color: item.priority === 'high' ? 'var(--color-secondary)' : item.priority === 'medium' ? '#C8900A' : 'var(--color-text-muted)',
            letterSpacing: '0.08em',
            marginTop: 1,
          }}>
            {item.priority.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}
