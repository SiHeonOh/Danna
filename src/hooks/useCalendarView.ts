import { useMemo } from 'react'
import { format } from 'date-fns'
import { expandInstances, getOverride, utcDateStr } from '@/lib/recurrence'
import type { Item, RecurrenceRule, InstanceOverride, Tag, CalendarBlock } from '@/types/app.types'

interface UseCalendarViewProps {
  items: Item[]
  rules: RecurrenceRule[]
  overrides: InstanceOverride[]
  tags: Tag[]
  from: Date
  to: Date
}

export function useCalendarView({ items, rules, overrides, tags, from, to }: UseCalendarViewProps): CalendarBlock[] {
  return useMemo(() => {
    const blocks: CalendarBlock[] = []
    const fromStr = format(from, 'yyyy-MM-dd')
    const toStr = format(to, 'yyyy-MM-dd')

    const tagMap = new Map(tags.map((t) => [t.id, t]))

    for (const item of items) {
      if (item.type === 'allday') continue // handled separately
      const rule = rules.find((r) => r.item_id === item.id)

      if (!rule) {
        // Non-recurring: emit if date in range
        if (!item.date || item.date < fromStr || item.date > toStr) continue
        if (!item.start_time || !item.end_time) continue
        blocks.push({
          key: item.id,
          item,
          date: item.date,
          start_time: item.start_time,
          end_time: item.end_time,
          title: item.title,
          is_completed: item.is_completed,
          is_recurring: false,
          original_date: item.date,
          override_id: null,
          tag: item.tag_id ? (tagMap.get(item.tag_id) ?? null) : null,
        })
      } else {
        // Recurring: expand instances in range
        const dates = expandInstances(item, rule, from, to)
        for (const d of dates) {
          const dateStr = utcDateStr(d)
          const override = getOverride(item.id, dateStr, overrides)
          if (override?.is_skipped) continue

          const start = override?.override_start_time ?? item.start_time
          const end = override?.override_end_time ?? item.end_time
          if (!start || !end) continue

          const effectiveDate = override?.override_date ?? dateStr
          blocks.push({
            key: `${item.id}::${dateStr}`,
            item,
            date: effectiveDate,
            start_time: start,
            end_time: end,
            title: override?.override_title ?? item.title,
            is_completed: override?.is_completed ?? item.is_completed,
            is_recurring: true,
            original_date: dateStr,
            override_id: override?.id ?? null,
            tag: item.tag_id ? (tagMap.get(item.tag_id) ?? null) : null,
          })
        }
      }
    }

    return blocks
  }, [items, rules, overrides, tags, from, to])
}

export function useAllDayItems(
  items: Item[],
  rules: RecurrenceRule[],
  overrides: InstanceOverride[],
  tags: Tag[],
  from: Date,
  to: Date,
): CalendarBlock[] {
  return useMemo(() => {
    const blocks: CalendarBlock[] = []
    const fromStr = format(from, 'yyyy-MM-dd')
    const toStr = format(to, 'yyyy-MM-dd')
    const tagMap = new Map(tags.map((t) => [t.id, t]))

    for (const item of items) {
      if (item.type !== 'allday') continue
      const rule = rules.find((r) => r.item_id === item.id)

      if (!rule) {
        if (!item.date || item.date < fromStr || item.date > toStr) continue
        blocks.push({
          key: item.id,
          item,
          date: item.date,
          start_time: '00:00',
          end_time: '00:00',
          title: item.title,
          is_completed: item.is_completed,
          is_recurring: false,
          original_date: item.date,
          override_id: null,
          tag: item.tag_id ? (tagMap.get(item.tag_id) ?? null) : null,
        })
      } else {
        const dates = expandInstances(item, rule, from, to)
        for (const d of dates) {
          const dateStr = utcDateStr(d)
          const override = getOverride(item.id, dateStr, overrides)
          if (override?.is_skipped) continue
          blocks.push({
            key: `${item.id}::${dateStr}`,
            item,
            date: dateStr,
            start_time: '00:00',
            end_time: '00:00',
            title: override?.override_title ?? item.title,
            is_completed: override?.is_completed ?? item.is_completed,
            is_recurring: true,
            original_date: dateStr,
            override_id: override?.id ?? null,
            tag: item.tag_id ? (tagMap.get(item.tag_id) ?? null) : null,
          })
        }
      }
    }

    return blocks
  }, [items, rules, overrides, tags, from, to])
}
