import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: string
}

export default function Modal({ isOpen, onClose, title, children, width = '480px' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--modal-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          background: 'var(--bg-surface)',
          border: '2px solid var(--color-border-bright)',
          boxShadow: 'var(--shadow-hard)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Corner registration marks */}
        <span style={{ position: 'absolute', top: -1, left: -1, width: 14, height: 14, borderTop: '2px solid var(--color-primary)', borderLeft: '2px solid var(--color-primary)', zIndex: 2, pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', top: -1, right: -1, width: 14, height: 14, borderTop: '2px solid var(--color-primary)', borderRight: '2px solid var(--color-primary)', zIndex: 2, pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', bottom: -1, left: -1, width: 14, height: 14, borderBottom: '2px solid var(--color-primary)', borderLeft: '2px solid var(--color-primary)', zIndex: 2, pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderBottom: '2px solid var(--color-primary)', borderRight: '2px solid var(--color-primary)', zIndex: 2, pointerEvents: 'none' }} />

        {/* Title bar */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '2px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            background: 'var(--bg-elevated)',
            gap: 12,
          }}
        >
          {/* Accent stripe + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 3, height: 20, background: 'var(--color-primary)', flexShrink: 0 }} />
            <span
              className="font-display"
              style={{
                fontSize: 17,
                color: 'var(--color-primary)',
                textShadow: 'var(--glow-primary)',
                letterSpacing: '0.12em',
                lineHeight: 1,
              }}
            >
              {title}
            </span>
          </div>

          <button
            onClick={onClose}
            className="font-mono btn-ghost"
            style={{ padding: '3px 10px', fontSize: 11, flexShrink: 0 }}
          >
            [ESC]
          </button>
        </div>

        <div style={{ padding: '20px 16px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}
