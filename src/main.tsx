import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' // must import before App so translations are ready
import App from './App'

// Service worker auto-update logic:
// 1. When a new SW takes over, reload so the browser runs fresh JS bundles.
// 2. On mobile PWAs, resuming from background doesn't trigger a navigation, so
//    the browser never checks for a new SW on its own — we call registration.update()
//    every time the app comes back to the foreground to force the check.
if ('serviceWorker' in navigator) {
  let refreshing = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })

  navigator.serviceWorker.ready.then((registration) => {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update().catch(() => {})
      }
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
