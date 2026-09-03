import { useState, useRef, useEffect } from 'react'

interface TimePickerProps {
  value: string   // 'HH:mm' or ''
  onChange: (value: string) => void
}

// 96 slots × 15 min = 24 hours
const SLOTS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4)
  const m = (i % 4) * 15
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

function split12(time: string): { clock: string; period: 'AM' | 'PM' } {
  const [h, m] = time.split(':').map(Number)
  return { clock: `${h % 12 || 12}:${String(m).padStart(2, '0')}`, period: h < 12 ? 'AM' : 'PM' }
}

function fmt12(time: string): string {
  const { clock, period } = split12(time)
  return `${clock} ${period}`
}

// DB values arrive as HH:MM:SS; slots are HH:MM — compare on the same shape
function norm(time: string): string {
  return time.length > 5 ? time.slice(0, 5) : time
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef  = useRef<HTMLDivElement>(null)
  const listRef     = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

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

  // Scroll selected slot into view when panel opens
  useEffect(() => {
    if (open && selectedRef.current && listRef.current) {
      const list = listRef.current
      const item = selectedRef.current
      const offset = item.offsetTop - list.clientHeight / 2 + item.clientHeight / 2
      list.scrollTop = Math.max(0, offset)
    }
  }, [open])

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
        {value ? fmt12(value) : '— TIME —'}
      </button>

      {/* ── Slot list ── */}
      {open && (
        <div
          ref={listRef}
          style={{
            marginTop: 4,
            background: 'var(--bg-elevated)',
            border: '2px solid var(--color-border-bright)',
            boxShadow: 'var(--shadow-hard-dark)',
            maxHeight: 196,
            overflowY: 'auto',
            // Positioned so slot.offsetTop is measured against THIS list —
            // otherwise the scroll-to-selected math is offset by the list's
            // position inside the modal and the current time lands off-screen
            position: 'relative',
          }}
        >
          {/* Clear — removes the time (a dated task without times becomes a
              due chip in the all-day strip) */}
          {value && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => { onChange(''); setOpen(false) }}
              style={{
                width: '100%',
                padding: '4px 0',
                fontSize: 10,
                letterSpacing: '0.1em',
                border: 'none',
                borderBottom: '1px solid var(--color-border)',
                boxShadow: 'none',
                position: 'sticky',
                top: 0,
                background: 'var(--bg-elevated)',
                zIndex: 1,
              }}
            >
              CLEAR
            </button>
          )}
          {SLOTS.map((slot) => {
            const isSel  = !!value && slot === norm(value)
            const isHour = slot.endsWith(':00')

            return (
              <button
                key={slot}
                ref={isSel ? selectedRef : undefined}
                type="button"
                onClick={() => { onChange(slot); setOpen(false) }}
                style={{
                  width: '100%',
                  display: 'block',
                  padding: isHour ? '6px 12px 5px' : '4px 12px 4px 22px',
                  background: isSel ? 'var(--color-primary)' : 'transparent',
                  color: isSel
                    ? '#ffffff'
                    : isHour
                      ? 'var(--color-text)'
                      : 'var(--color-text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: isHour ? 12 : 11,
                  fontWeight: isHour ? 700 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderTop: isHour ? '1px solid var(--color-border)' : 'none',
                  letterSpacing: '0.04em',
                  transition: 'background 0.06s',
                }}
              >
                {/* Period rendered as its own bold, colored token so 5:30 AM
                    and 5:30 PM can't be confused while scrolling on a phone */}
                {split12(slot).clock}
                <span style={{
                  marginLeft: 5,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: isSel ? '#ffffff' : split12(slot).period === 'PM' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}>
                  {split12(slot).period}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
