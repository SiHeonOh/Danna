import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { readCache, writeCache } from '@/lib/offlineCache'
import type { Tag } from '@/types/app.types'

export function useTags() {
  const cached = readCache<Tag>('tags')
  const [tags, setTags] = useState<Tag[]>(cached)
  const [loading, setLoading] = useState(cached.length === 0)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (hasFetchedRef.current) {
      writeCache('tags', tags)
    }
  }, [tags])

  useEffect(() => {
    setLoading(cached.length === 0)
    supabase
      .from('tags')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        if (data) {
          hasFetchedRef.current = true
          setTags(data as Tag[])
        }
        setLoading(false)
      })

    const channel = supabase
      .channel('tags-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags' }, (payload) => {
        hasFetchedRef.current = true
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
