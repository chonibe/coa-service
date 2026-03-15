'use client'

import { useEffect } from 'react'
import { getFbc, getFbp, captureClientIpAddress } from '@/lib/meta-parameter-builder'

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    _fbq?: (...args: any[]) => void
  }
}

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

/**
 * Initializes Meta Pixel base code once.
 * Event dispatching is handled in analytics helpers.
 * 
 * Also captures fbc/fbp early using Parameter Builder Library for improved EMQ.
 */
export function MetaPixel() {
  useEffect(() => {
    if (typeof window === 'undefined' || !META_PIXEL_ID) return
    if (typeof window.fbq === 'function') return

    // Capture fbc/fbp early using Parameter Builder (best practice)
    getFbc()
    getFbp()
    captureClientIpAddress()

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

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)

    window.fbq?.('init', META_PIXEL_ID)
  }, [])

  return null
}
