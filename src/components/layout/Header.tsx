import { useState } from 'react'
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import GlitchText from '@/components/ui/GlitchText'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useDateLocale } from '@/hooks/useDateLocale'

type ViewMode = 'day' | 'week' | 'plan' | 'month'

interface HeaderProps {
  viewMode: ViewMode
  currentDate: Date
  onViewModeChange: (mode: ViewMode) => void
  onDateChange: (date: Date) => void
  onNewEvent: () => void
  onTagManager: () => void
}

export default function Header({
  viewMode, currentDate, onViewModeChange, onDateChange, onNewEvent, onTagManager,
}: HeaderProps) {
  const { signOut } = useAuth()
  const isMobile = useIsMobile()
  const { t, i18n } = useTranslation()
  const dateLocale = useDateLocale()
  const { theme, toggle: toggleTheme } = useTheme()
  // Mobile: TAGS / language / theme / exit live behind a ⋮ menu — the full
  // button row is ~450px wide and overflows a 375px phone header
  const [menuOpen, setMenuOpen] = useState(false)

  function goBack() {
    if (viewMode === 'week') onDateChange(subWeeks(currentDate, 1))
    else if (viewMode === 'month') onDateChange(subMonths(currentDate, 1))
    else onDateChange(subDays(currentDate, 1))
  }
  function goForward() {
    if (viewMode === 'week') onDateChange(addWeeks(currentDate, 1))
    else if (viewMode === 'month') onDateChange(addMonths(currentDate, 1))
    else onDateChange(addDays(currentDate, 1))
  }
  function goToday() { onDateChange(new Date()) }

  function toggleLanguage() {
    const next = i18n.language?.startsWith('ko') ? 'en' : 'ko'
    i18n.changeLanguage(next)
    // Drive Korean font overrides via data attribute on <html>
    document.documentElement.dataset.lang = next
  }

  // Set data-lang on mount to match persisted language
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.lang = i18n.language?.startsWith('ko') ? 'ko' : 'en'
  }

  const dateLabel = viewMode === 'week'
    ? `${format(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 1), 'MMM d', { locale: dateLocale })} — ${format(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 7), 'MMM d, yyyy', { locale: dateLocale })}`.toUpperCase()
    : viewMode === 'month'
      ? format(currentDate, 'MMMM yyyy', { locale: dateLocale }).toUpperCase()
      : isMobile
        ? format(currentDate, 'MMM d', { locale: dateLocale }).toUpperCase()
        : format(currentDate, 'MMM d, yyyy', { locale: dateLocale }).toUpperCase()

  const isKorean = i18n.language?.startsWith('ko')

  return (
    <div
      style={{
        height: isMobile ? 44 : 52,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 6 : 10,
        padding: isMobile ? '0 8px 0 0' : '0 16px 0 0',
        borderBottom: '2px solid var(--color-border)',
        background: 'var(--bg-surface)',
        position: 'relative',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        width: 4,
        alignSelf: 'stretch',
        background: 'var(--color-primary)',
        flexShrink: 0,
        marginRight: isMobile ? 4 : 8,
      }} />

      {/* Logo */}
      <h1 className="font-display" style={{
        fontSize: isMobile ? 22 : 30,
        margin: 0,
        lineHeight: 1,
        color: 'var(--color-primary)',
        textShadow: 'var(--glow-primary)',
        letterSpacing: '0.16em',
        flexShrink: 0,
        marginRight: isMobile ? 8 : 14,
      }}>
        <GlitchText text="DANNA" />
      </h1>

      {/* Separator — desktop only */}
      {!isMobile && (
        <div style={{ width: 2, height: 28, background: 'var(--color-border-bright)', flexShrink: 0, marginLeft: 4 }} />
      )}

      {/* Nav controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <button
          className="btn-ghost"
          style={{ padding: '5px 10px', fontSize: 18, lineHeight: 1, letterSpacing: 0 }}
          onClick={goBack}
        >‹</button>
        {!isMobile && (
          <button
            className="btn-ghost"
            style={{ padding: '5px 12px', fontSize: 12, marginLeft: -2 }}
            onClick={goToday}
          >{t('nav.today')}</button>
        )}
        <button
          className="btn-ghost"
          style={{ padding: '5px 10px', fontSize: 18, lineHeight: 1, letterSpacing: 0, marginLeft: -2 }}
          onClick={goForward}
        >›</button>
      </div>

      {/* Date label */}
      {isMobile ? (
        <button
          className="font-mono"
          onClick={goToday}
          style={{
            fontSize: 11, fontWeight: 700,
            color: 'var(--color-primary)',
            flexShrink: 0, letterSpacing: '0.04em',
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >{dateLabel}</button>
      ) : (
        <span className="font-mono" style={{
          fontSize: 12, fontWeight: 700,
          color: 'var(--color-primary)',
          flexShrink: 0, letterSpacing: '0.04em', marginLeft: 4,
        }}>{dateLabel}</span>
      )}

      <div style={{ flex: 1 }} />

      {/* View toggle — desktop only */}
      {!isMobile && (
        <div style={{ display: 'flex' }}>
          {([
            { id: 'plan',  key: 'nav.plan'  },
            { id: 'day',   key: 'nav.day'   },
            { id: 'week',  key: 'nav.week'  },
            { id: 'month', key: 'nav.month' },
          ] as const).map(({ id, key }, idx) => {
            const active = viewMode === id
            return (
              <button
                key={id}
                className="font-display btn-view-tab"
                onClick={() => onViewModeChange(id)}
                style={{
                  padding: '5px 12px', fontSize: 13,
                  background: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--color-text)',
                  border: `2px solid ${active ? 'var(--color-primary)' : 'var(--color-border-bright)'}`,
                  boxShadow: active
                    ? '2px 2px 0 color-mix(in srgb, var(--color-primary) 45%, #000000)'
                    : '2px 2px 0 var(--color-border-bright)',
                  marginLeft: idx > 0 ? -2 : 0,
                  cursor: 'pointer', letterSpacing: '0.1em',
                  position: 'relative', zIndex: active ? 1 : 0, lineHeight: 1.4,
                }}
              >{t(key)}</button>
            )
          })}
        </div>
      )}

      <button
        className="btn-neon"
        style={{ padding: isMobile ? '5px 10px' : '5px 14px', fontSize: 13, flexShrink: 0 }}
        onClick={onNewEvent}
      >
        {isMobile ? t('nav.addEventShort') : t('nav.addEvent')}
      </button>

      {isMobile ? (
        <>
          {/* ⋮ overflow menu — TAGS / language / theme / exit */}
          <button
            className="btn-ghost"
            style={{ padding: '5px 9px', fontSize: 14, fontWeight: 700, flexShrink: 0, lineHeight: 1.2 }}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            ⋮
          </button>
          {menuOpen && (
            <>
              {/* click-away backdrop */}
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 150 }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 4,
                  zIndex: 151,
                  background: 'var(--bg-elevated)',
                  border: '2px solid var(--color-border-bright)',
                  boxShadow: 'var(--shadow-hard-dark)',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 140,
                }}
              >
                {[
                  { label: t('nav.tags'), action: onTagManager },
                  { label: isKorean ? 'ENGLISH' : '한국어', action: toggleLanguage },
                  { label: theme === 'dark' ? '◑ LIGHT' : '◐ DARK', action: toggleTheme },
                  { label: t('nav.exit'), action: () => signOut() },
                ].map(({ label, action }, i) => (
                  <button
                    key={i}
                    className="font-display"
                    onClick={() => { setMenuOpen(false); action() }}
                    style={{
                      padding: '10px 14px',
                      fontSize: 12,
                      textAlign: 'left',
                      background: 'transparent',
                      color: 'var(--color-text)',
                      border: 'none',
                      borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none',
                      cursor: 'pointer',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <button
            className="btn-ghost"
            style={{ padding: '5px 12px', fontSize: 13, flexShrink: 0 }}
            onClick={onTagManager}
          >
            {t('nav.tags')}
          </button>

          {/* EN / KR language toggle */}
          <button
            className="btn-ghost font-mono"
            style={{ padding: '5px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}
            onClick={toggleLanguage}
          >
            {isKorean ? 'EN' : 'KR'}
          </button>

          <ThemeToggle />

          <button
            className="btn-ghost"
            style={{ padding: '5px 12px', fontSize: 13, flexShrink: 0 }}
            onClick={() => signOut()}
          >
            {t('nav.exit')}
          </button>
        </>
      )}
    </div>
  )
}
