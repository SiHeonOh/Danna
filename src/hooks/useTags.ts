import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tag } from '@/types/app.types'

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('tags')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        if (data) setTags(data as Tag[])
        setLoading(false)
      })

    const channel = supabase
      .channel('tags-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTags((prev) => [...prev, payload.new as Tag].sort((a, b) => a.sort_order - b.sort_order))
        } else if (payload.eventType === 'UPDATE') {
          setTags((prev) =>
            prev.map((t) => (t.id === payload.new.id ? (payload.new as Tag) : t)),
          )
        } else if (payload.eventType === 'DELETE') {
          setTags((prev) => prev.filter((t) => t.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const createTag = useCallback(async (data: Omit<Tag, 'id' | 'user_id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('tags').insert({ ...data, user_id: user!.id })
    return { error: error?.message ?? null }
  }, [])

  const updateTag = useCallback(async (id: string, data: Partial<Tag>) => {
    const { error } = await supabase.from('tags').update(data).eq('id', id)
    return { error: error?.message ?? null }
  }, [])

  const deleteTag = useCallback(async (id: string) => {
    const { error } = await supabase.from('tags').delete().eq('id', id)
    return { error: error?.message ?? null }
  }, [])

  const tagById = useCallback(
    (id: string | null) => tags.find((t) => t.id === id) ?? null,
    [tags],
  )

  return { tags, loading, createTag, updateTag, deleteTag, tagById }
}
