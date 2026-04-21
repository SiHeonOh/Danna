import { useState, useCallback } from 'react'
import { usePlanner } from '@/context/PlannerContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import Header from '@/components/layout/Header'
import TaskSidebar from '@/components/sidebar/TaskSidebar'
import CalendarRoot from '@/components/calendar/CalendarRoot'
import ItemFormModal from '@/components/forms/ItemFormModal'
import TagManagerModal from '@/components/forms/TagManagerModal'
import BottomSheet from '@/components/layout/BottomSheet'
import ViewFAB from '@/components/layout/ViewFAB'
import { useIsOnline } from '@/hooks/useIsOnline'
import type { ItemFormValues } from '@/types/app.types'

type ViewMode = 'day' | 'week' | 'plan' | 'month'

export default function PlannerPage() {
  const {
    tags, items,
    createTag, updateTag, deleteTag,
    createItem, updateItem, deleteItem,
    upsertRule, deleteRule, ruleForItem,
  } = usePlanner()

  const [viewMode, setViewMode] = useState<ViewMode>(() => window.innerWidth < 768 ? 'day' : 'week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [newEventOpen, setNewEventOpen] = useState(false)
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [tagManagerOpen, setTagManagerOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [mobilePlanOpen, setMobilePlanOpen] = useState(false)

  const isMobile = useIsMobile()
  const isOnline = useIsOnline()

  const editItem = editItemId ? (items.find(i => i.id === editItemId) ?? null) : null
  const editRule = editItem ? ruleForItem(editItem.id) : null

  const handleNewEvent = useCallback(() => {
    setNewEventOpen(true)
  }, [])

  const handleCreateEvent = useCallback(async (values: ItemFormValues) => {
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
    const { data: newItem } = await createItem(itemData)
    if (newItem && values.has_recurrence) {
      await upsertRule(newItem.id, {
        frequency: values.recurrence.frequency,
        interval: values.recurrence.interval,
        days_of_week: values.recurrence.days_of_week.length ? values.recurrence.days_of_week : null,
        day_of_month: typeof values.recurrence.day_of_month === 'number' ? values.recurrence.day_of_month : null,
        month_of_year: typeof values.recurrence.month_of_year === 'number' ? values.recurrence.month_of_year : null,
        ordinal: values.recurrence.ordinal || null,
        end_date: values.recurrence.end_date || null,
      })
    }
    setNewEventOpen(false)
  }, [createItem, upsertRule])

  // Save handler for sidebar item edits (inbox tasks, goals)
  const handleEditSave = useCallback(async (values: ItemFormValues) => {
    if (!editItem) return
    await updateItem(editItem.id, {
      type: values.type,
      title: values.title,
      description: values.description || null,
      tag_id: values.tag_id || null,
      date: values.date || null,
      start_time: values.start_time || null,
      end_time: values.end_time || null,
      is_completed: values.is_completed,
      priority: (values.priority as 'low' | 'medium' | 'high') || null,
      goal_period: editItem.goal_period, // preserve goal assignment
    })
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
    if (ruleData) {
      await upsertRule(editItem.id, ruleData)
    } else if (editRule) {
      await deleteRule(editItem.id)
    }
    setEditItemId(null)
  }, [editItem, editRule, updateItem, upsertRule, deleteRule])

  // Delete handler for sidebar item edits
  const handleEditDelete = useCallback(async () => {
    if (!editItem) return
    await deleteItem(editItem.id)
    setEditItemId(null)
  }, [editItem, deleteItem])

  const openEdit = useCallback((id: string) => {
    setEditItemId(id)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Header
        viewMode={viewMode}
        currentDate={currentDate}
        onViewModeChange={setViewMode}
        onDateChange={setCurrentDate}
        onNewEvent={handleNewEvent}
        onTagManager={() => setTagManagerOpen(true)}
      />

      {/* Offline banner */}
      {!isOnline && (
        <div
          className="font-mono"
          style={{
            background: '#FF4500',
            color: '#ffffff',
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            padding: '5px 0',
            flexShrink: 0,
          }}
        >
          ⚠ OFFLINE — SHOWING LAST SAVED DATA
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Desktop sidebar */}
        {!isMobile && (
          <TaskSidebar
            onNewTask={() => setNewTaskOpen(true)}
            onEditItem={openEdit}
          />
        )}

        {/* Calendar */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CalendarRoot
            viewMode={viewMode}
            currentDate={currentDate}
            onNavigate={(date, mode) => { setCurrentDate(date); setViewMode(mode) }}
            mobilePlanOpen={mobilePlanOpen}
          />
        </div>
      </div>

      {/* Mobile sidebar as bottom sheet */}
      {isMobile && (
        <>
          <button
            className="font-mono"
            onClick={() => setSidebarOpen(true)}
            style={{
              position: 'fixed', bottom: 16, left: 16, zIndex: 100,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              minWidth: 80,
              textAlign: 'center',
              background: 'var(--color-primary)',
              color: '#ffffff',
              border: '2px solid var(--color-primary)',
              boxShadow: '3px 3px 0 color-mix(in srgb, var(--color-primary) 40%, black)',
              cursor: 'pointer',
            }}
          >
            INBOX
          </button>
          <button
            className="font-mono"
            onClick={() => setMobilePlanOpen(v => !v)}
            style={{
              position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              minWidth: 80,
              textAlign: 'center',
              background: mobilePlanOpen ? 'var(--color-primary)' : 'var(--bg-elevated)',
              color: mobilePlanOpen ? '#ffffff' : 'var(--color-text-muted)',
              border: `2px solid ${mobilePlanOpen ? 'var(--color-primary)' : 'var(--color-border-bright)'}`,
              boxShadow: '3px 3px 0 color-mix(in srgb, var(--color-primary) 40%, black)',
              cursor: 'pointer',
            }}
          >
            PLAN
          </button>
          <ViewFAB viewMode={viewMode === 'plan' ? 'day' : viewMode} onViewModeChange={setViewMode} />
          <BottomSheet
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            title="INBOX"
          >
            <TaskSidebar
              onNewTask={() => { setSidebarOpen(false); setNewTaskOpen(true) }}
              onEditItem={(id) => { setSidebarOpen(false); openEdit(id) }}
            />
          </BottomSheet>
        </>
      )}

      {/* New event modal (from header button) */}
      <ItemFormModal
        isOpen={newEventOpen}
        onClose={() => setNewEventOpen(false)}
        onSave={handleCreateEvent}
        tags={tags}
        defaultType="event"
      />

      {/* New task modal (from sidebar inbox + task button) */}
      <ItemFormModal
        isOpen={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        onSave={async (values) => { await handleCreateEvent(values); setNewTaskOpen(false) }}
        tags={tags}
        defaultType="task"
      />

      {/* Edit modal for sidebar items (inbox tasks + goals) */}
      <ItemFormModal
        isOpen={editItemId !== null}
        onClose={() => setEditItemId(null)}
        onSave={handleEditSave}
        onDelete={handleEditDelete}
        tags={tags}
        editItem={editItem}
        editRule={editRule}
      />

      {/* Tag manager */}
      <TagManagerModal
        isOpen={tagManagerOpen}
        onClose={() => setTagManagerOpen(false)}
        tags={tags}
        onCreateTag={async (name, color) => { await createTag({ name, color, sort_order: tags.length }) }}
        onUpdateTag={async (id, name, color) => { await updateTag(id, { name, color }) }}
        onDeleteTag={async (id) => { await deleteTag(id) }}
      />
    </div>
  )
}
