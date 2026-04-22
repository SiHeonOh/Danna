import { useTheme } from '@/context/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isMobile = useIsMobile()

  return (
    <button
      onClick={toggle}
      className="btn-ghost font-mono"
      style={{ padding: isMobile ? '5px 8px' : undefined, fontSize: isMobile ? 16 : undefined, flexShrink: 0 }}
      title="Toggle theme"
    >
      {isMobile ? (theme === 'dark' ? '◑' : '◐') : (theme === 'dark' ? '◑ LIGHT' : '◐ DARK')}
    </button>
  )
}
