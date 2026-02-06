/**
 * ScrollSmoother Provider
 * 
 * Wraps content with GSAP ScrollSmoother for buttery-smooth scrolling.
 * Creates a premium, fluid scrolling experience.
 * 
 * Note: ScrollSmoother requires specific HTML structure:
 * - #smooth-wrapper (position: relative)
 * - #smooth-content (will be transformed)
 * 
 * @example
 * ```tsx
 * <ScrollSmootherProvider speed={0.8} effects={true}>
 *   <YourContent />
 * </ScrollSmootherProvider>
 * ```
 */

'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/animations/gsap-config'
import { prefersReducedMotion } from '@/lib/animations/gsap-config'

// Note: ScrollSmoother is part of GSAP's free plugins as of 2024
// Import dynamically to avoid SSR issues
let ScrollSmoother: any = null

if (typeof window !== 'undefined') {
  import('gsap/ScrollSmoother').then(module => {
    ScrollSmoother = module.ScrollSmoother
    gsap.registerPlugin(ScrollSmoother)
  })
}

export interface ScrollSmootherProviderProps {
  children: React.ReactNode
  /** Scroll speed multiplier (0.5-1.5, default 1) */
  speed?: number
  /** Enable velocity-based effects on elements with data-speed */
  effects?: boolean
  /** Smoothness factor (lower = smoother but more lag) */
  smoothness?: number
  /** Enable on mobile/touch devices */
  enableOnMobile?: boolean
  /** Wrapper element ID */
  wrapperId?: string
  /** Content element ID */
  contentId?: string
}

export function ScrollSmootherProvider({
  children,
  speed = 1,
  effects = true,
  smoothness = 1,
  enableOnMobile = false,
  wrapperId = 'smooth-wrapper',
  contentId = 'smooth-content',
}: ScrollSmootherProviderProps) {
  const smootherRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Skip on reduced motion preference
    if (prefersReducedMotion()) {
      setIsReady(true)
      return
    }

    // Skip on mobile if disabled
    const isMobile = window.matchMedia('(pointer: coarse)').matches
    if (isMobile && !enableOnMobile) {
      setIsReady(true)
      return
    }

    // Wait for ScrollSmoother to load
    const initSmoother = () => {
      if (!ScrollSmoother) {
        setTimeout(initSmoother, 100)
        return
      }

      // Create ScrollSmoother instance
      smootherRef.current = ScrollSmoother.create({
        wrapper: `#${wrapperId}`,
        content: `#${contentId}`,
        smooth: smoothness,
        effects: effects,
        normalizeScroll: true, // Normalize scrollbar behavior
        ignoreMobileResize: true,
        // Custom smooth scroll multiplier
        onUpdate: (self: any) => {
          // Optional: Add custom effects based on velocity
          if (effects && self.getVelocity) {
            const velocity = Math.abs(self.getVelocity())
            // Could add blur or other effects based on velocity
          }
        },
      })

      setIsReady(true)
    }

    initSmoother()

    // Cleanup
    return () => {
      if (smootherRef.current) {
        smootherRef.current.kill()
      }
    }
  }, [speed, effects, smoothness, enableOnMobile, wrapperId, contentId])

  return (
    <div
      id={wrapperId}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        id={contentId}
        style={{
          position: 'relative',
          width: '100%',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Hook to access ScrollSmoother instance from anywhere in the tree
 */
export function useScrollSmoother() {
  const [smoother, setSmoother] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && ScrollSmoother) {
      const instance = ScrollSmoother.get()
      setSmoother(instance)
    }
  }, [])

  return smoother
}

/**
 * Scroll to element or position using ScrollSmoother
 * 
 * @example
 * ```tsx
 * const scrollTo = useScrollTo()
 * 
 * <button onClick={() => scrollTo('#section-2')}>
 *   Go to Section 2
 * </button>
 * ```
 */
export function useScrollTo() {
  const smoother = useScrollSmoother()

  return React.useCallback(
    (target: string | number | HTMLElement, smooth = true) => {
      if (smoother) {
        smoother.scrollTo(target, smooth)
      } else {
        // Fallback to regular scroll
        if (typeof target === 'string') {
          const element = document.querySelector(target)
          element?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
        } else if (typeof target === 'number') {
          window.scrollTo({
            top: target,
            behavior: smooth ? 'smooth' : 'auto',
          })
        } else if (target instanceof HTMLElement) {
          target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
        }
      }
    },
    [smoother]
  )
}

/**
 * Wrapper component for parallax elements
 * 
 * @example
 * ```tsx
 * <ParallaxElement speed={0.5}>
 *   <img src="..." />
 * </ParallaxElement>
 * ```
 */
export interface ParallaxElementProps {
  children: React.ReactNode
  /** Speed multiplier (0.5 = half speed, 2 = double speed) */
  speed?: number
  /** Lag amount (creates trailing effect) */
  lag?: number
  className?: string
}

export function ParallaxElement({
  children,
  speed = 0.5,
  lag = 0,
  className,
}: ParallaxElementProps) {
  return (
    <div
      className={className}
      data-speed={speed}
      data-lag={lag}
      style={{ willChange: 'transform' }}
    >
      {children}
    </div>
  )
}
