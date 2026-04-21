import { useTheme } from '@/context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      className="btn-ghost font-mono text-xs"
      title="Toggle theme"
    >
      {theme === 'dark' ? '◑ LIGHT' : '◐ DARK'}
    </button>
  )
}
