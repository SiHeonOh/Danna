import { useDroppable } from '@dnd-kit/core'
import { minutesToTimeString, slotIndexToMinutes } from '@/lib/dateUtils'

interface TimeSlotProps {
  date: string
  slotIndex: number
  onClick: (date: string, time: string) => void
}

export default function TimeSlot({ date, slotIndex, onClick }: TimeSlotProps) {
  const time = minutesToTimeString(slotIndexToMinutes(slotIndex))
  const id = `slot::${date}::${time}`

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'slot', date, time },
  })

  return (
    <div
      ref={setNodeRef}
      className="time-slot"
      style={{
        top: slotIndex * 15,
        backgroundColor: isOver
          ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
          : undefined,
      }}
      onClick={() => onClick(date, time)}
    />
  )
}
