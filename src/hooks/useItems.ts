import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { readCache, writeCache } from '@/lib/offlineCache'
import { useRefetchOnFocus } from './useRefetchOnFocus'
import { normalizeTime } from '@/lib/dateUtils'
import type { Item } from '@/types/app.types'

// Postgres returns time columns as HH:MM:SS; the app works in HH:MM
const normItem = (i: Item): Item => ({ ...i, start_time: normalizeTime(i.start_time), end_time: normalizeTime(i.end_time) })

export function useItems() {
  const cached = readCache<Item>('items')
  const [items, setItems] = useState<Item[]>(cached)
  const [loading, setLoading] = useState(cached.length === 0)
  // Only write to cache once we have confirmed fresh data from Supabase,
  // so an offline boot never overwrites a valid cache with an empty array.
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (hasFetchedRef.current) {
      writeCache('items', items)
    }
  }, [items])

  // Safety for deploys that land before migration 004 (the `location`
  // column): if fetched rows lack the key, strip it from writes so saves
  // don't fail with "column does not exist".
  const supportsLocationRef = useRef(true)
  const stripUnsupported = <T extends object>(data: T): T => {
    if (supportsLocationRef.current || !('location' in data)) return data
    const copy = { ...data } as Record<string, unknown>
    delete copy.location
    return copy as T
  }

  const fetchItems = useCallback(() => {
    supabase
      .from('items')
      .select('*')
      .order('created_at')
      .then(({ data }) => {
        if (data) {
          hasFetchedRef.current = true
          if (data.length > 0) supportsLocationRef.current = 'location' in (data[0] as object)
          setItems((data as Item[]).map(normItem))
        }
        setLoading(false)
      })
  }, [])

  // Cross-device fallback when realtime is unavailable
  useRefetchOnFocus(fetchItems)

  useEffect(() => {
    setLoading(cached.length === 0)
    fetchItems()

    const channel = supabase
      .channel('items-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
        hasFetchedRef.current = true
        if (payload.eventType === 'INSERT') {
          // Dedupe: the local-first mutation below may have already applied it
          setItems((prev) => prev.some((i) => i.id === (payload.new as Item).id)
            ? prev
            : [...prev, normItem(payload.new as Item)])
        } else if (payload.eventType === 'UPDATE') {
          setItems((prev) =>
            prev.map((i) => (i.id === payload.new.id ? normItem(payload.new as Item) : i)),
          )
        } else if (payload.eventType === 'DELETE') {
          setItems((prev) => prev.filter((i) => i.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // All mutations apply the change to local state immediately (local-first) —
  // the realtime echo is used for cross-device sync only, and is deduped
  // above. Relying on realtime alone left the UI frozen until reload for
  // users whose network blocks websockets.
  const createItem = useCallback(async (data: Omit<Item, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: created, error } = await supabase.from('items').insert(stripUnsupported({ ...data, user_id: user!.id })).select().single()
    if (created) {
      setItems((prev) => prev.some((i) => i.id === (created as Item).id) ? prev : [...prev, normItem(created as Item)])
    }
    return { data: created ? normItem(created as Item) : null, error: error?.message ?? null }
  }, [])

  const updateItem = useCallback(async (id: string, data: Partial<Item>) => {
    const patch = { ...data, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('items').update(stripUnsupported(patch)).eq('id', id)
    if (!error) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
    }
    return { error: error?.message ?? null }
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }
    return { error: error?.message ?? null }
  }, [])

  const toggleComplete = useCallback(async (id: string, current: boolean) => {
    const patch = { is_completed: !current, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('items').update(patch).eq('id', id)
    if (!error) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
    }
    return { error: error?.message ?? null }
  }, [])

  return { items, loading, createItem, updateItem, deleteItem, toggleComplete }
}
