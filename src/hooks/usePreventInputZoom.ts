import { useEffect } from 'react'

/**
 * Prevents iOS Safari/Chrome from auto-zooming when an input is focused.
 *
 * The standard fix (font-size ≥ 16px) doesn't work inside position:fixed
 * containers (modals) on iOS Chrome. This hook temporarily sets
 * maximum-scale=1 while any input/select/textarea is focused, then restores
 * the original viewport meta on blur so the user can still pinch-zoom normally.
 */
export function usePreventInputZoom() {
  useEffect(() => {
    // Only needed on iOS — skip on desktop to avoid any side effects
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    if (!isIOS) return

    const viewport = document.querySelector('meta[name="viewport"]')
    if (!viewport) return

    const original = viewport.getAttribute('content') ?? 'width=device-width, initial-scale=1'
    const noZoom = original.includes('maximum-scale')
      ? original.replace(/maximum-scale=[^,]+/, 'maximum-scale=1')
      : original + ', maximum-scale=1'

    const isField = (t: EventTarget | null) =>
      t instanceof HTMLInputElement ||
      t instanceof HTMLSelectElement ||
      t instanceof HTMLTextAreaElement

    const onFocus = (e: FocusEvent) => {
      if (isField(e.target)) viewport.setAttribute('content', noZoom)
    }
    const onBlur = (e: FocusEvent) => {
      if (isField(e.target)) viewport.setAttribute('content', original)
    }

    // Use capture so we catch focus/blur on all inputs in every component
    document.addEventListener('focus', onFocus, true)
    document.addEventListener('blur', onBlur, true)
    return () => {
      document.removeEventListener('focus', onFocus, true)
      document.removeEventListener('blur', onBlur, true)
    }
  }, [])
}
