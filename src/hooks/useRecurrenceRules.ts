import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { readCache, writeCache } from '@/lib/offlineCache'
import { useRefetchOnFocus } from './useRefetchOnFocus'
import type { RecurrenceRule } from '@/types/app.types'

export function useRecurrenceRules() {
  const cached = readCache<RecurrenceRule>('rules')
  const [rules, setRules] = useState<RecurrenceRule[]>(cached)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (hasFetchedRef.current) {
      writeCache('rules', rules)
    }
  }, [rules])

  const fetchRules = useCallback(() => {
    supabase
      .from('recurrence_rules')
      .select('*')
      .then(({ data }) => {
        if (data) {
          hasFetchedRef.current = true
          setRules(data as RecurrenceRule[])
        }
      })
  }, [])

  // Cross-device fallback when realtime is unavailable
  useRefetchOnFocus(fetchRules)

  useEffect(() => {
    fetchRules()

    const channel = supabase
      .channel('rules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recurrence_rules' }, (payload) => {
        hasFetchedRef.current = true
        if (payload.eventType === 'INSERT') {
          // Dedupe: the local-first mutation below may have already applied it
          setRules((prev) => prev.some((r) => r.id === (payload.new as RecurrenceRule).id)
            ? prev
            : [...prev, payload.new as RecurrenceRule])
        } else if (payload.eventType === 'UPDATE') {
          setRules((prev) =>
            prev.map((r) => (r.id === payload.new.id ? (payload.new as RecurrenceRule) : r)),
          )
        } else if (payload.eventType === 'DELETE') {
          setRules((prev) => prev.filter((r) => r.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const upsertRule = useCallback(
    async (itemId: string, data: Omit<RecurrenceRule, 'id' | 'item_id' | 'created_at'>) => {
      // Local-first (realtime echo is cross-device sync only, deduped above)
      const existing = rules.find((r) => r.item_id === itemId)
      if (existing) {
        const { error } = await supabase
          .from('recurrence_rules')
          .update(data)
          .eq('id', existing.id)
        if (!error) {
          setRules((prev) => prev.map((r) => (r.id === existing.id ? { ...r, ...data } : r)))
        }
        return { error: error?.message ?? null }
      } else {
        const { data: created, error } = await supabase
          .from('recurrence_rules')
          .insert({ ...data, item_id: itemId })
          .select()
          .single()
        if (created) {
          setRules((prev) => prev.some((r) => r.id === (created as RecurrenceRule).id)
            ? prev
            : [...prev, created as RecurrenceRule])
        }
        return { error: error?.message ?? null }
      }
    },
    [rules],
  )

  const deleteRule = useCallback(async (itemId: string) => {
    const { error } = await supabase.from('recurrence_rules').delete().eq('item_id', itemId)
    if (!error) {
      setRules((prev) => prev.filter((r) => r.item_id !== itemId))
    }
    return { error: error?.message ?? null }
  }, [])

  const ruleForItem = useCallback(
    (itemId: string) => rules.find((r) => r.item_id === itemId) ?? null,
    [rules],
  )

  return { rules, upsertRule, deleteRule, ruleForItem }
}
