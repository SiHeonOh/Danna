export type ItemType = 'task' | 'event' | 'allday'
export type Priority = 'low' | 'medium' | 'high'
export type GoalPeriod = 'weekly' | 'monthly'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
export type EditScope = 'this' | 'future' | 'all'

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  sort_order: number
  created_at: string
}

export interface Item {
  id: string
  user_id: string
  type: ItemType
  title: string
  description: string | null
  tag_id: string | null
  date: string | null
  start_time: string | null
  end_time: string | null
  is_completed: boolean
  priority: Priority | null
  goal_period: GoalPeriod | null
  created_at: string
  updated_at: string
}

export interface RecurrenceRule {
  id: string
  item_id: string
  frequency: RecurrenceFrequency
  interval: number
  days_of_week: string[] | null
  day_of_month: number | null
  month_of_year: number | null
  ordinal: string | null
  end_date: string | null
  created_at: string
}

export interface InstanceOverride {
  id: string
  item_id: string
  original_date: string
  override_date: string | null
  override_start_time: string | null
  override_end_time: string | null
  override_title: string | null
  is_skipped: boolean
  is_completed: boolean
  created_at: string
}

export interface CalendarBlock {
  key: string
  item: Item
  date: string
  start_time: string
  end_time: string
  title: string
  is_completed: boolean
  is_recurring: boolean
  original_date: string
  override_id: string | null
  tag: Tag | null
}

export interface ItemFormValues {
  type: ItemType
  title: string
  description: string
  tag_id: string
  date: string
  start_time: string
  end_time: string
  priority: Priority | ''
  is_completed: boolean
  has_recurrence: boolean
  recurrence: RecurrenceFormValues
}

export interface RecurrenceFormValues {
  frequency: RecurrenceFrequency
  interval: number
  days_of_week: string[]
  day_of_month: number | ''
  month_of_year: number | ''
  ordinal: string
  end_date: string
}
