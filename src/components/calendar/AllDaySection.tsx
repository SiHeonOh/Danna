import type { CalendarBlock } from '@/types/app.types'

interface AllDaySectionProps {
  date: string
  blocks: CalendarBlock[]
  onBlockClick: (block: CalendarBlock) => void
  onAddClick: (date: string) => void
}

export default function AllDaySection({ date, blocks, onBlockClick, onAddClick }: AllDaySectionProps) {
  const dayBlocks = blocks.filter((b) => b.date === date)

  return (
    <div
      style={{
        minHeight: 36,
        borderBottom: '2px solid var(--color-border)',
        padding: '4px 8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 3,
        alignItems: 'center',
      }}
    >
      {dayBlocks.map((block) => {
        const tagColor = block.tag?.color ?? 'var(--color-accent)'
        return (
          <div
            key={block.key}
            onClick={() => onBlockClick(block)}
            className="font-display"
            style={{
              fontSize: 11,
              padding: '3px 8px',
              background: `${tagColor}22`,
              borderLeft: `3px solid ${tagColor}`,
              color: 'var(--color-text)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 120,
              letterSpacing: '0.04em',
            }}
            title={block.title}
          >
            {block.title}
          </div>
        )
      })}
      <button
        onClick={() => onAddClick(date)}
        className="btn-ghost"
        style={{
          padding: '2px 7px',
          fontSize: 13,
          lineHeight: 1,
          minWidth: 0,
        }}
        title="Add all-day note"
      >
        +
      </button>
    </div>
  )
}
