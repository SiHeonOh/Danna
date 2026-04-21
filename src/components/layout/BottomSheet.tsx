import { type ReactNode } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title: string
}

export default function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  if (!isOpen) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 200, display: 'block',
        }}
      />
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 201,
          background: 'var(--bg-surface)',
          borderTop: '2px solid var(--color-primary)',
          boxShadow: '0 -4px 0 var(--color-primary)',
          height: '55vh',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span className="font-display" style={{ fontSize: 12, color: 'var(--color-primary)' }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 18,
          }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </>
  )
}
