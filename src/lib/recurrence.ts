import { RRule, Weekday } from 'rrule'
import { addDays, format } from 'date-fns'
import type { RecurrenceRule, InstanceOverride, Item } from '@/types/app.types'
import { supabase } from './supabase'

/**
 * Parse a yyyy-MM-dd string as UTC midnight.
 * rrule works entirely in UTC, so all Date values passed to it must be UTC
 * midnight to avoid day-shift bugs in UTC+ timezones.
 */
export function utcMidnight(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/**
 * Format a UTC Date back to yyyy-MM-dd using UTC components.
 * date-fns format() uses local time, which would shift the date again.
 */
export function utcDateStr(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const WEEKDAY_MAP: Record<string, Weekday> = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU,
}

export function buildRRule(rule: RecurrenceRule, dtstart: Date): RRule {
  const options: Partial<ConstructorParameters<typeof RRule>[0]> = {
    dtstart,
    interval: rule.interval,
    until: rule.end_date ? utcMidnight(rule.end_date) : undefined,
  }

  switch (rule.frequency) {
    case 'daily':
    case 'custom':
      options.freq = RRule.DAILY
      break
    case 'weekly':
      options.freq = RRule.WEEKLY
      if (rule.days_of_week?.length) {
        options.byweekday = rule.days_of_week.map((d) => WEEKDAY_MAP[d]).filter(Boolean)
      }
      break
    case 'monthly':
      options.freq = RRule.MONTHLY
      if (rule.day_of_month) {
        options.bymonthday = rule.day_of_month
      } else if (rule.ordinal && rule.days_of_week?.length) {
        const ordinalMap: Record<string, number> = {
          first: 1, second: 2, third: 3, fourth: 4, last: -1,
        }
        const pos = ordinalMap[rule.ordinal]
        options.byweekday = rule.days_of_week
          .map((d) => WEEKDAY_MAP[d]?.nth(pos))
          .filter(Boolean)
      }
      break
    case 'yearly':
      options.freq = RRule.YEARLY
      if (rule.month_of_year) options.bymonth = rule.month_of_year
      if (rule.day_of_month) options.bymonthday = rule.day_of_month
      break
  }

  return new RRule(options)
}

export function expandInstances(
  item: Item,
  rule: RecurrenceRule,
  from: Date,
  to: Date,
): Date[] {
  if (!item.date) return []
  // dtstart must be UTC midnight — rrule operates in UTC, so any local-time
  // offset in dtstart causes occurrences to land on the wrong calendar day.
  const dtstart = utcMidnight(item.date)
  const rrule = buildRRule(rule, dtstart)
  // Range bounds also need to be UTC midnight/end-of-day so rrule's UTC
  // comparisons align with the local calendar dates we're querying.
  const fromUTC = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()))
  const toUTC = new Date(Date.UTC(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59))
  return rrule.between(fromUTC, toUTC, true)
}

export function isSkipped(
  itemId: string,
  originalDate: string,
  overrides: InstanceOverride[],
): boolean {
  return overrides.some(
    (o) => o.item_id === itemId && o.original_date === originalDate && o.is_skipped,
  )
}

export function getOverride(
  itemId: string,
  originalDate: string,
  overrides: InstanceOverride[],
): InstanceOverride | undefined {
  return overrides.find((o) => o.item_id === itemId && o.original_date === originalDate)
}

export async function skipInstance(itemId: string, originalDate: string): Promise<void> {
  await supabase.from('instance_overrides').upsert(
    { item_id: itemId, original_date: originalDate, is_skipped: true },
    { onConflict: 'item_id,original_date' },
  )
}

export async function completeInstance(itemId: string, originalDate: string): Promise<void> {
  await supabase.from('instance_overrides').upsert(
    { item_id: itemId, original_date: originalDate, is_completed: true, is_skipped: false },
    { onConflict: 'item_id,original_date' },
  )
}

export async function splitAtDate(
  item: Item,
  rule: RecurrenceRule,
  fromDate: string,
  newData: Partial<Item>,
  newRuleData: Partial<RecurrenceRule>,
  overrides: InstanceOverride[],
): Promise<void> {
  const splitDay = parseISO(fromDate)
  const dayBefore = format(addDays(splitDay, -1), 'yyyy-MM-dd')

  await supabase
    .from('recurrence_rules')
    .update({ end_date: dayBefore })
    .eq('id', rule.id)

  const { data: newItem } = await supabase
    .from('items')
    .insert({ ...item, id: undefined, ...newData, date: fromDate, created_at: undefined, updated_at: undefined })
    .select()
    .single()

  if (!newItem) return

  await supabase.from('recurrence_rules').insert({
    ...rule,
    id: undefined,
    item_id: newItem.id,
    end_date: null,
    ...newRuleData,
    created_at: undefined,
  })

  const futureOverrides = overrides.filter(
    (o) => o.item_id === item.id && o.original_date >= fromDate,
  )
  if (futureOverrides.length > 0) {
    await supabase.from('instance_overrides').insert(
      futureOverrides.map((o) => ({
        ...o,
        id: undefined,
        item_id: newItem.id,
        created_at: undefined,
      })),
    )
  }
}
