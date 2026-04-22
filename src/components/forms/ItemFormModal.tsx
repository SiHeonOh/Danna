import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import DatePicker from '@/components/ui/DatePicker'
import TimePicker from '@/components/ui/TimePicker'
import RecurrenceFields from './RecurrenceFields'
import TagSelector from './TagSelector'
import type { Item, ItemFormValues, RecurrenceRule, Tag } from '@/types/app.types'

interface ItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (values: ItemFormValues) => void
  onDelete?: () => void
  tags: Tag[]
  defaultDate?: string
  defaultTime?: string
  defaultType?: Item['type']
  editItem?: Item | null
  editRule?: RecurrenceRule | null
}

const defaultRecurrence: ItemFormValues['recurrence'] = {
  frequency: 'weekly',
  interval: 1,
  days_of_week: [],
  day_of_month: '',
  month_of_year: '',
  ordinal: '',
  end_date: '',
}

function addHourToTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + 60
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export default function ItemFormModal({
  isOpen, onClose, onSave, onDelete, tags,
  defaultDate, defaultTime, defaultType = 'task', editItem, editRule,
}: ItemFormModalProps) {
  const { register, handleSubmit, watch, setValue, reset } = useForm<ItemFormValues>({
    defaultValues: {
      type: defaultType, title: '', description: '', tag_id: '',
      date: defaultDate ?? '', start_time: defaultTime ?? '',
      end_time: defaultTime ? addHourToTime(defaultTime) : '',
      priority: '', is_completed: false, has_recurrence: false,
      recurrence: defaultRecurrence,
    },
  })

  useEffect(() => {
    if (!isOpen) return
    if (editItem) {
      reset({
        type: editItem.type, title: editItem.title,
        description: editItem.description ?? '', tag_id: editItem.tag_id ?? '',
        date: editItem.date ?? '', start_time: editItem.start_time ?? '',
        end_time: editItem.end_time ?? '', priority: editItem.priority ?? '',
        is_completed: editItem.is_completed, has_recurrence: !!editRule,
        recurrence: editRule ? {
          frequency: editRule.frequency, interval: editRule.interval,
          days_of_week: editRule.days_of_week ?? [],
          day_of_month: editRule.day_of_month ?? '',
          month_of_year: editRule.month_of_year ?? '',
          ordinal: editRule.ordinal ?? '', end_date: editRule.end_date ?? '',
        } : defaultRecurrence,
      })
    } else {
      reset({
        type: defaultType, title: '', description: '', tag_id: '',
        date: defaultDate ?? '', start_time: defaultTime ?? '',
        end_time: defaultTime ? addHourToTime(defaultTime) : '',
        priority: '', is_completed: false, has_recurrence: false,
        recurrence: defaultRecurrence,
      })
    }
  }, [isOpen, editItem, editRule, defaultDate, defaultTime, defaultType, reset])

  const { t } = useTranslation()
  const type = watch('type')
  const hasRecurrence = watch('has_recurrence')
  const tagId = watch('tag_id')
  const dateVal = watch('date')
  const startVal = watch('start_time')
  const endVal = watch('end_time')

  const typeLabels: Record<string, string> = {
    task: t('form.task'),
    event: t('form.event'),
    allday: t('form.allDay'),
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? t('form.editItem') : t('form.newItem')} width="520px">
      <form onSubmit={handleSubmit(onSave)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label>{t('form.type')}</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['task', 'event', 'allday'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setValue('type', v)}
                className="font-display"
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  background: type === v ? 'var(--color-primary)' : 'transparent',
                  color: type === v ? 'var(--bg-base)' : 'var(--color-text)',
                  border: `2px solid ${type === v ? 'var(--color-primary)' : 'var(--color-border-bright)'}`,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {typeLabels[v]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label>{t('form.title')} *</label>
          <input type="text" placeholder={t('form.titlePlaceholder')} autoFocus {...register('title', { required: true })} />
        </div>
        <div>
          <label>{t('form.tag')}</label>
          <TagSelector tags={tags} value={tagId} onChange={(id) => setValue('tag_id', id)} />
        </div>
        {type !== 'allday' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div>
              <label>{t('form.date')}</label>
              <DatePicker value={dateVal} onChange={(v) => setValue('date', v)} />
            </div>
            <div>
              <label>{t('form.startShort')}</label>
              <TimePicker value={startVal} onChange={(v) => setValue('start_time', v)} />
            </div>
            <div>
              <label>{t('form.endShort')}</label>
              <TimePicker value={endVal} onChange={(v) => setValue('end_time', v)} />
            </div>
          </div>
        )}
        {type === 'allday' && (
          <div>
            <label>{t('form.date')}</label>
            <DatePicker value={dateVal} onChange={(v) => setValue('date', v)} />
          </div>
        )}
        {type === 'task' && (
          <div>
            <label>{t('form.priority')}</label>
            <select {...register('priority')}>
              <option value="">{t('form.priorityNone')}</option>
              <option value="low">{t('form.low')}</option>
              <option value="medium">{t('form.medium')}</option>
              <option value="high">{t('form.high')}</option>
            </select>
          </div>
        )}
        <div>
          <label>{t('form.description')}</label>
          <textarea rows={2} placeholder={t('form.descriptionPlaceholder')} {...register('description')} />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" className="cyber-checkbox" {...register('has_recurrence')} />
            <span className="font-mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('form.recurring')}</span>
          </label>
        </div>
        {hasRecurrence && (
          <div style={{ padding: 12, border: '2px solid var(--color-border-bright)', background: 'var(--bg-elevated)' }}>
            <RecurrenceFields register={register} watch={watch} setValue={setValue} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
          {onDelete && <button type="button" className="btn-pink" onClick={onDelete}>{t('common.delete')}</button>}
          <div style={{ flex: 1 }} />
          <button type="button" className="btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" className="btn-neon">{editItem ? t('common.save') : t('form.create')}</button>
        </div>
      </form>
    </Modal>
  )
}
