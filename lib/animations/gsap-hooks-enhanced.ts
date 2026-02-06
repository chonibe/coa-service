/**
 * Enhanced GSAP React Hooks
 * 
 * Additional animation hooks for immersive experiences.
 * Complements the existing gsap-hooks.ts without replacing it.
 */

'use client'

import { useRef, useEffect, MutableRefObject } from 'react'
import { gsap, Draggable, Observer } from './gsap-config'
import { useGSAP } from '@gsap/react'

// =============================================================================
// MAGNETIC HOVER EFFECT
// =============================================================================

export interface MagneticHoverOptions {
  /** Strength of magnetic pull (0-1, default 0.3) */
  strength?: number
  /** Speed of follow animation (default 0.3) */
  speed?: number
  /** Maximum distance to pull (pixels, default 50) */
  maxDistance?: number
  /** Enable on mobile/touch devices */
  enableOnTouch?: boolean
}

/**
 * Magnetic hover effect - element follows cursor within bounds
 * 
 * @example
 * ```tsx
 * const cardRef = useMagneticHover({ strength: 0.4 })
 * return <div ref={cardRef}>Card content</div>
 * ```
 */
export function useMagneticHover(options: MagneticHoverOptions = {}) {
  const {
    strength = 0.3,
    speed = 0.3,
    maxDistance = 50,
    enableOnTouch = false,
  } = options

  const elementRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    const element = elementRef.current
    if (!element) return

    // Skip on touch devices if disabled
    if (!enableOnTouch && window.matchMedia('(pointer: coarse)').matches) {
      return
    }

    let quickX: gsap.QuickToFunc
    let quickY: gsap.QuickToFunc

    // Create quickTo functions for 60fps performance
    quickX = gsap.quickTo(element, 'x', { duration: speed, ease: 'power2.out' })
    quickY = gsap.quickTo(element, 'y', { duration: speed, ease: 'power2.out' })

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate distance from center
      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY

      // Apply strength and limit to maxDistance
      let moveX = deltaX * strength
      let moveY = deltaY * strength

      const distance = Math.sqrt(moveX * moveX + moveY * moveY)
      if (distance > maxDistance) {
        const scale = maxDistance / distance
        moveX *= scale
        moveY *= scale
      }

      quickX(moveX)
      quickY(moveY)
    }

    const handleMouseLeave = () => {
      // Return to center
      quickX(0)
      quickY(0)
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, { dependencies: [strength, speed, maxDistance, enableOnTouch] })

  return elementRef
}

// =============================================================================
// CRATE CAROUSEL HOOK
// =============================================================================

export interface CrateCarouselOptions {
  /** Number of items in carousel */
  itemCount: number
  /** Initial active index */
  initialIndex?: number
  /** Callback when active index changes */
  onIndexChange?: (index: number) => void
  /** Enable infinite loop */
  infinite?: boolean
  /** Snap strength (0-1) */
  snapStrength?: number
  /** Drag resistance */
  resistance?: number
}

export interface CrateCarouselReturn {
  containerRef: MutableRefObject<HTMLDivElement | null>
  activeIndex: number
  goToIndex: (index: number) => void
  next: () => void
  prev: () => void
}

/**
 * Vinyl crate carousel with draggable interaction
 * 
 * @example
 * ```tsx
 * const { containerRef, activeIndex } = useCrateCarousel({
 *   itemCount: products.length,
 *   onIndexChange: (index) => console.log(index)
 * })
 * 
 * return (
 *   <div ref={containerRef}>
 *     {products.map((p, i) => <Card key={i} data-index={i} />)}
 *   </div>
 * )
 * ```
 */
export function useCrateCarousel(
  options: CrateCarouselOptions
): CrateCarouselReturn {
  const {
    itemCount,
    initialIndex = 0,
    onIndexChange,
    infinite = true,
    snapStrength = 0.8,
    resistance = 0.5,
  } = options

  const containerRef = useRef<HTMLDivElement>(null)
  const activeIndexRef = useRef(initialIndex)
  const draggableRef = useRef<Draggable[]>([])

  const goToIndex = (index: number) => {
    if (!containerRef.current) return

    // Clamp or loop index
    let targetIndex = index
    if (infinite) {
      targetIndex = ((index % itemCount) + itemCount) % itemCount
    } else {
      targetIndex = Math.max(0, Math.min(itemCount - 1, index))
    }

    activeIndexRef.current = targetIndex
    onIndexChange?.(targetIndex)

    // Update card positions
    updateCardPositions(targetIndex)
  }

  const updateCardPositions = (centerIndex: number) => {
    if (!containerRef.current) return

    const cards = Array.from(
      containerRef.current.querySelectorAll('[data-index]')
    ) as HTMLElement[]

    cards.forEach((card, index) => {
      const distance = index - centerIndex

      // 3D fan-out effect
      const z = Math.abs(distance) * -100
      const rotateY = distance * 15 // Rotate cards based on position
      const scale = Math.max(0.7, 1 - Math.abs(distance) * 0.15)
      const opacity = Math.max(0.4, 1 - Math.abs(distance) * 0.2)
      const x = distance * 120

      gsap.to(card, {
        x,
        z,
        rotateY,
        scale,
        opacity,
        duration: 0.6,
        ease: 'power2.out',
      })
    })
  }

  const next = () => goToIndex(activeIndexRef.current + 1)
  const prev = () => goToIndex(activeIndexRef.current - 1)

  useGSAP(() => {
    const container = containerRef.current
    if (!container) return

    // Initialize card positions
    updateCardPositions(initialIndex)

    // Setup Draggable
    draggableRef.current = Draggable.create(container, {
      type: 'x',
      inertia: true,
      bounds: { minX: -1000, maxX: 1000 },
      onDragEnd: function () {
        const dragDistance = this.x
        const cardWidth = 300 // Approximate card width
        const indexChange = Math.round(dragDistance / cardWidth)

        // Snap to nearest card
        goToIndex(activeIndexRef.current - indexChange)

        // Reset container position
        gsap.to(container, {
          x: 0,
          duration: 0.4,
          ease: 'power2.out',
        })
      },
    })

    // Setup Observer for touch/wheel gestures
    Observer.create({
      target: container,
      type: 'touch,pointer',
      onLeft: next,
      onRight: prev,
      tolerance: 50,
    })

    return () => {
      draggableRef.current.forEach(d => d.kill())
    }
  }, { dependencies: [itemCount], scope: containerRef })

  return {
    containerRef,
    activeIndex: activeIndexRef.current,
    goToIndex,
    next,
    prev,
  }
}

// =============================================================================
// GALLERY REVEAL HOOK
// =============================================================================

export interface GalleryRevealOptions {
  /** Starting scale */
  startScale?: number
  /** Starting rotation (degrees) */
  startRotation?: number
  /** Animation duration */
  duration?: number
  /** Stagger delay between items */
  stagger?: number
  /** ScrollTrigger start position */
  start?: string
}

/**
 * Gallery-style reveal animation for product grids
 * 
 * @example
 * ```tsx
 * const containerRef = useGalleryReveal({
 *   startScale: 0.85,
 *   startRotation: -5,
 *   stagger: 0.1
 * })
 * 
 * return (
 *   <div ref={containerRef}>
 *     {products.map(p => <Card key={p.id} />)}
 *   </div>
 * )
 * ```
 */
export function useGalleryReveal(options: GalleryRevealOptions = {}) {
  const {
    startScale = 0.85,
    startRotation = -5,
    duration = 0.8,
    stagger = 0.1,
    start = 'top 80%',
  } = options

  const containerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    const container = containerRef.current
    if (!container) return

    const items = container.children

    // Set initial state
    gsap.set(items, {
      scale: startScale,
      rotationY: startRotation,
      opacity: 0,
    })

    // Create scroll-triggered animation
    gsap.to(items, {
      scale: 1,
      rotationY: 0,
      opacity: 1,
      duration,
      ease: 'power2.out',
      stagger: {
        amount: stagger * items.length,
        from: 'start',
      },
      scrollTrigger: {
        trigger: container,
        start,
        toggleActions: 'play none none reverse',
      },
    })
  }, { dependencies: [startScale, startRotation, duration, stagger, start], scope: containerRef })

  return containerRef
}

// =============================================================================
// PARALLAX SCROLL HOOK
// =============================================================================

export interface ParallaxScrollOptions {
  /** Speed multiplier (0.5 = half speed, 2 = double speed) */
  speed?: number
  /** Direction of parallax */
  direction?: 'vertical' | 'horizontal'
  /** Enable smooth scrub */
  smoothScrub?: boolean
}

/**
 * Simple parallax scroll effect
 * 
 * @example
 * ```tsx
 * const ref = useParallaxScroll({ speed: 0.5 })
 * return <div ref={ref}><img src="..." /></div>
 * ```
 */
export function useParallaxScroll(options: ParallaxScrollOptions = {}) {
  const {
    speed = 0.5,
    direction = 'vertical',
    smoothScrub = true,
  } = options

  const elementRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    const element = elementRef.current
    if (!element) return

    const distance = 100 * (1 - speed)
    const props = direction === 'vertical'
      ? { y: `${distance}%` }
      : { x: `${distance}%` }

    gsap.to(element, {
      ...props,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: smoothScrub ? 1 : true,
      },
    })
  }, { dependencies: [speed, direction, smoothScrub], scope: elementRef })

  return elementRef
}

// Export everything
export default {
  useMagneticHover,
  useCrateCarousel,
  useGalleryReveal,
  useParallaxScroll,
}
