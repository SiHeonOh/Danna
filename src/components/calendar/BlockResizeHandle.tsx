import { useDraggable } from '@dnd-kit/core'

interface BlockResizeHandleProps {
  blockKey: string
}

export default function BlockResizeHandle({ blockKey }: BlockResizeHandleProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `resize::${blockKey}`,
    data: { type: 'resize', blockKey },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 6,
        cursor: 'ns-resize',
        background: 'rgba(255,255,255,0.1)',
        zIndex: 2,
      }}
    />
  )
}
