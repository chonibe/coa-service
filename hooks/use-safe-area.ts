"use client"

import { useState, useEffect } from "react"

/**
 * Hook to get safe area insets for notched phones (iPhone X+, etc.)
 * 
 * Uses CSS environment variables: env(safe-area-inset-*)
 * Returns pixel values for use in JavaScript calculations
 */

export interface SafeAreaInsets {
  top: number
  right: number
  bottom: number
  left: number
}

export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const measure = () => {
      // Create a temporary element to measure CSS env() values
      const el = document.createElement("div")
      el.style.cssText = `
        position: fixed;
        top: env(safe-area-inset-top, 0px);
        right: env(safe-area-inset-right, 0px);
        bottom: env(safe-area-inset-bottom, 0px);
        left: env(safe-area-inset-left, 0px);
        pointer-events: none;
        visibility: hidden;
      `
      document.body.appendChild(el)

      const computed = window.getComputedStyle(el)
      const insets = {
        top: parseFloat(computed.top) || 0,
        right: parseFloat(computed.right) || 0,
        bottom: parseFloat(computed.bottom) || 0,
        left: parseFloat(computed.left) || 0,
      }

      document.body.removeChild(el)
      setInsets(insets)
    }

    measure()

    // Re-measure on orientation change
    window.addEventListener("orientationchange", measure)
    window.addEventListener("resize", measure)

    return () => {
      window.removeEventListener("orientationchange", measure)
      window.removeEventListener("resize", measure)
    }
  }, [])

  return insets
}

/**
 * CSS class helper for safe area padding
 * Use in Tailwind: pb-[calc(16px+env(safe-area-inset-bottom))]
 */
export const safeAreaClasses = {
  paddingBottom: "pb-[calc(16px+env(safe-area-inset-bottom))]",
  paddingTop: "pt-[calc(16px+env(safe-area-inset-top))]",
  marginBottom: "mb-[env(safe-area-inset-bottom)]",
  marginTop: "mt-[env(safe-area-inset-top)]",
}

export default useSafeArea
