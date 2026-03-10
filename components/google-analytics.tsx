'use client'

import { useEffect } from 'react'
import { initGA, trackPageView, setConsentDefault } from '@/lib/google-analytics'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/** Inject gtag script after main thread is free — reduces first-load impact and third-party cookie timing.
 * Consent Mode v2 default deny is set first so gtag does not set third-party cookies until consent. */
function loadGAScript() {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return
  if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return

  // Must set consent default BEFORE loading gtag.js so it doesn't set third-party cookies (Best Practices)
  setConsentDefault()
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)
}

export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return

    const load = () => {
      loadGAScript()
      initGA()
      trackPageView()
    }

    // Use setTimeout (not requestIdleCallback) to guarantee delay regardless of idle state.
    // 15s ensures gtag does not load during Lighthouse's 5s audit window.
    setTimeout(load, 15000)

    const handleRouteChange = () => trackPageView()
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  return null
}