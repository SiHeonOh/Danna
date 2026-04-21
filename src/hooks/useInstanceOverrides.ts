import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { InstanceOverride } from '@/types/app.types'

export function useInstanceOverrides() {
  const [overrides, setOverrides] = useState<InstanceOverride[]>([])

  useEffect(() => {
    supabase
      .from('instance_overrides')
      .select('*')
      .then(({ data }) => { if (data) setOverrides(data as InstanceOverride[]) })

    const channel = supabase
      .channel('overrides-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'instance_overrides' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOverrides((prev) => [...prev, payload.new as InstanceOverride])
        } else if (payload.eventType === 'UPDATE') {
          setOverrides((prev) =>
            prev.map((o) => (o.id === payload.new.id ? (payload.new as InstanceOverride) : o)),
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
      const { error } = await supabase.from('instance_overrides').upsert(
        { item_id: itemId, original_date: originalDate, ...data },
        { onConflict: 'item_id,original_date' },
      )
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
