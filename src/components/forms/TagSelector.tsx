import type { Tag } from '@/types/app.types'

interface TagSelectorProps {
  tags: Tag[]
  value: string
  onChange: (id: string) => void
}

export default function TagSelector({ tags, value, onChange }: TagSelectorProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      <button
        type="button"
        onClick={() => onChange('')}
        className="font-mono"
        style={{
          padding: '3px 8px',
          fontSize: 11,
          background: value === '' ? 'var(--color-border-bright)' : 'transparent',
          border: `1px solid ${value === '' ? 'var(--color-text)' : 'var(--color-border-bright)'}`,
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
        }}
      >
        None
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => onChange(tag.id)}
          className="font-mono"
          style={{
            padding: '3px 8px',
            fontSize: 11,
            background: value === tag.id ? tag.color + '33' : 'transparent',
            border: `1px solid ${value === tag.id ? tag.color : 'var(--color-border-bright)'}`,
            color: value === tag.id ? tag.color : 'var(--color-text-muted)',
            cursor: 'pointer',
            boxShadow: value === tag.id ? `0 0 6px ${tag.color}55` : 'none',
          }}
        >
          {tag.name}
        </button>
      ))}
    </div>
  )
}
