import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(HttpBackend)           // loads JSON files from /public/locales
  .use(LanguageDetector)      // detects browser language / localStorage
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ko'],
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      // Persist chosen language in localStorage under key 'grid-lang'
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'grid-lang',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
  })

export default i18n

/** Returns the date-fns locale object matching the current i18n language. */
export async function getDateLocale() {
  if (i18n.language?.startsWith('ko')) {
    const { ko } = await import('date-fns/locale')
    return ko
  }
  const { enUS } = await import('date-fns/locale')
  return enUS
}
