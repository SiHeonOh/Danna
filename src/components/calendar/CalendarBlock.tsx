import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useRef } from 'react'
import { formatDisplayTime, topFromTime, heightFromTimes } from '@/lib/dateUtils'
import { mapsUrl } from '@/lib/maps'
import type { CalendarBlock as CalendarBlockType } from '@/types/app.types'
import BlockResizeHandle from './BlockResizeHandle'
import { useIsMobile } from '@/hooks/useIsMobile'

interface CalendarBlockProps {
  block: CalendarBlockType
  isDragging: boolean
  onDoubleClick: (block: CalendarBlockType) => void
  onCompleteInstance?: (block: CalendarBlockType) => void
}

function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function needsDarkText(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55
}

export default function CalendarBlock({
  block,
  isDragging,
  onDoubleClick,
  onCompleteInstance,
}: CalendarBlockProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: block.key,
    data: { type: 'block', block },
  })
  const isMobile = useIsMobile()
  const lastTapRef = useRef<number>(0)

  function handleDoubleTap(e: React.MouseEvent) {
    e.stopPropagation()
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0
      onDoubleClick(block)
    } else {
      lastTapRef.current = now
    }
  }

  const tagColor = block.tag?.color ?? '#555555'
  const completed = block.is_completed

  const bgColor = completed ? hexWithAlpha(tagColor, 0.15) : hexWithAlpha(tagColor, 0.82)
  const textColor = completed ? tagColor : (needsDarkText(tagColor) ? '#111111' : '#f0f0f0')
  const timeColor = completed ? tagColor : (needsDarkText(tagColor) ? 'rgba(0,0,0,0.55)' : 'rgba(240,240,240,0.65)')

  const top = topFromTime(block.start_time)
  const height = heightFromTimes(block.start_time, block.end_time)

  const style: React.CSSProperties = {
    top,
    height: Math.max(height, 15),
    backgroundColor: bgColor,
    borderLeftColor: tagColor,
    opacity: isDragging ? 0.3 : 1,
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    zIndex: isDragging ? 0 : 1,
    padding: '3px 6px',
  }

  return (
    <div
      ref={setNodeRef}
      {...(isMobile ? {} : listeners)}
      {...attributes}
      className={`calendar-block ${block.item.type === 'task' ? 'calendar-block-task' : 'calendar-block-event'}`}
      style={style}
      onDoubleClick={!isMobile ? (e) => { e.stopPropagation(); onDoubleClick(block) } : undefined}
      onClick={isMobile ? handleDoubleTap : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, height: '100%' }}>
        {/* Mobile-only drag handle — touch-action:none scoped to this strip only */}
        {isMobile && (
          <div
            {...listeners}
            className="calendar-block-handle"
            onClickCapture={(e) => e.stopPropagation()}
          >
            <span style={{
              fontSize: 9,
              lineHeight: 1,
              color: textColor,
              letterSpacing: '-1px',
              pointerEvents: 'none',
            }}>
              ⠿
            </span>
          </div>
        )}
        {block.item.type === 'task' && (
          <input
            type="checkbox"
            className="cyber-checkbox"
            checked={completed}
            onChange={(e) => { e.stopPropagation(); onCompleteInstance?.(block) }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              marginTop: 2,
              flexShrink: 0,
              borderColor: completed ? tagColor : textColor,
            }}
          />
        )}
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Luna', 'Maratype', sans-serif",
              fontSize: 12,
              color: textColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
              textDecoration: completed ? 'line-through' : 'none',
              opacity: completed ? 0.55 : 1,
            }}
          >
            {block.title}
          </div>
          {height >= 30 && (
            <div
              className="font-mono"
              style={{ fontSize: 9, color: timeColor, marginTop: 1, fontWeight: 500 }}
            >
              {formatDisplayTime(block.start_time)}–{formatDisplayTime(block.end_time)}
            </div>
          )}
          {/* Location — tap opens Google Maps (stopPropagation keeps it from
              starting a drag or opening the editor) */}
          {height >= 45 && block.item.location && (
            <a
              href={mapsUrl(block.item.location)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              className="font-mono"
              style={{
                display: 'block',
                fontSize: 9,
                color: timeColor,
                marginTop: 2,
                textDecoration: 'underline dotted',
                textUnderlineOffset: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={`Open in Google Maps: ${block.item.location}`}
            >
              ⌖ {block.item.location}
            </a>
          )}
          {/* Description — only when the block is tall enough (≥ 1h) to hold
              a line beyond title + time; clamps to whatever space remains */}
          {height >= 60 && block.item.description && (
            <div
              style={{
                fontSize: 10,
                color: timeColor,
                marginTop: 3,
                lineHeight: 1.3,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: Math.max(1, Math.floor((height - (block.item.location ? 54 : 40)) / 13)),
                wordBreak: 'break-word',
              }}
            >
              {block.item.description}
            </div>
          )}
        </div>
      </div>
      <BlockResizeHandle blockKey={block.key} />
    </div>
  )
}
