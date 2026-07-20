'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  isLandingPath,
  LANDING_ANALYTICS_DEFER_MS,
} from '@/lib/analytics/landing-paths'

declare global {
  interface Window {
    ttq?: {
      load: (pixelId: string) => void
      page: () => void
      identify: (userData: Record<string, any>) => void
      track: (event: string, data?: Record<string, any>) => void
    }
  }
}

const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID

/**
 * Initializes TikTok Pixel base code once.
 * Event dispatching can be handled via server-side Events API or client-side tracking.
 *
 * Reference: https://business.tiktok.com/help/article?aid=9502
 */
export function TikTokPixel() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined' || !TIKTOK_PIXEL_ID) return
    if (typeof window.ttq === 'object') return // Already initialized

    const w = window as any
    w.ttq = w.ttq || []

    const loadScript = () => {
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://analytics.tiktok.com/i18n/pixel/events.js'
      script.onload = () => {
        if (w.ttq && typeof w.ttq.load === 'function') {
          w.ttq.load(TIKTOK_PIXEL_ID)
          w.ttq.page()
        }
      }
      document.head.appendChild(script)
    }

    const onLanding = isLandingPath(pathname)
    let deferTimer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const schedule = () => {
      if (cancelled) return
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(loadScript, { timeout: 5000 })
      } else {
        loadScript()
      }
    }

    if (onLanding) {
      deferTimer = setTimeout(schedule, LANDING_ANALYTICS_DEFER_MS)
    } else if (typeof window.requestIdleCallback !== 'undefined') {
      requestIdleCallback(schedule, { timeout: 5000 })
    } else {
      deferTimer = setTimeout(schedule, 3000)
    }

    return () => {
      cancelled = true
      if (deferTimer) clearTimeout(deferTimer)
    }
  }, [pathname])

  return null
}
