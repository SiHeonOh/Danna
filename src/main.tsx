import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' // must import before App so translations are ready
import App from './App'

// Service worker auto-update logic:
// - controllerchange fires when a new SW takes over → reload to run fresh bundles.
// - registration.update() on startup covers cold-open (force-close → reopen) where
//   the browser may not run its own update check before serving cached content.
// - visibilitychange covers resume-from-background without a full cold start.
if ('serviceWorker' in navigator) {
  let refreshing = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })

  navigator.serviceWorker.ready.then((registration) => {
    // Immediate check on every cold start
    registration.update().catch(() => {})

    // Check again whenever the app comes back to foreground
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
