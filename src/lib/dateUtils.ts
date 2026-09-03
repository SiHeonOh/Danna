import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  format,
  addDays,
  parseISO,
  differenceInMinutes,
} from 'date-fns'

export const SLOT_HEIGHT_PX = 15
export const SLOTS_PER_HOUR = 4
export const TOTAL_SLOTS = 96

export function snapTo15Min(date: Date): Date {
  const mins = date.getMinutes()
  const snapped = Math.round(mins / 15) * 15
  const result = new Date(date)
  result.setMinutes(snapped, 0, 0)
  if (snapped === 60) {
    result.setHours(result.getHours() + 1)
    result.setMinutes(0)
  }
  return result
}

export function snapMinutesTo15(minutes: number): number {
  return Math.round(minutes / 15) * 15
}

// Postgres `time` columns come back as "HH:MM:SS"; the app (TimePicker slots,
// equality checks) works in "HH:MM". Normalize at the data boundary.
export function normalizeTime(time: string | null | undefined): string | null {
  if (!time) return null
  return time.length > 5 ? time.slice(0, 5) : time
}

export function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function slotIndexToMinutes(index: number): number {
  return index * 15
}

export function minutesToSlotIndex(minutes: number): number {
  return Math.floor(minutes / 15)
}

export function topFromTime(startTime: string): number {
  return (timeStringToMinutes(startTime) / 15) * SLOT_HEIGHT_PX
}

export function heightFromTimes(startTime: string, endTime: string): number {
  const diff = timeStringToMinutes(endTime) - timeStringToMinutes(startTime)
  return Math.max(diff / 15, 1) * SLOT_HEIGHT_PX
}

export function weekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  }
}

export function dayRange(date: Date): { start: Date; end: Date } {
  return { start: startOfDay(date), end: endOfDay(date) }
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm')
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'EEE, MMM d')
}

export function formatDisplayTime(time: string): string {
  const mins = timeStringToMinutes(time)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const ampm = h < 12 ? 'AM' : 'PM'
  const displayH = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${displayH}${ampm}` : `${displayH}:${String(m).padStart(2, '0')}${ampm}`
}

export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function durationMinutes(startTime: string, endTime: string): number {
  return timeStringToMinutes(endTime) - timeStringToMinutes(startTime)
}

export function addMinutesToTime(time: string, minutes: number): string {
  const total = timeStringToMinutes(time) + minutes
  const clamped = Math.max(0, Math.min(total, 23 * 60 + 45))
  return minutesToTimeString(clamped)
}

export { parseISO, differenceInMinutes, format, addDays }
