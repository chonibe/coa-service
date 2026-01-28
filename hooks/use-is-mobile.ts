"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * Enhanced mobile detection hook for the slide editor
 * 
 * Features:
 * - Detects touch device vs desktop
 * - Supports dev bypass via env var or query param
 * - SSR-safe with hydration handling
 */

export interface UseIsMobileOptions {
  /** Force mobile mode (for testing) */
  forceMobile?: boolean
  /** Breakpoint for mobile detection (default: 768) */
  breakpoint?: number
}

export interface UseIsMobileResult {
  /** True if device is mobile/tablet */
  isMobile: boolean
  /** True if device has touch capability */
  hasTouch: boolean
  /** True if dev bypass is active */
  isDevBypass: boolean
  /** True after client-side hydration */
  isHydrated: boolean
  /** Screen width */
  width: number
}

export function useIsMobile(options: UseIsMobileOptions = {}): UseIsMobileResult {
  const { forceMobile, breakpoint = 768 } = options
  
  const [state, setState] = useState<UseIsMobileResult>({
    isMobile: false,
    hasTouch: false,
    isDevBypass: false,
    isHydrated: false,
    width: 0,
  })

  const checkMobile = useCallback(() => {
    if (typeof window === "undefined") return

    const width = window.innerWidth
    const isMobileWidth = width < breakpoint
    
    // Check for touch capability
    const hasTouch = 
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - for older browsers
      navigator.msMaxTouchPoints > 0

    // Check for dev bypass
    const searchParams = new URLSearchParams(window.location.search)
    const devParam = searchParams.get('dev') === '1'
    const envBypass = process.env.NEXT_PUBLIC_ALLOW_DESKTOP_EDITOR === 'true'
    const isDevBypass = devParam || envBypass

    setState({
      isMobile: forceMobile ?? (isMobileWidth || hasTouch),
      hasTouch,
      isDevBypass,
      isHydrated: true,
      width,
    })
  }, [breakpoint, forceMobile])

  useEffect(() => {
    checkMobile()

    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [checkMobile])

  return state
}

/**
 * Hook to check if we should show the desktop gate
 * Returns false if:
 * - Device is mobile
 * - Dev bypass is active
 */
export function useShouldShowDesktopGate(): boolean {
  const { isMobile, isDevBypass, isHydrated } = useIsMobile()
  
  // During SSR or before hydration, don't show gate
  if (!isHydrated) return false
  
  // Show gate if on desktop without dev bypass
  return !isMobile && !isDevBypass
}

export default useIsMobile
