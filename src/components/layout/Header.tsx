import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, format } from 'date-fns'
import GlitchText from '@/components/ui/GlitchText'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useAuth } from '@/context/AuthContext'

type ViewMode = 'day' | 'week' | 'plan' | 'month'

interface HeaderProps {
  viewMode: ViewMode
  currentDate: Date
  onViewModeChange: (mode: ViewMode) => void
  onDateChange: (date: Date) => void
  onNewEvent: () => void
  onTagManager: () => void
}

export default function Header({
  viewMode, currentDate, onViewModeChange, onDateChange, onNewEvent, onTagManager,
}: HeaderProps) {
  const { signOut } = useAuth()

  function goBack() {
    if (viewMode === 'week') onDateChange(subWeeks(currentDate, 1))
    else if (viewMode === 'month') onDateChange(subMonths(currentDate, 1))
    else onDateChange(subDays(currentDate, 1))
  }
  function goForward() {
    if (viewMode === 'week') onDateChange(addWeeks(currentDate, 1))
    else if (viewMode === 'month') onDateChange(addMonths(currentDate, 1))
    else onDateChange(addDays(currentDate, 1))
  }
  function goToday() {
    onDateChange(new Date())
  }

  const dateLabel = viewMode === 'week'
    ? `${format(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 1), 'MMM d')} — ${format(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 7), 'MMM d, yyyy')}`.toUpperCase()
    : viewMode === 'month'
      ? format(currentDate, 'MMMM yyyy').toUpperCase()
      : format(currentDate, 'MMM d, yyyy').toUpperCase()

  return (
    <div
      style={{
        height: 52,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px 0 0',
        borderBottom: '2px solid var(--color-border)',
        background: 'var(--bg-surface)',
        position: 'relative',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        width: 4,
        alignSelf: 'stretch',
        background: 'var(--color-primary)',
        flexShrink: 0,
        marginRight: 8,
      }} />

      {/* Logo */}
      <h1 className="font-display" style={{
        fontSize: 30,
        margin: 0,
        lineHeight: 1,
        color: 'var(--color-primary)',
        textShadow: 'var(--glow-primary)',
        letterSpacing: '0.16em',
        flexShrink: 0,
      }}>
        <GlitchText text="GRID" />
      </h1>

      {/* Separator */}
      <div style={{ width: 2, height: 28, background: 'var(--color-border-bright)', flexShrink: 0, marginLeft: 4 }} />

      {/* Nav controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <button
          className="btn-ghost"
          style={{ padding: '3px 10px', fontSize: 18, lineHeight: 1, letterSpacing: 0 }}
          onClick={goBack}
        >‹</button>
        <button
          className="btn-ghost"
          style={{ padding: '3px 12px', fontSize: 12, marginLeft: -2 }}
          onClick={goToday}
        >TODAY</button>
        <button
          className="btn-ghost"
          style={{ padding: '3px 10px', fontSize: 18, lineHeight: 1, letterSpacing: 0, marginLeft: -2 }}
          onClick={goForward}
        >›</button>
      </div>

      {/* Date label */}
      <span className="font-mono" style={{
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--color-primary)',
        flexShrink: 0,
        letterSpacing: '0.04em',
        marginLeft: 4,
      }}>
        {dateLabel}
      </span>

      <div style={{ flex: 1 }} />

      {/* View toggle */}
      <div style={{ display: 'flex' }}>
        {([
          { id: 'plan',  label: 'PLAN'  },
          { id: 'day',   label: 'DAY'   },
          { id: 'week',  label: 'WEEK'  },
          { id: 'month', label: 'MONTH' },
        ] as const).map(({ id, label }, idx) => (
          <button
            key={id}
            className="font-display"
            onClick={() => onViewModeChange(id)}
            style={{
              padding: '4px 14px',
              fontSize: 13,
              background: viewMode === id ? 'var(--color-primary)' : 'transparent',
              color: viewMode === id ? '#ffffff' : 'var(--color-text-muted)',
              border: `2px solid ${viewMode === id ? 'var(--color-primary)' : 'var(--color-border-bright)'}`,
              marginLeft: idx > 0 ? -2 : 0,
              cursor: 'pointer',
              letterSpacing: '0.1em',
              position: 'relative',
              zIndex: viewMode === id ? 1 : 0,
              lineHeight: 1.4,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <button className="btn-neon" style={{ padding: '4px 14px', fontSize: 13 }} onClick={onNewEvent}>
        + EVENT
      </button>
      <button className="btn-ghost" style={{ padding: '4px 12px', fontSize: 13 }} onClick={onTagManager}>
        TAGS
      </button>
      <ThemeToggle />
      <button className="btn-ghost" style={{ padding: '4px 12px', fontSize: 13 }} onClick={() => signOut()}>
        EXIT
      </button>
    </div>
  )
}
