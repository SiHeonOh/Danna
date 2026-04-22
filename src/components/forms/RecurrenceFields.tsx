import type { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const frequency = watch('recurrence.frequency')
  const daysOfWeek = watch('recurrence.days_of_week') ?? []
  const monthNames = t('recurrence.monthNames', { returnObjects: true }) as string[]

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
        <label>{t('recurrence.frequency')}</label>
        <select {...register('recurrence.frequency')}>
          <option value="daily">{t('recurrence.daily')}</option>
          <option value="weekly">{t('recurrence.weekly')}</option>
          <option value="monthly">{t('recurrence.monthly')}</option>
          <option value="yearly">{t('recurrence.yearly')}</option>
          <option value="custom">{t('recurrence.custom')}</option>
        </select>
      </div>

      <div>
        <label>{t('recurrence.every')}</label>
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
              ? t('recurrence.days')
              : frequency === 'weekly'
              ? t('recurrence.weeks')
              : frequency === 'monthly'
              ? t('recurrence.months')
              : t('recurrence.years')}
          </span>
        </div>
      </div>

      {(frequency === 'weekly' || frequency === 'custom') && (
        <div>
          <label>{t('recurrence.daysOfWeek')}</label>
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
                  color: daysOfWeek.includes(d.key) ? 'var(--bg-base)' : 'var(--color-text)',
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
            <label>{t('recurrence.dayOfMonth')}</label>
            <input
              type="number"
              min={1}
              max={31}
              placeholder="e.g. 15"
              {...register('recurrence.day_of_month', { valueAsNumber: true })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>{t('recurrence.ordinal')}</label>
            <select {...register('recurrence.ordinal')}>
              <option value="">{t('recurrence.ordinals.none')}</option>
              <option value="first">{t('recurrence.ordinals.first')}</option>
              <option value="second">{t('recurrence.ordinals.second')}</option>
              <option value="third">{t('recurrence.ordinals.third')}</option>
              <option value="fourth">{t('recurrence.ordinals.fourth')}</option>
              <option value="last">{t('recurrence.ordinals.last')}</option>
            </select>
          </div>
        </div>
      )}

      {frequency === 'yearly' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>{t('recurrence.monthLabel')}</label>
            <select {...register('recurrence.month_of_year', { valueAsNumber: true })}>
              {monthNames.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>{t('recurrence.day')}</label>
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
        <label>{t('recurrence.endDate')}</label>
        <input type="date" {...register('recurrence.end_date')} />
      </div>
    </div>
  )
}
