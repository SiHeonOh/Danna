import { createContext, useContext, useState, type ReactNode } from 'react'
import { useTags } from '@/hooks/useTags'
import { useItems } from '@/hooks/useItems'
import { useRecurrenceRules } from '@/hooks/useRecurrenceRules'
import { useInstanceOverrides } from '@/hooks/useInstanceOverrides'
import type { Tag, Item, RecurrenceRule, InstanceOverride } from '@/types/app.types'

interface PlannerContextValue {
  // Tags
  tags: Tag[]
  tagsLoading: boolean
  createTag: ReturnType<typeof useTags>['createTag']
  updateTag: ReturnType<typeof useTags>['updateTag']
  deleteTag: ReturnType<typeof useTags>['deleteTag']
  tagById: ReturnType<typeof useTags>['tagById']

  // Items
  items: Item[]
  itemsLoading: boolean
  createItem: ReturnType<typeof useItems>['createItem']
  updateItem: ReturnType<typeof useItems>['updateItem']
  deleteItem: ReturnType<typeof useItems>['deleteItem']
  toggleComplete: ReturnType<typeof useItems>['toggleComplete']

  // Recurrence rules
  rules: RecurrenceRule[]
  upsertRule: ReturnType<typeof useRecurrenceRules>['upsertRule']
  deleteRule: ReturnType<typeof useRecurrenceRules>['deleteRule']
  ruleForItem: ReturnType<typeof useRecurrenceRules>['ruleForItem']

  // Instance overrides
  overrides: InstanceOverride[]
  upsertOverride: ReturnType<typeof useInstanceOverrides>['upsertOverride']
  overridesForItem: ReturnType<typeof useInstanceOverrides>['overridesForItem']
  getOverride: ReturnType<typeof useInstanceOverrides>['getOverride']

  // UI state
  activeTagFilter: string | null
  setActiveTagFilter: (id: string | null) => void
  selectedItemId: string | null
  setSelectedItemId: (id: string | null) => void
}

const PlannerContext = createContext<PlannerContextValue | null>(null)

export function PlannerProvider({ children }: { children: ReactNode }) {
  const { tags, loading: tagsLoading, createTag, updateTag, deleteTag, tagById } = useTags()
  const { items, loading: itemsLoading, createItem, updateItem, deleteItem, toggleComplete } = useItems()
  const { rules, upsertRule, deleteRule, ruleForItem } = useRecurrenceRules()
  const { overrides, upsertOverride, overridesForItem, getOverride } = useInstanceOverrides()
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  return (
    <PlannerContext.Provider
      value={{
        tags, tagsLoading, createTag, updateTag, deleteTag, tagById,
        items, itemsLoading, createItem, updateItem, deleteItem, toggleComplete,
        rules, upsertRule, deleteRule, ruleForItem,
        overrides, upsertOverride, overridesForItem, getOverride,
        activeTagFilter, setActiveTagFilter,
        selectedItemId, setSelectedItemId,
      }}
    >
      {children}
    </PlannerContext.Provider>
  )
}

export function usePlanner(): PlannerContextValue {
  const ctx = useContext(PlannerContext)
  if (!ctx) throw new Error('usePlanner must be used within PlannerProvider')
  return ctx
}
