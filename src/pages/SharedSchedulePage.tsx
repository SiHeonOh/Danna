import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DndContext, useSensors } from '@dnd-kit/core'
import { addWeeks, subWeeks, startOfWeek, endOfWeek, format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { normalizeTime } from '@/lib/dateUtils'
import { useCalendarView, useAllDayItems, useDueTasks } from '@/hooks/useCalendarView'
import { useDateLocale } from '@/hooks/useDateLocale'
import WeekView from '@/components/calendar/WeekView'
import ThemeToggle from '@/components/ui/ThemeToggle'
import type { Item, Tag, RecurrenceRule, InstanceOverride } from '@/types/app.types'

// Public, read-only view of someone's schedule, reached via /s/<token>.
// Data comes ONLY through the get_shared_schedule() RPC (SECURITY DEFINER,
// token-scoped) — the anon client has no other path into the owner's tables.

interface SharedPayload {
  label: string | null
  items: Item[]
  tags: Tag[]
  rules: RecurrenceRule[]
  overrides: InstanceOverride[]
}

const EMPTY: SharedPayload = { label: null, items: [], tags: [], rules: [], overrides: [] }
const noop = () => {}

export default function SharedSchedulePage() {
  const { token } = useParams<{ token: string }>()
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const [status, setStatus] = useState<'loading' | 'ok' | 'invalid'>('loading')
  const [payload, setPayload] = useState<SharedPayload>(EMPTY)
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    supabase.rpc('get_shared_schedule', { p_token: token }).then(({ data, error }) => {
      if (error || !data) { setStatus('invalid'); return }
      const d = data as SharedPayload
      setPayload({
        label: d.label ?? null,
        items: (d.items ?? []).map((i) => ({ ...i, start_time: normalizeTime(i.start_time), end_time: normalizeTime(i.end_time) })),
        tags: d.tags ?? [],
        rules: d.rules ?? [],
        overrides: (d.overrides ?? []).map((o) => ({
          ...o,
          override_start_time: normalizeTime(o.override_start_time),
          override_end_time: normalizeTime(o.override_end_time),
        })),
      })
      setStatus('ok')
    })
  }, [token])

  const { from, to } = useMemo(() => ({
    from: startOfWeek(date, { weekStartsOn: 1 }),
    to: endOfWeek(date, { weekStartsOn: 1 }),
  }), [date])

  const { items, tags, rules, overrides } = payload
  const blocks = useCalendarView({ items, rules, overrides, tags, from, to })
  const allDayBlocks = useAllDayItems(items, rules, overrides, tags, from, to)
  const dueTasks = useDueTasks(items, rules, overrides, tags, from, to)
  const sensors = useSensors() // no sensors → nothing is draggable

  const rangeLabel = `${format(from, 'MMM d', { locale: dateLocale })} — ${format(to, 'MMM d, yyyy', { locale: dateLocale })}`.toUpperCase()

  if (status !== 'ok') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="font-display" style={{ fontSize: 28, color: 'var(--color-primary)', letterSpacing: '0.16em' }}>DANNA</div>
          <p className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12 }}>
            {status === 'loading' ? t('share.loading') : t('share.invalid')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* Minimal header: identity + week nav + read-only badge */}
      <div
        style={{
          height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 12px 0 0', borderBottom: '2px solid var(--color-border)', background: 'var(--bg-surface)',
        }}
      >
        <div style={{ width: 4, alignSelf: 'stretch', background: 'var(--color-primary)', flexShrink: 0, marginRight: 8 }} />
        <span className="font-display" style={{ fontSize: 24, color: 'var(--color-primary)', letterSpacing: '0.16em', flexShrink: 0 }}>DANNA</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginLeft: 6 }}>
          <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: 18, lineHeight: 1, letterSpacing: 0 }} onClick={() => setDate((d) => subWeeks(d, 1))}>‹</button>
          <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12, marginLeft: -2 }} onClick={() => setDate(new Date())}>{t('nav.today')}</button>
          <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: 18, lineHeight: 1, letterSpacing: 0, marginLeft: -2 }} onClick={() => setDate((d) => addWeeks(d, 1))}>›</button>
        </div>
        <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {rangeLabel}
        </span>
        <div style={{ flex: 1 }} />
        {payload.label && (
          <span className="font-display" style={{ fontSize: 13, color: 'var(--color-text)', letterSpacing: '0.1em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
            {payload.label}
          </span>
        )}
        <span className="font-mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-bright)', padding: '3px 6px', whiteSpace: 'nowrap' }}>
          {t('share.readOnly')}
        </span>
        <ThemeToggle />
      </div>

      <DndContext sensors={sensors}>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
          <WeekView
            date={date}
            blocks={blocks}
            allDayBlocks={allDayBlocks}
            dueTasks={dueTasks}
            activeDragId={null}
            onSlotClick={noop}
            onBlockDoubleClick={noop}
            onCompleteInstance={noop}
            onAllDayClick={noop}
            onAllDayAdd={noop}
            onDueToggle={noop}
            readOnly
          />
        </div>
      </DndContext>
    </div>
  )
}
