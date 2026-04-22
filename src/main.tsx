import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' // must import before App so translations are ready
import App from './App'

// When a new service worker takes over (skipWaiting + clientsClaim in vite.config),
// reload the page so the browser loads the fresh JS bundles instead of cached ones.
// Without this, the new SW activates but the old code stays in memory until manual refresh.
// The `refreshing` flag prevents a double-reload if controllerchange fires more than once.
if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
