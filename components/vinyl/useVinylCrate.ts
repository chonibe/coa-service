/**
 * useVinylCrate Hook
 * 
 * Manages state and navigation for the VinylCrateBrowser.
 * Handles drag/swipe gestures, momentum, and snap-to-card behavior.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { gsap, Draggable, Observer, durations, customEases } from '@/lib/animations'
import { useGSAP } from '@gsap/react'

export interface UseVinylCrateOptions {
  /** Total number of items in the crate */
  itemCount: number
  /** Initial active index */
  defaultIndex?: number
  /** Whether infinite looping is enabled */
  infinite?: boolean
  /** Card width in pixels */
  cardWidth?: number
  /** Gap between cards */
  gap?: number
  /** Callback when active index changes */
  onIndexChange?: (index: number) => void
  /** Whether dragging is enabled */
  draggable?: boolean
}

export interface UseVinylCrateReturn {
  /** Ref for the crate container */
  crateRef: React.RefObject<HTMLDivElement>
  /** Ref for the cards wrapper */
  wrapperRef: React.RefObject<HTMLDivElement>
  /** Current active card index */
  activeIndex: number
  /** Navigate to specific index */
  goTo: (index: number, animate?: boolean) => void
  /** Go to next card */
  next: () => void
  /** Go to previous card */
  prev: () => void
  /** Whether currently animating */
  isAnimating: boolean
  /** Whether at the start */
  isAtStart: boolean
  /** Whether at the end */
  isAtEnd: boolean
  /** Progress (0-1) through the crate */
  progress: number
}

export function useVinylCrate(options: UseVinylCrateOptions): UseVinylCrateReturn {
  const {
    itemCount,
    defaultIndex = 0,
    infinite = false,
    cardWidth = 280,
    gap = 20,
    onIndexChange,
    draggable = true,
  } = options

  const crateRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(defaultIndex)
  const [isAnimating, setIsAnimating] = useState(false)
  const draggableRef = useRef<Draggable[] | null>(null)
  const observerRef = useRef<Observer | null>(null)

  // Calculate positions
  const getXForIndex = useCallback((index: number) => {
    return -(index * (cardWidth + gap))
  }, [cardWidth, gap])

  // Snap to nearest card
  const snapToNearest = useCallback(() => {
    if (!wrapperRef.current) return

    const currentX = gsap.getProperty(wrapperRef.current, 'x') as number
    const index = Math.round(-currentX / (cardWidth + gap))
    const clampedIndex = infinite 
      ? ((index % itemCount) + itemCount) % itemCount 
      : Math.max(0, Math.min(index, itemCount - 1))
    
    goTo(clampedIndex)
  }, [cardWidth, gap, itemCount, infinite])

  // Go to specific index
  const goTo = useCallback((index: number, animate = true) => {
    if (isAnimating && animate) return
    
    const targetIndex = infinite 
      ? ((index % itemCount) + itemCount) % itemCount 
      : Math.max(0, Math.min(index, itemCount - 1))

    if (targetIndex === activeIndex && animate) return

    setIsAnimating(true)
    const targetX = getXForIndex(targetIndex)

    if (animate && wrapperRef.current) {
      gsap.to(wrapperRef.current, {
        x: targetX,
        duration: durations.crateFlip,
        ease: customEases.crateMomentum,
        onComplete: () => {
          setActiveIndex(targetIndex)
          setIsAnimating(false)
          onIndexChange?.(targetIndex)
        },
      })
    } else if (wrapperRef.current) {
      gsap.set(wrapperRef.current, { x: targetX })
      setActiveIndex(targetIndex)
      onIndexChange?.(targetIndex)
      setIsAnimating(false)
    }
  }, [activeIndex, isAnimating, getXForIndex, itemCount, infinite, onIndexChange])

  // Navigation helpers
  const next = useCallback(() => {
    if (infinite || activeIndex < itemCount - 1) {
      goTo(activeIndex + 1)
    }
  }, [activeIndex, itemCount, infinite, goTo])

  const prev = useCallback(() => {
    if (infinite || activeIndex > 0) {
      goTo(activeIndex - 1)
    }
  }, [activeIndex, infinite, goTo])

  // Set up GSAP draggable and observer
  useGSAP(() => {
    if (!wrapperRef.current || !crateRef.current || !draggable) return

    const wrapper = wrapperRef.current
    const maxX = 0
    const minX = -((itemCount - 1) * (cardWidth + gap))

    // Set initial position
    gsap.set(wrapper, { x: getXForIndex(defaultIndex) })

    // Create Draggable for desktop
    draggableRef.current = Draggable.create(wrapper, {
      type: 'x',
      bounds: infinite ? undefined : { minX, maxX },
      edgeResistance: infinite ? 0 : 0.85,
      inertia: true,
      throwProps: true,
      snap: (value) => {
        const index = Math.round(-value / (cardWidth + gap))
        const clampedIndex = infinite 
          ? ((index % itemCount) + itemCount) % itemCount 
          : Math.max(0, Math.min(index, itemCount - 1))
        return getXForIndex(clampedIndex)
      },
      onDragStart: () => {
        setIsAnimating(true)
      },
      onDragEnd: function() {
        const currentX = this.x
        const index = Math.round(-currentX / (cardWidth + gap))
        const clampedIndex = infinite 
          ? ((index % itemCount) + itemCount) % itemCount 
          : Math.max(0, Math.min(index, itemCount - 1))
        
        setActiveIndex(clampedIndex)
        setIsAnimating(false)
        onIndexChange?.(clampedIndex)
      },
      onThrowComplete: function() {
        const currentX = gsap.getProperty(wrapper, 'x') as number
        const index = Math.round(-currentX / (cardWidth + gap))
        const clampedIndex = infinite 
          ? ((index % itemCount) + itemCount) % itemCount 
          : Math.max(0, Math.min(index, itemCount - 1))
        
        setActiveIndex(clampedIndex)
        setIsAnimating(false)
        onIndexChange?.(clampedIndex)
      },
    })

    // Create Observer for touch swipe and wheel
    observerRef.current = Observer.create({
      target: crateRef.current,
      type: 'wheel,touch',
      wheelSpeed: -1,
      onLeft: () => next(),
      onRight: () => prev(),
      tolerance: 50,
      preventDefault: true,
    })

    return () => {
      draggableRef.current?.forEach(d => d.kill())
      observerRef.current?.kill()
    }
  }, { dependencies: [itemCount, cardWidth, gap, infinite, draggable] })

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        prev()
      }
    }

    const crate = crateRef.current
    if (crate) {
      crate.addEventListener('keydown', handleKeyDown)
      return () => crate.removeEventListener('keydown', handleKeyDown)
    }
  }, [next, prev])

  // Computed values
  const isAtStart = !infinite && activeIndex === 0
  const isAtEnd = !infinite && activeIndex === itemCount - 1
  const progress = itemCount > 1 ? activeIndex / (itemCount - 1) : 0

  return {
    crateRef,
    wrapperRef,
    activeIndex,
    goTo,
    next,
    prev,
    isAnimating,
    isAtStart,
    isAtEnd,
    progress,
  }
}
