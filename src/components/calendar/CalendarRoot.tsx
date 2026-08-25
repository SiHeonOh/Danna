import { useState, useCallback, useMemo } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent, type DragMoveEvent,
} from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { startOfWeek, endOfWeek, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, parseISO, format } from 'date-fns'
import { usePlanner } from '@/context/PlannerContext'
import { useCalendarView, useAllDayItems } from '@/hooks/useCalendarView'
import { useDragState } from '@/hooks/useDragState'
import { useIsMobile } from '@/hooks/useIsMobile'
import { splitAtDate } from '@/lib/recurrence'
import { getUiScale } from '@/lib/uiScale'
import {
  snapMinutesTo15, timeStringToMinutes, minutesToTimeString,
  addMinutesToTime, durationMinutes, SLOT_HEIGHT_PX,
} from '@/lib/dateUtils'
import DayView from './DayView'
import WeekView from './WeekView'
import PlanView from './PlanView'
import MonthView from './MonthView'
import type { CalendarBlock, ItemFormValues, EditScope } from '@/types/app.types'
import ItemFormModal from '@/components/forms/ItemFormModal'
import EditScopeDialog from '@/components/forms/EditScopeDialog'

type ViewMode = 'day' | 'week' | 'plan' | 'month'

interface CalendarRootProps {
  viewMode: ViewMode
  currentDate: Date
  onNavigate?: (date: Date, viewMode: ViewMode) => void
  mobilePlanOpen?: boolean
}

export default function CalendarRoot({ viewMode, currentDate, onNavigate, mobilePlanOpen }: CalendarRootProps) {
  const {
    items, tags, rules, overrides,
    createItem, updateItem, deleteItem,
    upsertRule, deleteRule, ruleForItem,
    upsertOverride, overridesForItem,
    toggleComplete,
  } = usePlanner()

  const { dragState, setDragging, clearDragging } = useDragState()
  const isMobile = useIsMobile()
  const [resizingBlock, setResizingBlock] = useState<{ key: string; startEndTime: string } | null>(null)

  // Modal state
  const [formOpen, setFormOpen] = useState(false)
  const [formDefaults, setFormDefaults] = useState<{ date?: string; time?: string; type?: 'task' | 'event' | 'allday' }>({})
  const [editingBlock, setEditingBlock] = useState<CalendarBlock | null>(null)
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false)
  const [pendingFormValues, setPendingFormValues] = useState<ItemFormValues | null>(null)
  const [scopeMode, setScopeMode] = useState<'edit' | 'delete'>('edit')

  // Date range for the view
  const { from, to } = useMemo(() => {
    if (viewMode === 'day' || viewMode === 'plan') {
      return { from: startOfDay(currentDate), to: endOfDay(currentDate) }
    }
    if (viewMode === 'month') {
      return {
        from: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
        to: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }),
      }
    }
    return {
      from: startOfWeek(currentDate, { weekStartsOn: 1 }),
      to: endOfWeek(currentDate, { weekStartsOn: 1 }),
    }
  }, [viewMode, currentDate])

  const blocks = useCalendarView({ items, rules, overrides, tags, from, to })
  const allDayBlocks = useAllDayItems(items, rules, overrides, tags, from, to)

  // dnd-kit sensors — long press (200ms) activates on touch for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 10 } }),
  )

  function onDragStart(event: DragStartEvent) {
    const { id } = event.active
    const idStr = String(id)
    if (idStr.startsWith('resize::')) {
      const blockKey = idStr.replace('resize::', '')
      const block = blocks.find((b) => b.key === blockKey)
      if (block) {
        setResizingBlock({ key: blockKey, startEndTime: block.end_time })
        setDragging(idStr, 'resize')
      }
    } else if (idStr.startsWith('unscheduled::')) {
      setDragging(idStr, 'unscheduled')
    } else {
      setDragging(idStr, 'block')
    }
  }

  function onDragMove(_event: DragMoveEvent) {
    // Preview-only resize feedback — actual save happens in onDragEnd
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over, delta } = event
    const activeId = String(active.id)
    clearDragging()

    if (activeId.startsWith('resize::') && resizingBlock) {
      const blockKey = resizingBlock.key
      const block = blocks.find((b) => b.key === blockKey)
      if (block) {
        // delta.y is in client px; the grid is zoomed by --ui-scale, so a
        // slot renders as SLOT_HEIGHT_PX * scale client px
        const deltaMinutes = Math.round(delta.y / (SLOT_HEIGHT_PX * getUiScale())) * 15
        const endMins = timeStringToMinutes(resizingBlock.startEndTime)
        const startMins = timeStringToMinutes(block.start_time)
        const newEndMins = snapMinutesTo15(Math.max(endMins + deltaMinutes, startMins + 15))
        const newEndTime = minutesToTimeString(newEndMins)
        if (block.is_recurring) {
          await upsertOverride(block.item.id, block.original_date, { override_end_time: newEndTime })
        } else {
          await updateItem(block.item.id, { end_time: newEndTime })
        }
      }
      setResizingBlock(null)
      return
    }

    if (!over) return
    const overData = over.data.current as { type: string; date: string; time?: string } | undefined
    if (!overData) return

    // Drop onto TO DO zone — clear times, keep date
    if (overData.type === 'todo') {
      const block = blocks.find((b) => b.key === activeId)
      if (!block || block.is_recurring) return
      await updateItem(block.item.id, { start_time: null, end_time: null })
      return
    }

    // Drop onto INBOX zone — clear date and times entirely
    if (overData.type === 'inbox') {
      const block = blocks.find((b) => b.key === activeId)
      if (!block || block.is_recurring) return
      await updateItem(block.item.id, { date: null, start_time: null, end_time: null })
      return
    }

    if (overData.type !== 'slot') return
    const { date: newDate, time: newTime } = overData as { type: string; date: string; time: string }

    if (activeId.startsWith('unscheduled::')) {
      const itemId = activeId.replace('unscheduled::', '')
      const item = items.find((i) => i.id === itemId)
      if (!item) return
      const endTime = addMinutesToTime(newTime, 60)
      await updateItem(itemId, { date: newDate, start_time: newTime, end_time: endTime })
      return
    }

    // Moving an existing block
    const block = blocks.find((b) => b.key === activeId)
    if (!block) return
    const dur = durationMinutes(block.start_time, block.end_time)
    const newEndTime = addMinutesToTime(newTime, dur)

    if (block.is_recurring) {
      await upsertOverride(block.item.id, block.original_date, {
        override_date: newDate,
        override_start_time: newTime,
        override_end_time: newEndTime,
      })
    } else {
      await updateItem(block.item.id, { date: newDate, start_time: newTime, end_time: newEndTime })
    }
  }

  const handleSlotClick = useCallback((date: string, time: string) => {
    setEditingBlock(null)
    setFormDefaults({ date, time, type: 'task' })
    setFormOpen(true)
  }, [])

  const handleBlockDoubleClick = useCallback((block: CalendarBlock) => {
    setEditingBlock(block)
    setFormOpen(true)
  }, [])

  const handleAllDayAdd = useCallback((date: string) => {
    setEditingBlock(null)
    setFormDefaults({ date, type: 'allday' })
    setFormOpen(true)
  }, [])

  const handleCompleteInstance = useCallback(async (block: CalendarBlock) => {
    if (block.is_recurring) {
      await upsertOverride(block.item.id, block.original_date, {
        is_completed: !block.is_completed,
      })
    } else {
      await toggleComplete(block.item.id, block.is_completed)
    }
  }, [upsertOverride, toggleComplete])

  async function handleFormSave(values: ItemFormValues) {
    if (editingBlock?.is_recurring) {
      setScopeMode('edit')
      setPendingFormValues(values)
      setFormOpen(false)
      setScopeDialogOpen(true)
      return
    }
    await doSave(values, 'all')
    setFormOpen(false)
  }

  async function handleScopeConfirm(scope: EditScope) {
    setScopeDialogOpen(false)
    if (scopeMode === 'delete') {
      await doDelete(scope)
    } else {
      if (!pendingFormValues) return
      await doSave(pendingFormValues, scope)
      setPendingFormValues(null)
    }
  }

  async function doDelete(scope: EditScope) {
    if (!editingBlock) return
    const existingRule = ruleForItem(editingBlock.item.id)
    if (scope === 'this') {
      // Skip just this occurrence
      await upsertOverride(editingBlock.item.id, editingBlock.original_date, { is_skipped: true })
    } else if (scope === 'future' && existingRule) {
      // End the series the day before this occurrence
      const prevDay = format(subDays(parseISO(editingBlock.original_date), 1), 'yyyy-MM-dd')
      await upsertRule(editingBlock.item.id, { ...existingRule, end_date: prevDay })
    } else {
      // Delete the whole series
      await deleteItem(editingBlock.item.id)
    }
    setEditingBlock(null)
  }

  async function doSave(values: ItemFormValues, scope: EditScope) {
    const itemData = {
      type: values.type,
      title: values.title,
      description: values.description || null,
      tag_id: values.tag_id || null,
      date: values.date || null,
      start_time: values.start_time || null,
      end_time: values.end_time || null,
      is_completed: values.is_completed,
      priority: (values.priority as 'low' | 'medium' | 'high') || null,
      goal_period: null as null,
    }

    const ruleData = values.has_recurrence
      ? {
          frequency: values.recurrence.frequency,
          interval: values.recurrence.interval,
          days_of_week: values.recurrence.days_of_week.length ? values.recurrence.days_of_week : null,
          day_of_month: typeof values.recurrence.day_of_month === 'number' ? values.recurrence.day_of_month : null,
          month_of_year: typeof values.recurrence.month_of_year === 'number' ? values.recurrence.month_of_year : null,
          ordinal: values.recurrence.ordinal || null,
          end_date: values.recurrence.end_date || null,
        }
      : null

    if (!editingBlock) {
      // Create new
      const { data: newItem } = await createItem(itemData)
      if (newItem && ruleData) {
        await upsertRule(newItem.id, ruleData)
      }
      return
    }

    const existingRule = ruleForItem(editingBlock.item.id)

    if (scope === 'this' && editingBlock.is_recurring) {
      await upsertOverride(editingBlock.item.id, editingBlock.original_date, {
        override_title: values.title,
        override_date: values.date || undefined,
        override_start_time: values.start_time || undefined,
        override_end_time: values.end_time || undefined,
      })
    } else if (scope === 'future' && editingBlock.is_recurring && existingRule) {
      const allOverrides = overridesForItem(editingBlock.item.id)
      await splitAtDate(editingBlock.item, existingRule, editingBlock.original_date, itemData, ruleData ?? {}, allOverrides)
    } else {
      // scope === 'all' or non-recurring
      await updateItem(editingBlock.item.id, itemData)
      if (ruleData) {
        await upsertRule(editingBlock.item.id, ruleData)
      } else if (existingRule) {
        await deleteRule(editingBlock.item.id)
      }
    }
    setEditingBlock(null)
  }

  async function handleFormDelete() {
    if (!editingBlock) return
    if (editingBlock.is_recurring) {
      setScopeMode('delete')
      setPendingFormValues(null)
      setFormOpen(false)
      setScopeDialogOpen(true)
      return
    }
    await deleteItem(editingBlock.item.id)
    setFormOpen(false)
    setEditingBlock(null)
  }

  const editingItem = editingBlock ? editingBlock.item : null
  const editingRule = editingItem ? ruleForItem(editingItem.id) : null

  return (
    <>
      <DndContext
        sensors={sensors}
        modifiers={[restrictToWindowEdges]}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      >
        {/* Build plan panel once — passed inline to DayView/WeekView so it replaces the time grid exactly */}
        {(() => {
          const planContent = (isMobile && mobilePlanOpen) ? (
            <PlanView
              date={currentDate}
              activeDragId={dragState.activeId}
              onSlotClick={handleSlotClick}
              onBlockDoubleClick={handleBlockDoubleClick}
              onCompleteInstance={handleCompleteInstance}
              onAllDayClick={handleBlockDoubleClick}
              onAllDayAdd={handleAllDayAdd}
              onNewTask={() => { setFormDefaults({ date: undefined, type: 'task' }); setFormOpen(true) }}
              onEditItem={(id) => {
                const item = items.find(i => i.id === id)
                if (!item) return
                setEditingBlock({
                  key: item.id, item, date: item.date ?? '', start_time: item.start_time ?? '',
                  end_time: item.end_time ?? '', title: item.title, is_completed: item.is_completed,
                  is_recurring: false, original_date: item.date ?? '', override_id: null,
                  tag: item.tag_id ? (tags.find(t => t.id === item.tag_id) ?? null) : null,
                })
                setFormOpen(true)
              }}
            />
          ) : null

          return (
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
              {viewMode === 'plan' ? (
                <PlanView
                  date={currentDate}
                  activeDragId={dragState.activeId}
                  onSlotClick={handleSlotClick}
                  onBlockDoubleClick={handleBlockDoubleClick}
                  onCompleteInstance={handleCompleteInstance}
                  onAllDayClick={handleBlockDoubleClick}
                  onAllDayAdd={handleAllDayAdd}
                  onNewTask={() => { setFormDefaults({ date: undefined, type: 'task' }); setFormOpen(true) }}
                  onEditItem={(id) => {
                    const item = items.find(i => i.id === id)
                    if (!item) return
                    setEditingBlock({
                      key: item.id, item, date: item.date ?? '', start_time: item.start_time ?? '',
                      end_time: item.end_time ?? '', title: item.title, is_completed: item.is_completed,
                      is_recurring: false, original_date: item.date ?? '', override_id: null,
                      tag: item.tag_id ? (tags.find(t => t.id === item.tag_id) ?? null) : null,
                    })
                    setFormOpen(true)
                  }}
                />
              ) : viewMode === 'day' ? (
                <DayView
                  date={currentDate}
                  blocks={blocks}
                  allDayBlocks={allDayBlocks}
                  activeDragId={dragState.activeId}
                  onSlotClick={handleSlotClick}
                  onBlockDoubleClick={handleBlockDoubleClick}
                  onCompleteInstance={handleCompleteInstance}
                  onAllDayClick={handleBlockDoubleClick}
                  onAllDayAdd={handleAllDayAdd}
                  planContent={planContent}
                />
              ) : viewMode === 'month' ? (
                <MonthView
                  date={currentDate}
                  onDayClick={(d) => onNavigate?.(d, isMobile ? 'day' : 'plan')}
                  onBlockDoubleClick={handleBlockDoubleClick}
                />
              ) : (
                <WeekView
                  date={currentDate}
                  blocks={blocks}
                  allDayBlocks={allDayBlocks}
                  activeDragId={dragState.activeId}
                  onSlotClick={handleSlotClick}
                  onBlockDoubleClick={handleBlockDoubleClick}
                  onCompleteInstance={handleCompleteInstance}
                  onAllDayClick={handleBlockDoubleClick}
                  onAllDayAdd={handleAllDayAdd}
                  planContent={planContent}
                />
              )}
            </div>
          )
        })()}

        {/* dnd-kit positions the overlay wrapper in client px; counter-zoom it
            to effective zoom 1 so it tracks the cursor 1:1 under --ui-scale,
            then re-zoom the chip itself so it matches the surrounding UI */}
        <DragOverlay modifiers={[restrictToWindowEdges]} style={{ zoom: 'var(--ui-scale-inv, 1)' }}>
          {dragState.activeId && !dragState.activeId.startsWith('resize::') && (
            <div style={{
              zoom: 'var(--ui-scale, 1)',
              padding: '4px 8px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--color-primary)',
              boxShadow: 'var(--shadow-hard)',
              fontSize: 11,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--color-primary)',
              pointerEvents: 'none',
            }}>
              {dragState.activeId.startsWith('unscheduled::')
                ? items.find((i) => `unscheduled::${i.id}` === dragState.activeId)?.title ?? 'Moving...'
                : blocks.find((b) => b.key === dragState.activeId)?.title ?? 'Moving...'
              }
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <ItemFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingBlock(null) }}
        onSave={handleFormSave}
        onDelete={editingBlock ? handleFormDelete : undefined}
        tags={tags}
        defaultDate={formDefaults.date}
        defaultTime={formDefaults.time}
        defaultType={formDefaults.type}
        editItem={editingItem}
        editRule={editingRule}
      />

      <EditScopeDialog
        isOpen={scopeDialogOpen}
        onClose={() => { setScopeDialogOpen(false); setPendingFormValues(null) }}
        onConfirm={handleScopeConfirm}
        mode={scopeMode}
      />
    </>
  )
}
