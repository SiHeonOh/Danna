import { useState, useCallback } from 'react'

interface DragState {
  activeId: string | null
  activeType: 'block' | 'resize' | 'unscheduled' | null
}

export function useDragState() {
  const [dragState, setDragState] = useState<DragState>({ activeId: null, activeType: null })

  const setDragging = useCallback((id: string, type: DragState['activeType']) => {
    setDragState({ activeId: id, activeType: type })
  }, [])

  const clearDragging = useCallback(() => {
    setDragState({ activeId: null, activeType: null })
  }, [])

  return { dragState, setDragging, clearDragging }
}
