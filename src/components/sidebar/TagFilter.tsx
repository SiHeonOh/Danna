import type { Tag } from '@/types/app.types'

interface TagFilterProps {
  tags: Tag[]
  activeFilter: string | null
  onFilterChange: (id: string | null) => void
}

export default function TagFilter({ tags, activeFilter, onFilterChange }: TagFilterProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>
      <button
        onClick={() => onFilterChange(null)}
        className="font-mono"
        style={{
          padding: '2px 8px', fontSize: 10,
          background: activeFilter === null ? 'var(--color-primary)' : 'transparent',
          border: `1px solid ${activeFilter === null ? 'var(--color-primary)' : 'var(--color-border-bright)'}`,
          color: activeFilter === null ? '#ffffff' : 'var(--color-text-muted)',
          cursor: 'pointer',
        }}
      >
        ALL
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onFilterChange(activeFilter === tag.id ? null : tag.id)}
          className="font-mono"
          style={{
            padding: '2px 8px', fontSize: 10,
            background: activeFilter === tag.id ? `${tag.color}33` : 'transparent',
            border: `1px solid ${activeFilter === tag.id ? tag.color : 'var(--color-border-bright)'}`,
            color: activeFilter === tag.id ? tag.color : 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          {tag.name.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
