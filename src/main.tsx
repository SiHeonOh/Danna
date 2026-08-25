import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' // must import before App so translations are ready
import App from './App'
import { initUiScale } from './lib/uiScale'

// Set --ui-scale before first render so there's no visible size jump
initUiScale()

// Service worker auto-update logic:
//
// iOS PWA quirk: swiping the app away often *freezes* the process rather than
// killing it. On reopen, iOS thaws the frozen snapshot — no JS runs, so a
// startup registration.update() call is never reached.
//
// Fix layers (each covers a different iOS/Android scenario):
//  1. controllerchange  — fires when new SW takes over → reload immediately
//  2. updatefound + statechange === 'activated' — direct SW lifecycle listener,
//     more reliable than controllerchange on some iOS builds
//  3. registration.update() on startup — covers normal cold starts
//  4. visibilitychange — covers background→foreground without full cold start
//  5. pageshow (persisted=true) — covers iOS thaw-from-frozen-snapshot

if ('serviceWorker' in navigator) {
  let refreshing = false

  function doReload() {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  }

  // Layer 1: new SW took control
  navigator.serviceWorker.addEventListener('controllerchange', doReload)

  function attachUpdateListener(registration: ServiceWorkerRegistration) {
    registration.addEventListener('updatefound', () => {
      const newSW = registration.installing
      if (!newSW) return
      // Layer 2: watch the installing SW reach activated state
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'activated') doReload()
      })
    })
  }

  function triggerCheck() {
    navigator.serviceWorker.ready.then((registration) => {
      attachUpdateListener(registration)
      registration.update().catch(() => {})
    })
  }

  // Layer 3: immediate check on every normal cold start
  triggerCheck()

  // Layer 4: check when app returns to foreground
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') triggerCheck()
  })

  // Layer 5: iOS thaw — pageshow with persisted:true means the page was
  // restored from a frozen snapshot, not a fresh load
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) triggerCheck()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
