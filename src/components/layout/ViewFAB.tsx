import { useState } from 'react'

type ViewMode = 'day' | 'week' | 'month' | 'flow'

interface ViewFABProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

const OPTIONS: { id: ViewMode; label: string }[] = [
  { id: 'flow',  label: 'FLOW'  },
  { id: 'month', label: 'MONTH' },
  { id: 'week',  label: 'WEEK'  },
  { id: 'day',   label: 'DAY'   },
]

export default function ViewFAB({ viewMode, onViewModeChange }: ViewFABProps) {
  const [open, setOpen] = useState(false)

  function select(id: ViewMode) {
    onViewModeChange(id)
    setOpen(false)
  }

  const currentLabel = viewMode === 'day' ? 'DAY' : viewMode === 'week' ? 'WEEK' : viewMode === 'flow' ? 'FLOW' : 'MONTH'

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 110, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      {/* Expanded options — shown above the trigger */}
      {open && OPTIONS.filter(o => o.id !== viewMode).map((opt) => (
        <button
          key={opt.id}
          className="font-mono"
          onClick={() => select(opt.id)}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            background: 'var(--bg-elevated)',
            color: 'var(--color-text-muted)',
            border: '2px solid var(--color-border-bright)',
            boxShadow: '3px 3px 0 var(--color-border-bright)',
            cursor: 'pointer',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}
        >
          {opt.label}
        </button>
      ))}

      {/* Main trigger button — shows active view */}
      <button
        className="font-mono"
        onClick={() => setOpen(v => !v)}
        style={{
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 700,
          minWidth: 80,
          textAlign: 'center',
          background: 'var(--color-primary)',
          color: '#ffffff',
          border: '2px solid var(--color-primary)',
          boxShadow: '3px 3px 0 color-mix(in srgb, var(--color-primary) 40%, black)',
          cursor: 'pointer',
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
        }}
      >
        {open ? '✕' : currentLabel}
      </button>
    </div>
  )
}
