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

function fmt12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
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
          }}
        >
          {SLOTS.map((slot) => {
            const isSel  = slot === value
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
                {fmt12(slot)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
