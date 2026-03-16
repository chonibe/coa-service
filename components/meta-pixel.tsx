'use client'

import { useEffect } from 'react'
import { getFbc, getFbp, captureClientIpAddress } from '@/lib/meta-parameter-builder'

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    _fbq?: (...args: any[]) => void
  }
}

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || undefined

/**
 * Initializes Meta Pixel base code once.
 * Event dispatching is handled in analytics helpers.
 * 
 * Also captures fbc/fbp early using Parameter Builder Library for improved EMQ.
 */
export function MetaPixel() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Early return if Pixel ID is not configured
    if (!META_PIXEL_ID) {
      console.warn('[Meta Pixel] NEXT_PUBLIC_META_PIXEL_ID is not set. Meta Pixel will not be initialized.')
      return
    }
    
    // Early return if already initialized
    if (typeof window.fbq === 'function') return

    const w = window as any
    const n = function (...args: unknown[]) {
      if ((n as any).callMethod) {
        ;(n as any).callMethod.apply(n, args)
      } else {
        ;(n as any).queue.push(args)
      }
    } as any
    if (!w._fbq) w._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    w.fbq = n

    const loadScript = () => {
      // Capture fbc/fbp inside the deferred loader so the _fbp cookie is only
      // written when fbevents.js actually loads — prevents Lighthouse from flagging
      // the _fbp cookie write that previously happened before the script deferred.
      getFbc()
      getFbp()
      captureClientIpAddress()

      const script = document.createElement('script')
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      document.head.appendChild(script)

      if (META_PIXEL_ID) {
        window.fbq?.('init', META_PIXEL_ID)
      }
    }

    // Defer fbevents.js until the browser is idle to avoid blocking LCP/TBT
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(loadScript, { timeout: 5000 })
    } else {
      setTimeout(loadScript, 3000)
    }
  }, [])

  return null
}
