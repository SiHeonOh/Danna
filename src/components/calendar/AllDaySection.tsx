import { useDraggable } from '@dnd-kit/core'
import type { CalendarBlock } from '@/types/app.types'

interface AllDaySectionProps {
  date: string
  blocks: CalendarBlock[]
  dueTasks?: CalendarBlock[]
  onBlockClick: (block: CalendarBlock) => void
  onAddClick: (date: string) => void
  onDueToggle?: (block: CalendarBlock) => void
  /** Strip-wide expanded state — owned by the view so all days toggle together */
  expanded?: boolean
  onToggleExpand?: () => void
  /** Mobile week view: 44px columns — text-only rows, no checkbox/drag/add */
  compact?: boolean
}

// Collapsed: at most this many rows per day, then a "+N ▾" expander —
// the Google Calendar pattern; expanding pushes the grid down instead of
// scrolling inside tiny cells.
const COLLAPSED_ROWS = 3

// NOTE: rows here deliberately avoid the .font-display class — its
// scaleX(1.2) transform renders wider than the layout box and bleeds
// across day-column borders. Same face, no transform:
const displayFont = "'Maratype', 'Barlow Condensed', sans-serif"

// A task with a deadline but no scheduled time — a full-width row in the
// all-day strip. Dashed border + checkbox = the app's task idiom. Draggable
// into the time grid to schedule it (handled as 'due::' in CalendarRoot).
function DueTaskChip({
  block,
  onClick,
  onToggle,
}: {
  block: CalendarBlock
  onClick: (block: CalendarBlock) => void
  onToggle?: (block: CalendarBlock) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `due::${block.key}`,
    data: { type: 'due', block },
  })
  const tagColor = block.tag?.color ?? 'var(--color-accent)'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onClick(block)}
      style={{
        fontFamily: displayFont,
        textTransform: 'uppercase',
        fontSize: 10,
        letterSpacing: '0.04em',
        minHeight: 20,
        padding: '1px 4px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        width: '100%',
        minWidth: 0,
        flexShrink: 0,
        background: `${tagColor}14`,
        borderLeft: `3px dashed ${tagColor}`,
        color: 'var(--color-text)',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : block.is_completed ? 0.5 : 1,
        touchAction: 'none',
        userSelect: 'none',
      }}
      title={block.title}
    >
      <input
        type="checkbox"
        className="cyber-checkbox checkbox-sm"
        checked={block.is_completed}
        onChange={() => onToggle?.(block)}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: tagColor }}
      />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textDecoration: block.is_completed ? 'line-through' : 'none',
        }}
      >
        {block.title}
      </span>
    </div>
  )
}

export default function AllDaySection({
  date,
  blocks,
  dueTasks = [],
  onBlockClick,
  onAddClick,
  onDueToggle,
  expanded = true,
  onToggleExpand,
  compact = false,
}: AllDaySectionProps) {
  const dayBlocks = blocks.filter((b) => b.date === date)
  // Completed tasks sink to the bottom (and behind the +N fold when collapsed)
  const dayDue = dueTasks
    .filter((b) => b.date === date)
    .sort((a, b) => Number(a.is_completed) - Number(b.is_completed))

  const rows: { kind: 'note' | 'due'; block: CalendarBlock }[] = [
    ...dayBlocks.map((block) => ({ kind: 'note' as const, block })),
    ...dayDue.map((block) => ({ kind: 'due' as const, block })),
  ]
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS)
  const hiddenCount = rows.length - visible.length
  const collapsible = expanded && rows.length > COLLAPSED_ROWS

  // No own border/height — the parent row draws the bottom border and
  // stretches every day cell to the same height; the footer pins to the
  // bottom so controls share one baseline across the row.
  return (
    <div
      style={{
        minHeight: 36,
        height: '100%',
        padding: '3px 4px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: 'stretch',
      }}
    >
      {visible.map(({ kind, block }) =>
        compact ? (
          // 44px column: text-only row, tap to edit; complete/drag in Day view
          <div
            key={block.key}
            onClick={() => onBlockClick(block)}
            style={{
              fontFamily: displayFont,
              textTransform: 'uppercase',
              fontSize: 8,
              letterSpacing: '0.02em',
              minHeight: 13,
              padding: '1px 2px',
              width: '100%',
              minWidth: 0,
              flexShrink: 0,
              background: `${(block.tag?.color ?? 'var(--color-accent)')}${kind === 'due' ? '14' : '22'}`,
              borderLeft: `2px ${kind === 'due' ? 'dashed' : 'solid'} ${block.tag?.color ?? 'var(--color-accent)'}`,
              color: 'var(--color-text)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              opacity: block.is_completed ? 0.45 : 1,
              textDecoration: block.is_completed ? 'line-through' : 'none',
            }}
            title={block.title}
          >
            {block.title}
          </div>
        ) : kind === 'due' ? (
          <DueTaskChip key={block.key} block={block} onClick={onBlockClick} onToggle={onDueToggle} />
        ) : (
          <div
            key={block.key}
            onClick={() => onBlockClick(block)}
            style={{
              fontFamily: displayFont,
              textTransform: 'uppercase',
              fontSize: 10,
              letterSpacing: '0.04em',
              minHeight: 20,
              padding: '1px 4px',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              minWidth: 0,
              flexShrink: 0,
              background: `${(block.tag?.color ?? 'var(--color-accent)')}22`,
              borderLeft: `3px solid ${block.tag?.color ?? 'var(--color-accent)'}`,
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
            title={block.title}
          >
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {block.title}
            </span>
          </div>
        ),
      )}

      {/* Footer pinned to the cell bottom — expander left, add-button right,
          identical 18px-tall controls on one baseline across all days.
          Compact (44px columns): expander only — "+" wouldn't fit. */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%', marginTop: 'auto', paddingTop: 2 }}>
        {hiddenCount > 0 && (
          <button
            onClick={onToggleExpand}
            className="font-mono"
            style={{
              background: 'transparent',
              border: 'none',
              height: 18,
              padding: '0 2px',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: compact ? 'normal' : '0.08em',
              color: 'var(--color-primary)',
              cursor: 'pointer',
            }}
            title="Show all"
          >
            +{hiddenCount}{compact ? '' : ' ▾'}
          </button>
        )}
        {collapsible && (
          <button
            onClick={onToggleExpand}
            className="font-mono"
            style={{
              background: 'transparent',
              border: 'none',
              height: 18,
              padding: '0 2px',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
            title="Show less"
          >
            ▴
          </button>
        )}
        {!compact && (
          <button
            onClick={() => onAddClick(date)}
            className="btn-ghost"
            style={{
              width: 18,
              height: 18,
              padding: 0,
              fontSize: 12,
              lineHeight: 1,
              minWidth: 0,
              flexShrink: 0,
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Add all-day note"
          >
            +
          </button>
        )}
      </div>
    </div>
  )
}
