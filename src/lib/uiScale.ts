// Root UI scale — makes the app render at a similar physical size across
// screens and honor the browser's font-size preference. Two factors:
//
//   viewport factor — compensates for large/dense viewports: 1.0 at ≤1280
//     CSS px wide (keeps the ≤768/≤640 mobile breakpoints, which media-query
//     the unzoomed viewport, out of scale's reach), ramping to ~1.27 at 1920
//     and capped at 1.4.
//
//   font factor — the browser's default font size preference (Chrome/Edge
//     "Font size", Firefox "Size") ÷ 16. The app's text is defined in px,
//     which ignores that preference; scaling the whole UI by it honors the
//     preference without letting text outgrow the calendar's fixed px
//     geometry. Read from <html>'s computed font-size, which resolves the
//     'medium' keyword to the user's setting. Clamped to [0.75, 2].
//
// Applied via `#root { zoom: var(--ui-scale) }` in index.css. `zoom` (unlike
// transform: scale) reflows, so scrollbars, fixed positioning, and hit
// targets all stay correct — but pointer deltas from @dnd-kit arrive in
// *client* px while layout constants like SLOT_HEIGHT_PX are in *layout* px,
// so drag math must divide by getUiScale() (see CalendarRoot).

let currentScale = 1

export function computeUiScale(viewportWidth: number, fontScale = 1): number {
  const viewportFactor = Math.min(1.4, Math.max(1, 1 + (viewportWidth - 1280) / 2400))
  return viewportFactor * fontScale
}

function browserFontScale(): number {
  const px = parseFloat(getComputedStyle(document.documentElement).fontSize)
  if (!Number.isFinite(px) || px <= 0) return 1
  return Math.min(2, Math.max(0.75, px / 16))
}

export function getUiScale(): number {
  return currentScale
}

export function initUiScale(): void {
  const apply = () => {
    currentScale = computeUiScale(window.innerWidth, browserFontScale())
    document.documentElement.style.setProperty('--ui-scale', String(currentScale))
    // Inverse, for elements that must opt back out of the zoom (the dnd-kit
    // DragOverlay wrapper, which is positioned in client px). Set from JS
    // because calc() division by a var() isn't reliable across browsers.
    document.documentElement.style.setProperty('--ui-scale-inv', String(1 / currentScale))
  }
  apply()
  window.addEventListener('resize', apply)

  // Re-apply live if the font-size preference changes while the app is open:
  // a hidden 1rem-wide probe tracks the root font size, and a ResizeObserver
  // on it fires whenever that changes. (No media query exists for this.)
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:absolute;top:0;left:0;width:1rem;height:0;visibility:hidden;pointer-events:none'
  document.body.appendChild(probe)
  new ResizeObserver(apply).observe(probe)
}
