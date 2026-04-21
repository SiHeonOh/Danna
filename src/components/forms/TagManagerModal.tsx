import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import ColorSwatch from '@/components/ui/ColorSwatch'
import type { Tag } from '@/types/app.types'

interface TagManagerModalProps {
  isOpen: boolean
  onClose: () => void
  tags: Tag[]
  onCreateTag: (name: string, color: string) => Promise<void>
  onUpdateTag: (id: string, name: string, color: string) => Promise<void>
  onDeleteTag: (id: string) => Promise<void>
}

export default function TagManagerModal({
  isOpen, onClose, tags, onCreateTag, onUpdateTag, onDeleteTag,
}: TagManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#39FF14')
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  async function handleCreate() {
    if (!newName.trim()) return
    await onCreateTag(newName.trim(), newColor)
    setNewName('')
    setNewColor('#39FF14')
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  async function handleSaveEdit(id: string) {
    await onUpdateTag(id, editName.trim(), editColor)
    setEditingId(null)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="MANAGE TAGS" width="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Existing tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tags.length === 0 && (
            <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              No tags yet. Create one below.
            </p>
          )}
          {tags.map((tag) => (
            <div key={tag.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                border: '1px solid var(--color-border)', background: 'var(--bg-elevated)',
              }}
            >
              {editingId === tag.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  {/* Row 1: color preview + name input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, background: editColor, flexShrink: 0, border: '1px solid var(--color-border-bright)' }} />
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ flex: 1, padding: '4px 8px', fontSize: 12 }}
                      autoFocus
                    />
                  </div>
                  {/* Row 2: color picker */}
                  <ColorSwatch value={editColor} onChange={setEditColor} />
                  {/* Row 3: action buttons */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn-ghost" style={{ padding: '3px 12px', fontSize: 11 }} onClick={() => setEditingId(null)}>Cancel</button>
                    <button className="btn-neon" style={{ padding: '3px 12px', fontSize: 11 }} onClick={() => handleSaveEdit(tag.id)}>Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ width: 12, height: 12, background: tag.color, flexShrink: 0, boxShadow: `0 0 4px ${tag.color}` }} />
                  <span className="font-mono" style={{ flex: 1, fontSize: 12, color: tag.color }}>{tag.name}</span>
                  <button className="btn-ghost" style={{ padding: '2px 8px', fontSize: 10 }} onClick={() => startEdit(tag)}>Edit</button>
                  <button className="btn-pink" style={{ padding: '2px 8px', fontSize: 10 }} onClick={() => onDeleteTag(tag.id)}>Del</button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Create new */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
          <label style={{ marginBottom: 8, display: 'block' }}>New Tag</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="text"
              placeholder="Tag name (e.g. Work)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            />
            <ColorSwatch value={newColor} onChange={setNewColor} />
            <button className="btn-neon" onClick={handleCreate} disabled={!newName.trim()}>
              + Create Tag
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
