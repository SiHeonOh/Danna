import { useState, useRef, useEffect } from 'react'
import {
  format, parseISO, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, addMonths, subMonths,
  isSameDay, isSameMonth, isToday, eachDayOfInterval,
} from 'date-fns'

interface DatePickerProps {
  value: string   // 'yyyy-MM-dd' or ''
  onChange: (value: string) => void
}

const DOW = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() =>
    value ? startOfMonth(parseISO(value)) : startOfMonth(new Date())
  )
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // Sync view month when value changes externally
  useEffect(() => {
    if (value) setViewMonth(startOfMonth(parseISO(value)))
  }, [value])

  const selected = value ? parseISO(value) : null

  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 })
  const gridEnd   = endOfWeek(endOfMonth(viewMonth),   { weekStartsOn: 1 })
  const days      = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function pick(day: Date) {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <div ref={wrapperRef}>
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          background: 'var(--input-bg)',
          color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
          border: `2px solid ${open ? 'var(--color-primary)' : 'var(--color-border-bright)'}`,
          padding: '7px 10px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 500,
          textAlign: 'left',
          cursor: 'pointer',
          letterSpacing: '0.04em',
          transition: 'border-color 0.1s',
        }}
      >
        {value ? format(parseISO(value), 'MMM d, yyyy').toUpperCase() : '— DATE —'}
      </button>

      {/* ── Calendar panel ── */}
      {open && (
        <div style={{
          marginTop: 4,
          background: 'var(--bg-elevated)',
          border: '2px solid var(--color-border-bright)',
          boxShadow: 'var(--shadow-hard-dark)',
          padding: '10px 10px 8px',
        }}>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 4 }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              style={{ padding: '2px 8px', fontSize: 16, lineHeight: 1, flexShrink: 0 }}
            >‹</button>
            <span
              className="font-mono"
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-primary)',
                letterSpacing: '0.08em',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {format(viewMonth, 'MMMM yyyy').toUpperCase()}
            </span>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              style={{ padding: '2px 8px', fontSize: 16, lineHeight: 1, flexShrink: 0 }}
            >›</button>
          </div>

          {/* Day-of-week headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            marginBottom: 4,
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 4,
          }}>
            {DOW.map((d) => (
              <div key={d} className="font-mono" style={{
                textAlign: 'center',
                fontSize: 9,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.1em',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {days.map((day) => {
              const isSel     = selected ? isSameDay(day, selected) : false
              const inMonth   = isSameMonth(day, viewMonth)
              const todayFlag = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => pick(day)}
                  style={{
                    padding: '5px 0',
                    background: isSel ? 'var(--color-primary)' : 'transparent',
                    color: isSel
                      ? '#ffffff'
                      : todayFlag
                        ? 'var(--color-primary)'
                        : inMonth
                          ? 'var(--color-text)'
                          : 'var(--color-text-muted)',
                    border: todayFlag && !isSel
                      ? '1px solid var(--color-primary)'
                      : '1px solid transparent',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: todayFlag ? 700 : 400,
                    cursor: 'pointer',
                    opacity: inMonth ? 1 : 0.3,
                    textAlign: 'center',
                    transition: 'background 0.08s',
                  }}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>

          {/* Footer: Today + Clear */}
          <div style={{ marginTop: 8, borderTop: '1px solid var(--color-border)', paddingTop: 6, display: 'flex', gap: 4 }}>
            <button
              type="button"
              className="btn-neon"
              style={{ flex: 1, padding: '3px 0', fontSize: 10, letterSpacing: '0.1em' }}
              onClick={() => {
                const today = new Date()
                onChange(format(today, 'yyyy-MM-dd'))
                setViewMonth(startOfMonth(today))
                setOpen(false)
              }}
            >
              TODAY
            </button>
            {value && (
              <button
                type="button"
                className="btn-ghost"
                style={{ flex: 1, padding: '3px 0', fontSize: 10, letterSpacing: '0.1em' }}
                onClick={() => { onChange(''); setOpen(false) }}
              >
                CLEAR
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
