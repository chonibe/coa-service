'use client'

import { useEffect } from 'react'
import { initGA, trackPageView } from '@/lib/google-analytics'

export function GoogleAnalytics() {
  useEffect(() => {
    // Initialize Google Analytics
    initGA()

    // Track initial page view
    trackPageView()

    // Track page views on route changes
    const handleRouteChange = () => {
      trackPageView()
    }

    // Listen for Next.js route changes
    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  return null
}