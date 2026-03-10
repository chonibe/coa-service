'use client'

import { useEffect } from 'react'
import { initGA, trackPageView } from '@/lib/google-analytics'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/** Inject gtag script after main thread is free — reduces first-load impact and third-party cookie timing */
function loadGAScript() {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return
  if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return

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

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(load, { timeout: 2500 })
    } else {
      setTimeout(load, 500)
    }

    const handleRouteChange = () => trackPageView()
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  return null
}