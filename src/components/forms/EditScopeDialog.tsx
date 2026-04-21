import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import type { EditScope } from '@/types/app.types'

interface EditScopeDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (scope: EditScope) => void
  mode?: 'edit' | 'delete'
}

export default function EditScopeDialog({ isOpen, onClose, onConfirm, mode = 'edit' }: EditScopeDialogProps) {
  const [scope, setScope] = useState<EditScope>('this')

  const isDelete = mode === 'delete'

  const options: { value: EditScope; label: string; desc: string }[] = isDelete
    ? [
        { value: 'this',   label: 'Only this occurrence', desc: 'Remove just this single event, keep the rest' },
        { value: 'future', label: 'This and all future',  desc: 'End the series here, keep past occurrences' },
        { value: 'all',    label: 'All occurrences',      desc: 'Delete the entire recurring series' },
      ]
    : [
        { value: 'this',   label: 'Only this event',         desc: 'Edit just this single occurrence' },
        { value: 'future', label: 'This and all future',     desc: 'Split the recurrence here and edit forward' },
        { value: 'all',    label: 'All events',              desc: 'Edit the original item and all future occurrences' },
      ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isDelete ? 'DELETE RECURRING EVENT' : 'EDIT RECURRING EVENT'} width="360px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt) => (
          <label
            key={opt.value}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 12px',
              border: `1px solid ${scope === opt.value ? 'var(--color-primary)' : 'var(--color-border-bright)'}`,
              background: scope === opt.value
                ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
                : 'transparent',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="scope"
              value={opt.value}
              checked={scope === opt.value}
              onChange={() => setScope(opt.value)}
              style={{ marginTop: 2 }}
            />
            <div>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--color-text)' }}>
                {opt.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                {opt.desc}
              </div>
            </div>
          </label>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button
            className={isDelete ? 'btn-pink' : 'btn-neon'}
            style={{ flex: 1 }}
            onClick={() => onConfirm(scope)}
          >
            {isDelete ? 'DELETE' : 'Continue'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
