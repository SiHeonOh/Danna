import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { enUS, ko } from 'date-fns/locale'
import type { Locale } from 'date-fns'

/**
 * Returns the date-fns Locale object matching the active i18n language.
 * Used to localise day names, month names, etc. in format() calls.
 */
export function useDateLocale(): Locale {
  const { i18n } = useTranslation()
  const [locale, setLocale] = useState<Locale>(
    i18n.language?.startsWith('ko') ? ko : enUS,
  )

  useEffect(() => {
    setLocale(i18n.language?.startsWith('ko') ? ko : enUS)
  }, [i18n.language])

  return locale
}
