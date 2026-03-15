'use client'

import { useEffect } from 'react'
import { initGA, trackPageView, setConsentDefault, setConsentGranted } from '@/lib/google-analytics'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/** Inject gtag script and initialize consent.
 * Default deny is set before load, then analytics is explicitly granted for this app. */
function loadGAScript() {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return
  const existing = document.querySelector('script[src*="googletagmanager.com/gtag/js"]')
  if (existing) return

  // Must set consent default BEFORE loading gtag.js so it doesn't set third-party cookies (Best Practices)
  setConsentDefault()
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  script.onload = () => {
    // Guarantee consent and initialization run after gtag library is available.
    setConsentGranted()
    initGA()
    trackPageView()
  }
  document.head.appendChild(script)
}

export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return

    const load = () => {
      const hasExistingScript = !!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')
      if (hasExistingScript) {
        // Existing GA script path (client-side navigation/hot reload).
        setConsentGranted()
        initGA()
        trackPageView()
        return
      }
      loadGAScript()
    }

    // Load immediately to avoid dropping fast first-interaction events.
    load()
    
    const onLocationChange = () => {
      if (typeof window === 'undefined') return
      trackPageView(undefined, `${window.location.pathname}${window.location.search}`)
    }

    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args)
      onLocationChange()
    }

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args)
      onLocationChange()
    }

    window.addEventListener('popstate', onLocationChange)

    return () => {
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      window.removeEventListener('popstate', onLocationChange)
    }
  }, [])

  return null
}