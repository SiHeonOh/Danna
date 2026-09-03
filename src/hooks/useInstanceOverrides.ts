import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { readCache, writeCache } from '@/lib/offlineCache'
import { useRefetchOnFocus } from './useRefetchOnFocus'
import { normalizeTime } from '@/lib/dateUtils'
import type { InstanceOverride } from '@/types/app.types'

// Postgres returns time columns as HH:MM:SS; the app works in HH:MM
const normOv = (o: InstanceOverride): InstanceOverride => ({ ...o, override_start_time: normalizeTime(o.override_start_time), override_end_time: normalizeTime(o.override_end_time) })

export function useInstanceOverrides() {
  const cached = readCache<InstanceOverride>('overrides')
  const [overrides, setOverrides] = useState<InstanceOverride[]>(cached)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (hasFetchedRef.current) {
      writeCache('overrides', overrides)
    }
  }, [overrides])

  const fetchOverrides = useCallback(() => {
    supabase
      .from('instance_overrides')
      .select('*')
      .then(({ data }) => {
        if (data) {
          hasFetchedRef.current = true
          setOverrides((data as InstanceOverride[]).map(normOv))
        }
      })
  }, [])

  // Cross-device fallback when realtime is unavailable
  useRefetchOnFocus(fetchOverrides)

  useEffect(() => {
    fetchOverrides()

    const channel = supabase
      .channel('overrides-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'instance_overrides' }, (payload) => {
        hasFetchedRef.current = true
        if (payload.eventType === 'INSERT') {
          // Dedupe: the local-first mutation below may have already applied it
          setOverrides((prev) => prev.some((o) => o.id === (payload.new as InstanceOverride).id)
            ? prev
            : [...prev, normOv(payload.new as InstanceOverride)])
        } else if (payload.eventType === 'UPDATE') {
          setOverrides((prev) =>
            prev.map((o) => (o.id === payload.new.id ? normOv(payload.new as InstanceOverride) : o)),
          )
        } else if (payload.eventType === 'DELETE') {
          setOverrides((prev) => prev.filter((o) => o.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const upsertOverride = useCallback(
    async (itemId: string, originalDate: string, data: Partial<InstanceOverride>) => {
      const { data: saved, error } = await supabase.from('instance_overrides').upsert(
        { item_id: itemId, original_date: originalDate, ...data },
        { onConflict: 'item_id,original_date' },
      ).select().single()
      // Local-first (realtime echo is cross-device sync only, deduped above)
      if (saved) {
        const row = normOv(saved as InstanceOverride)
        setOverrides((prev) => {
          const idx = prev.findIndex((o) => o.id === row.id)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = row
            return next
          }
          return [...prev, row]
        })
      }
      return { error: error?.message ?? null }
    },
    [],
  )

  const overridesForItem = useCallback(
    (itemId: string) => overrides.filter((o) => o.item_id === itemId),
    [overrides],
  )

  const getOverride = useCallback(
    (itemId: string, originalDate: string) =>
      overrides.find((o) => o.item_id === itemId && o.original_date === originalDate) ?? null,
    [overrides],
  )

  return { overrides, upsertOverride, overridesForItem, getOverride }
}
