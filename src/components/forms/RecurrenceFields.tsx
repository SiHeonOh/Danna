import type { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import type { ItemFormValues } from '@/types/app.types'

const DAYS = [
  { key: 'MO', label: 'M' },
  { key: 'TU', label: 'T' },
  { key: 'WE', label: 'W' },
  { key: 'TH', label: 'T' },
  { key: 'FR', label: 'F' },
  { key: 'SA', label: 'S' },
  { key: 'SU', label: 'S' },
]

interface RecurrenceFieldsProps {
  register: UseFormRegister<ItemFormValues>
  watch: UseFormWatch<ItemFormValues>
  setValue: UseFormSetValue<ItemFormValues>
}

export default function RecurrenceFields({ register, watch, setValue }: RecurrenceFieldsProps) {
  const frequency = watch('recurrence.frequency')
  const daysOfWeek = watch('recurrence.days_of_week') ?? []

  function toggleDay(day: string) {
    const current = daysOfWeek ?? []
    if (current.includes(day)) {
      setValue('recurrence.days_of_week', current.filter((d) => d !== day))
    } else {
      setValue('recurrence.days_of_week', [...current, day])
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label>Frequency</label>
        <select {...register('recurrence.frequency')}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="custom">Custom (every N days)</option>
        </select>
      </div>

      <div>
        <label>Every</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number"
            min={1}
            max={365}
            style={{ width: 64 }}
            {...register('recurrence.interval', { valueAsNumber: true })}
          />
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {frequency === 'daily' || frequency === 'custom'
              ? 'day(s)'
              : frequency === 'weekly'
              ? 'week(s)'
              : frequency === 'monthly'
              ? 'month(s)'
              : 'year(s)'}
          </span>
        </div>
      </div>

      {(frequency === 'weekly' || frequency === 'custom') && (
        <div>
          <label>Days of Week</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {DAYS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDay(d.key)}
                className="font-mono"
                style={{
                  width: 28,
                  height: 28,
                  background: daysOfWeek.includes(d.key) ? 'var(--color-primary)' : 'transparent',
                  color: daysOfWeek.includes(d.key) ? 'var(--bg-base)' : 'var(--color-text-muted)',
                  border: `1px solid ${daysOfWeek.includes(d.key) ? 'var(--color-primary)' : 'var(--color-border-bright)'}`,
                  fontSize: 11,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {frequency === 'monthly' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>Day of Month</label>
            <input
              type="number"
              min={1}
              max={31}
              placeholder="e.g. 15"
              {...register('recurrence.day_of_month', { valueAsNumber: true })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Ordinal (optional)</label>
            <select {...register('recurrence.ordinal')}>
              <option value="">None</option>
              <option value="first">First</option>
              <option value="second">Second</option>
              <option value="third">Third</option>
              <option value="fourth">Fourth</option>
              <option value="last">Last</option>
            </select>
          </div>
        </div>
      )}

      {frequency === 'yearly' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>Month</label>
            <select {...register('recurrence.month_of_year', { valueAsNumber: true })}>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Day</label>
            <input
              type="number"
              min={1}
              max={31}
              {...register('recurrence.day_of_month', { valueAsNumber: true })}
            />
          </div>
        </div>
      )}

      <div>
        <label>End Date (optional)</label>
        <input type="date" {...register('recurrence.end_date')} />
      </div>
    </div>
  )
}
