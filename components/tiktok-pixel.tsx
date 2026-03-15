'use client'

import { useEffect } from 'react'

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
  useEffect(() => {
    if (typeof window === 'undefined' || !TIKTOK_PIXEL_ID) return
    if (typeof window.ttq === 'object') return // Already initialized

    // Initialize TikTok Pixel
    const w = window as any
    w.ttq = w.ttq || []
    
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
  }, [])

  return null
}
