'use client'

import { useRef, useEffect, useCallback } from 'react'
import { gsap } from './gsap-config'
import type ScrollTrigger from 'gsap/ScrollTrigger'

/**
 * Navigation Animations
 * 
 * Minimal GSAP utilities for smooth, calm navigation transitions:
 * - useSmoothDrawer: Smooth drawer open/close with GSAP
 * - useExpandableHeight: Smooth height animation for menu expansion
 * - useSmoothHeaderScroll: Scroll-linked header color transitions
 */

/**
 * useSmoothDrawer
 * 
 * Creates smooth GSAP-powered drawer animations.
 * Usage: const { openDrawer, closeDrawer } = useSmoothDrawer(drawerRef, backdropRef)
 */
export function useSmoothDrawer(
  drawerRef: React.RefObject<HTMLDivElement>,
  backdropRef: React.RefObject<HTMLDivElement>
) {
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!drawerRef.current || !backdropRef.current) return

    // Create reusable timeline
    timelineRef.current = gsap.timeline({ paused: true })

    // Backdrop fade (150ms)
    timelineRef.current.fromTo(
      backdropRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.15, ease: 'power2.out' },
      0
    )

    // Drawer slide (300ms)
    timelineRef.current.fromTo(
      drawerRef.current,
      { x: '100%' },
      { x: '0%', duration: 0.3, ease: 'power2.out' },
      0
    )

    return () => {
      timelineRef.current?.kill()
    }
  }, [drawerRef, backdropRef])

  const openDrawer = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.play()
    }
  }, [])

  const closeDrawer = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.reverse()
    }
  }, [])

  return { openDrawer, closeDrawer }
}

/**
 * useExpandableHeight
 * 
 * Smooth GSAP height animation for expandable menu items.
 * Usage: const { toggleHeight } = useExpandableHeight(contentRef)
 */
export function useExpandableHeight(contentRef: React.RefObject<HTMLDivElement>) {
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const isOpenRef = useRef(false)

  const toggleHeight = useCallback(
    (open?: boolean) => {
      if (!contentRef.current) return

      const shouldOpen = open !== undefined ? open : !isOpenRef.current
      isOpenRef.current = shouldOpen

      if (timelineRef.current) {
        timelineRef.current.kill()
      }

      if (shouldOpen) {
        const scrollHeight = contentRef.current.scrollHeight
        timelineRef.current = gsap.to(contentRef.current, {
          height: scrollHeight,
          duration: 0.25,
          ease: 'power2.inOut',
          onComplete: () => {
            // Remove height constraint once fully expanded
            if (contentRef.current) {
              gsap.set(contentRef.current, { height: 'auto' })
            }
          },
        })
      } else {
        timelineRef.current = gsap.to(contentRef.current, {
          height: 0,
          duration: 0.25,
          ease: 'power2.inOut',
        })
      }
    },
    [contentRef]
  )

  return { toggleHeight }
}

/**
 * useSmoothHeaderScroll
 * 
 * Smooth scroll-linked header color transitions.
 * Usage: const { scrollProgress } = useSmoothHeaderScroll(headerRef, threshold)
 */
export function useSmoothHeaderScroll(
  headerRef: React.RefObject<HTMLElement>,
  threshold: number = 80
) {
  const scrollProgressRef = useRef(0)
  const triggerRef = useRef<ScrollTrigger | null>(null)

  useEffect(() => {
    if (!headerRef.current) return

    const handleScroll = () => {
      const scrollThreshold = window.innerHeight * (threshold / 100)
      const progress = Math.min(window.scrollY / scrollThreshold, 1)
      scrollProgressRef.current = progress

      if (!headerRef.current) return

      // Interpolate background opacity: transparent → white
      const bgOpacity = progress * 0.95 // Max opacity 0.95 for white background

      // Interpolate text color: white → black (via opacity)
      const isDark = progress > 0.5

      // Update header styles with smooth interpolation
      gsap.to(headerRef.current, {
        backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
        duration: 0,
        clearProps: 'none',
      })

      // Update icon/text colors smoothly
      const color = gsap.utils.interpolate(
        [255, 255, 255], // white
        [0, 0, 0], // black
        progress
      )
      const [r, g, b] = color as [number, number, number]

      // Apply color to text and icons via CSS variable
      headerRef.current.style.setProperty(
        '--nav-color',
        `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
      )
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Call on mount

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (triggerRef.current) {
        triggerRef.current.kill()
      }
    }
  }, [headerRef, threshold])

  return { scrollProgress: scrollProgressRef.current }
}

/**
 * useSmoothMenuDrawer
 * 
 * Similar to useSmoothDrawer but for left-sliding menu (mobile menu).
 * Usage: const { openMenu, closeMenu } = useSmoothMenuDrawer(menuRef, backdropRef)
 */
export function useSmoothMenuDrawer(
  menuRef: React.RefObject<HTMLDivElement>,
  backdropRef: React.RefObject<HTMLDivElement>
) {
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!menuRef.current || !backdropRef.current) return

    // Create reusable timeline
    timelineRef.current = gsap.timeline({ paused: true })

    // Backdrop fade (150ms)
    timelineRef.current.fromTo(
      backdropRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.15, ease: 'power2.out' },
      0
    )

    // Menu slide from left (300ms)
    timelineRef.current.fromTo(
      menuRef.current,
      { x: '-100%' },
      { x: '0%', duration: 0.3, ease: 'power2.out' },
      0
    )

    return () => {
      timelineRef.current?.kill()
    }
  }, [menuRef, backdropRef])

  const openMenu = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.play()
    }
  }, [])

  const closeMenu = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.reverse()
    }
  }, [])

  return { openMenu, closeMenu }
}
