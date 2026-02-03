/**
 * useScrollHeader Hook
 * 
 * Provides scroll-aware behavior for headers:
 * - Progressive blur on scroll
 * - Logo scale animation
 * - Hide/show on scroll direction
 * - Background color transitions
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { gsap, ScrollTrigger } from './gsap-config'
import { useGSAP } from '@gsap/react'

export interface UseScrollHeaderOptions {
  /** Scroll threshold to trigger effects (px) */
  threshold?: number
  /** Hide header on scroll down */
  hideOnScroll?: boolean
  /** Enable progressive blur effect */
  progressiveBlur?: boolean
  /** Enable logo scale effect */
  logoScale?: boolean
  /** Minimum logo scale value */
  minLogoScale?: number
}

export interface UseScrollHeaderReturn {
  /** Header ref to attach */
  headerRef: React.RefObject<HTMLElement>
  /** Logo ref to attach */
  logoRef: React.RefObject<HTMLElement>
  /** Whether header is scrolled past threshold */
  isScrolled: boolean
  /** Whether header is hidden (scroll direction: down) */
  isHidden: boolean
  /** Current scroll progress (0-1) */
  scrollProgress: number
}

export function useScrollHeader(
  options: UseScrollHeaderOptions = {}
): UseScrollHeaderReturn {
  const {
    threshold = 50,
    hideOnScroll = false,
    progressiveBlur = true,
    logoScale = true,
    minLogoScale = 0.85,
  } = options

  const headerRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const lastScrollY = useRef(0)

  // Handle scroll for hide/show behavior
  useEffect(() => {
    if (!hideOnScroll) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > threshold) {
        setIsScrolled(true)
        
        // Hide when scrolling down, show when scrolling up
        if (currentScrollY > lastScrollY.current && currentScrollY > threshold * 2) {
          setIsHidden(true)
        } else {
          setIsHidden(false)
        }
      } else {
        setIsScrolled(false)
        setIsHidden(false)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hideOnScroll, threshold])

  // GSAP ScrollTrigger for smooth animations
  useGSAP(() => {
    if (typeof window === 'undefined') return

    const header = headerRef.current
    const logo = logoRef.current

    // Progressive blur effect
    if (header && progressiveBlur) {
      ScrollTrigger.create({
        start: 0,
        end: threshold,
        onUpdate: (self) => {
          const progress = self.progress
          setScrollProgress(progress)
          
          // Update backdrop filter
          const blurAmount = progress * 20
          const saturation = 100 + progress * 80
          header.style.backdropFilter = `blur(${blurAmount}px) saturate(${saturation}%)`
          header.style.webkitBackdropFilter = `blur(${blurAmount}px) saturate(${saturation}%)`
          
          // Update background opacity
          const bgOpacity = progress * 0.95
          header.style.backgroundColor = `rgba(255, 255, 255, ${bgOpacity})`
        },
      })
    }

    // Logo scale effect
    if (logo && logoScale) {
      gsap.to(logo, {
        scale: minLogoScale,
        ease: 'none',
        scrollTrigger: {
          start: 0,
          end: threshold,
          scrub: 0.5,
        },
      })
    }

    // Scrolled state trigger
    ScrollTrigger.create({
      start: threshold,
      onEnter: () => setIsScrolled(true),
      onLeaveBack: () => setIsScrolled(false),
    })

  }, { dependencies: [threshold, progressiveBlur, logoScale, minLogoScale] })

  return {
    headerRef,
    logoRef,
    isScrolled,
    isHidden,
    scrollProgress,
  }
}

/**
 * useCartBadgeAnimation Hook
 * 
 * Provides animation for cart badge when items are added.
 */
export function useCartBadgeAnimation() {
  const badgeRef = useRef<HTMLElement>(null)

  const triggerPop = useCallback(() => {
    if (!badgeRef.current) return

    gsap.fromTo(
      badgeRef.current,
      { scale: 0.5 },
      {
        scale: 1,
        duration: 0.4,
        ease: 'elastic.out(1.2, 0.4)',
      }
    )
  }, [])

  const triggerPulse = useCallback(() => {
    if (!badgeRef.current) return

    gsap.to(badgeRef.current, {
      scale: 1.2,
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
    })
  }, [])

  return {
    badgeRef,
    triggerPop,
    triggerPulse,
  }
}
