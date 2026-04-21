import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Item } from '@/types/app.types'

export function useItems() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('items')
      .select('*')
      .order('created_at')
      .then(({ data }) => {
        if (data) setItems(data as Item[])
        setLoading(false)
      })

    const channel = supabase
      .channel('items-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems((prev) => [...prev, payload.new as Item])
        } else if (payload.eventType === 'UPDATE') {
          setItems((prev) =>
            prev.map((i) => (i.id === payload.new.id ? (payload.new as Item) : i)),
          )
        } else if (payload.eventType === 'DELETE') {
          setItems((prev) => prev.filter((i) => i.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const createItem = useCallback(async (data: Omit<Item, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: created, error } = await supabase.from('items').insert({ ...data, user_id: user!.id }).select().single()
    return { data: created as Item | null, error: error?.message ?? null }
  }, [])

  const updateItem = useCallback(async (id: string, data: Partial<Item>) => {
    const { error } = await supabase
      .from('items')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    return { error: error?.message ?? null }
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase.from('items').delete().eq('id', id)
    return { error: error?.message ?? null }
  }, [])

  const toggleComplete = useCallback(async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('items')
      .update({ is_completed: !current, updated_at: new Date().toISOString() })
      .eq('id', id)
    return { error: error?.message ?? null }
  }, [])

  return { items, loading, createItem, updateItem, deleteItem, toggleComplete }
}
