import { useEffect, useState } from 'react'
import { SLOT_HEIGHT_PX } from '@/lib/dateUtils'

export default function CurrentTimeLine() {
  const [topPx, setTopPx] = useState(0)

  useEffect(() => {
    function update() {
      const now = new Date()
      const mins = now.getHours() * 60 + now.getMinutes()
      setTopPx((mins / 15) * SLOT_HEIGHT_PX)
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: topPx,
        height: 2,
        background: 'var(--color-secondary)',
        boxShadow: '0 0 6px var(--color-secondary)',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: -4,
          top: -4,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'var(--color-secondary)',
          boxShadow: '0 0 8px var(--color-secondary)',
        }}
      />
    </div>
  )
}
