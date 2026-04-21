import { useEffect, useRef } from 'react'

interface GlitchTextProps {
  text: string
  className?: string
  style?: React.CSSProperties
}

export default function GlitchText({ text, className = '', style }: GlitchTextProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.classList.add('glitch-active')
    const timeout = setTimeout(() => el.classList.remove('glitch-active'), 500)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <span ref={ref} className={`glitch-text ${className}`} data-text={text} style={style}>
      {text}
    </span>
  )
}
