/**
 * Tawk.to chat - lazy-loaded to avoid i18next initialization errors.
 * Script injects on first user click instead of page load.
 * We prevent Tawk from changing document.title (e.g. "1 new message") - it's annoying.
 */

const TAWK_SCRIPT_SRC = 'https://embed.tawk.to/69a429d6e79dd41c3844154b/1jikk6s6e'

declare global {
  interface Window {
    Tawk_API?: {
      showWidget?: () => void
      maximize?: () => void
      hideWidget?: () => void
      onLoad?: () => void
    }
    Tawk_LoadStart?: Date
  }
}

/** Keeps document.title unchanged - prevents Tawk "1 new message" etc. in tab */
function preventTawkTitleChanges() {
  if (typeof document === 'undefined') return
  const titleEl = document.querySelector('title')
  if (!titleEl) return

  const originalTitle = document.title

  const observer = new MutationObserver(() => {
    const current = document.title
    // Revert if Tawk changed it to notification-style text (e.g. "1 new message", "(2) Page Title")
    if (
      current !== originalTitle &&
      (/^\d+\s*(new|unread)\s*message/i.test(current) ||
        /^\(\d+\)\s/.test(current) ||
        /new\s*message/i.test(current))
    ) {
      document.title = originalTitle
    }
  })

  observer.observe(titleEl, { childList: true, characterData: true, subtree: true })
}

function hidePoweredBy() {
  try {
    document.querySelectorAll('a[href*="tawk.to"][href*="utm_source=tawk-messenger"]').forEach((a) => {
      a.style.setProperty('display', 'none', 'important')
      if (a.parentElement) a.parentElement.style.setProperty('display', 'none', 'important')
    })
  } catch {
    // ignore
  }
}

function isTawkScriptLoaded(): boolean {
  if (typeof document === 'undefined') return false
  return !!document.querySelector('script[src*="embed.tawk.to"][src*="69a429d6e79dd41c3844154b"]')
}

function injectTawkScript(openOnLoad: boolean): void {
  if (typeof document === 'undefined' || isTawkScriptLoaded()) return

  window.Tawk_API = window.Tawk_API || {}
  window.Tawk_LoadStart = new Date()

  window.Tawk_API.onLoad = () => {
    window.Tawk_API?.hideWidget?.()
    preventTawkTitleChanges()
    hidePoweredBy()
    setInterval(hidePoweredBy, 500)
    if (openOnLoad) {
      window.Tawk_API?.showWidget?.()
      window.Tawk_API?.maximize?.()
    }
  }
  ;(window as Window & { Tawk_API: { onChatMinimized?: () => void } }).Tawk_API.onChatMinimized = () => {
    window.Tawk_API?.hideWidget?.()
  }

  const s1 = document.createElement('script')
  const s0 = document.getElementsByTagName('script')[0]
  s1.async = true
  s1.src = TAWK_SCRIPT_SRC
  s1.charset = 'UTF-8'
  s1.setAttribute('crossorigin', '*')
  s0?.parentNode?.insertBefore(s1, s0)
}

/**
 * Opens Tawk chat. On first call, injects the Tawk script and opens when ready.
 * On subsequent calls, just maximizes the widget.
 */
export function openTawkChat(): void {
  if (typeof window === 'undefined') return

  if (window.Tawk_API) {
    window.Tawk_API.showWidget?.()
    window.Tawk_API.maximize?.()
    return
  }

  if (isTawkScriptLoaded()) {
    // Script loading — wait for onLoad, then maximize. Poll briefly.
    const check = (attempts = 0) => {
      if (window.Tawk_API && attempts < 50) {
        window.Tawk_API.showWidget?.()
        window.Tawk_API.maximize?.()
        return
      }
      if (attempts < 50) setTimeout(() => check(attempts + 1), 100)
    }
    check()
    return
  }

  injectTawkScript(true)
}
