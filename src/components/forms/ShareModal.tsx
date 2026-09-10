import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import { useShareLinks, shareUrl } from '@/hooks/useShareLinks'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { t } = useTranslation()
  const { links, loading, createLink, revokeLink, deleteLink } = useShareLinks(isOpen)
  const [label, setLabel] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const active = links.filter((l) => !l.revoked_at)
  const revoked = links.filter((l) => l.revoked_at)

  async function handleCreate() {
    setBusy(true)
    await createLink(label)
    setLabel('')
    setBusy(false)
  }

  async function handleCopy(id: string, token: string) {
    const url = shareUrl(token)
    // Phones: native share sheet when available; otherwise clipboard
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try { await navigator.share({ title: 'DANNA', url }); return } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500)
    } catch {
      window.prompt(t('share.copyManual'), url)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('share.title')} width="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
          {t('share.hint')}
        </p>

        {/* Create */}
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            placeholder={t('share.labelPlaceholder')}
            style={{ flex: 1 }}
          />
          <button className="btn-neon" onClick={handleCreate} disabled={busy} style={{ flexShrink: 0 }}>
            {t('share.create')}
          </button>
        </div>

        {/* Active links */}
        <div>
          <label>{t('share.active')} ({active.length})</label>
          {loading && links.length === 0 && (
            <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>…</p>
          )}
          {!loading && active.length === 0 && (
            <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '4px 0' }}>{t('share.empty')}</p>
          )}
          {active.map((l) => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 4, borderLeft: '3px solid var(--color-primary)', background: 'var(--bg-elevated)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-display" style={{ fontSize: 12, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {l.label || t('share.untitled')}
                </div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {shareUrl(l.token)}
                </div>
              </div>
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 11, flexShrink: 0 }} onClick={() => handleCopy(l.id, l.token)}>
                {copiedId === l.id ? t('share.copied') : t('share.copy')}
              </button>
              <button className="btn-pink" style={{ padding: '4px 10px', fontSize: 11, flexShrink: 0 }} onClick={() => revokeLink(l.id)}>
                {t('share.revoke')}
              </button>
            </div>
          ))}
        </div>

        {/* Revoked (kept for the record; deletable) */}
        {revoked.length > 0 && (
          <div>
            <label>{t('share.revoked')} ({revoked.length})</label>
            {revoked.map((l) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', marginBottom: 4, borderLeft: '3px solid var(--color-border-bright)', opacity: 0.55 }}>
                <div className="font-display" style={{ flex: 1, minWidth: 0, fontSize: 12, textDecoration: 'line-through', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {l.label || t('share.untitled')}
                </div>
                <button className="btn-ghost" style={{ padding: '3px 8px', fontSize: 10, flexShrink: 0 }} onClick={() => deleteLink(l.id)}>
                  {t('common.delete')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
