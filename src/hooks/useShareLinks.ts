import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface ShareLink {
  id: string
  user_id: string
  token: string
  label: string | null
  created_at: string
  revoked_at: string | null
}

// 24 random bytes → 32-char url-safe base64 (192 bits of entropy)
function makeToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function shareUrl(token: string): string {
  return `${window.location.origin}/s/${token}`
}

// Owner-side management of read-only share links (RLS: owner only).
export function useShareLinks(enabled: boolean) {
  const [links, setLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('share_links')
      .select('*')
      .order('created_at', { ascending: false })
    setLinks((data as ShareLink[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (enabled) refresh()
  }, [enabled, refresh])

  const createLink = useCallback(async (label: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('share_links')
      .insert({ user_id: user!.id, token: makeToken(), label: label.trim() || null })
      .select()
      .single()
    if (data) setLinks((prev) => [data as ShareLink, ...prev])
    return { data: (data as ShareLink | null) ?? null, error: error?.message ?? null }
  }, [])

  const revokeLink = useCallback(async (id: string) => {
    const revoked_at = new Date().toISOString()
    const { error } = await supabase.from('share_links').update({ revoked_at }).eq('id', id)
    if (!error) setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, revoked_at } : l)))
    return { error: error?.message ?? null }
  }, [])

  const deleteLink = useCallback(async (id: string) => {
    const { error } = await supabase.from('share_links').delete().eq('id', id)
    if (!error) setLinks((prev) => prev.filter((l) => l.id !== id))
    return { error: error?.message ?? null }
  }, [])

  return { links, loading, refresh, createLink, revokeLink, deleteLink }
}
