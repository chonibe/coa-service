/**
 * GSAP React Hooks
 * 
 * Custom hooks for integrating GSAP with React:
 * - useGSAP: Core hook for GSAP contexts
 * - use3DTilt: Mouse-follow 3D tilt effect
 * - useFlip: GSAP Flip animations
 * - useDraggable: Drag interactions with momentum
 * - useScrollTrigger: Scroll-based animations
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useGSAP as useGSAPOriginal } from '@gsap/react'
import { gsap, ScrollTrigger, Flip, Draggable, Observer, durations, customEases } from './gsap-config'

// Re-export the official useGSAP hook
export { useGSAPOriginal as useGSAP }

/**
 * 3D Tilt Effect Hook
 * Creates a buttery smooth mouse-follow tilt effect using gsap.quickTo()
 */
export interface Use3DTiltOptions {
  maxTilt?: number
  perspective?: number
  scale?: number
  speed?: number
  disabled?: boolean
}

export function use3DTilt<T extends HTMLElement = HTMLDivElement>(
  options: Use3DTiltOptions = {}
) {
  const {
    maxTilt = 15,
    perspective = 1000,
    scale = 1.02,
    speed = 0.5,
    disabled = false,
  } = options

  const ref = useRef<T>(null)
  const quickTiltX = useRef<gsap.QuickToFunc | null>(null)
  const quickTiltY = useRef<gsap.QuickToFunc | null>(null)
  const quickScale = useRef<gsap.QuickToFunc | null>(null)

  useGSAPOriginal(() => {
    if (!ref.current || disabled) return

    const element = ref.current

    // Set perspective on parent or element
    gsap.set(element, {
      transformPerspective: perspective,
      transformStyle: 'preserve-3d',
    })

    // Create quickTo functions for 60fps performance
    quickTiltX.current = gsap.quickTo(element, 'rotateY', {
      duration: speed,
      ease: 'power2.out',
    })
    quickTiltY.current = gsap.quickTo(element, 'rotateX', {
      duration: speed,
      ease: 'power2.out',
    })
    quickScale.current = gsap.quickTo(element, 'scale', {
      duration: speed,
      ease: 'power2.out',
    })

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      // Calculate offset from center (-1 to 1)
      const offsetX = (e.clientX - centerX) / (rect.width / 2)
      const offsetY = (e.clientY - centerY) / (rect.height / 2)
      
      // Apply tilt (inverted Y for natural feel)
      quickTiltX.current?.(offsetX * maxTilt)
      quickTiltY.current?.(-offsetY * maxTilt)
    }

    const handleMouseEnter = () => {
      quickScale.current?.(scale)
    }

    const handleMouseLeave = () => {
      quickTiltX.current?.(0)
      quickTiltY.current?.(0)
      quickScale.current?.(1)
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, { dependencies: [disabled, maxTilt, perspective, scale, speed] })

  return ref
}

/**
 * Flip Animation Hook
 * For state-to-state FLIP animations
 */
export interface UseFlipOptions {
  duration?: number
  ease?: string
  absolute?: boolean
  nested?: boolean
  scale?: boolean
  onComplete?: () => void
}

export function useFlip(options: UseFlipOptions = {}) {
  const {
    duration = durations.flip,
    ease = customEases.vinylFlip,
    absolute = false,
    nested = false,
    scale = true,
    onComplete,
  } = options

  const stateRef = useRef<Flip.FlipState | null>(null)

  const captureState = useCallback((elements: Element | Element[] | string) => {
    stateRef.current = Flip.getState(elements, {
      props: 'opacity,backgroundColor',
      simple: true,
      nested,
    })
  }, [nested])

  const animateFlip = useCallback((
    elements?: Element | Element[] | string,
    customOptions?: Partial<UseFlipOptions>
  ) => {
    if (!stateRef.current) return null

    return Flip.from(stateRef.current, {
      targets: elements,
      duration: customOptions?.duration ?? duration,
      ease: customOptions?.ease ?? ease,
      absolute: customOptions?.absolute ?? absolute,
      scale: customOptions?.scale ?? scale,
      onComplete: customOptions?.onComplete ?? onComplete,
    })
  }, [duration, ease, absolute, scale, onComplete])

  return { captureState, animateFlip }
}

/**
 * Draggable Hook
 * For drag interactions with momentum and bounds
 */
export interface UseDraggableOptions {
  type?: 'x' | 'y' | 'x,y' | 'rotation'
  bounds?: Element | string | { minX?: number; maxX?: number; minY?: number; maxY?: number }
  edgeResistance?: number
  inertia?: boolean
  snap?: number | number[] | ((value: number) => number)
  throwResistance?: number
  onDrag?: (x: number, y: number) => void
  onDragStart?: () => void
  onDragEnd?: (x: number, y: number) => void
  onThrowComplete?: () => void
  disabled?: boolean
}

export function useDraggable<T extends HTMLElement = HTMLDivElement>(
  options: UseDraggableOptions = {}
) {
  const {
    type = 'x',
    bounds,
    edgeResistance = 0.65,
    inertia = true,
    snap,
    throwResistance = 500,
    onDrag,
    onDragStart,
    onDragEnd,
    onThrowComplete,
    disabled = false,
  } = options

  const ref = useRef<T>(null)
  const draggableRef = useRef<Draggable[] | null>(null)

  useGSAPOriginal(() => {
    if (!ref.current || disabled) return

    draggableRef.current = Draggable.create(ref.current, {
      type,
      bounds,
      edgeResistance,
      inertia,
      snap: snap ? { x: snap, y: snap } : undefined,
      throwResistance,
      onDrag: function() {
        onDrag?.(this.x, this.y)
      },
      onDragStart: function() {
        onDragStart?.()
      },
      onDragEnd: function() {
        onDragEnd?.(this.x, this.y)
      },
      onThrowComplete: function() {
        onThrowComplete?.()
      },
    })

    return () => {
      draggableRef.current?.forEach(d => d.kill())
    }
  }, { dependencies: [disabled, type, edgeResistance, inertia, throwResistance] })

  const enable = useCallback(() => {
    draggableRef.current?.forEach(d => d.enable())
  }, [])

  const disable = useCallback(() => {
    draggableRef.current?.forEach(d => d.disable())
  }, [])

  return { ref, enable, disable }
}

/**
 * ScrollTrigger Hook
 * For scroll-based animations
 */
export interface UseScrollTriggerOptions {
  trigger?: Element | string
  start?: string | number
  end?: string | number
  scrub?: boolean | number
  pin?: boolean | Element | string
  markers?: boolean
  toggleClass?: string | { targets: string | Element | Element[]; className: string }
  onEnter?: () => void
  onLeave?: () => void
  onEnterBack?: () => void
  onLeaveBack?: () => void
  onToggle?: (self: ScrollTrigger) => void
}

export function useScrollTrigger<T extends HTMLElement = HTMLDivElement>(
  animation: () => gsap.core.Timeline | gsap.core.Tween | null,
  options: UseScrollTriggerOptions = {}
) {
  const ref = useRef<T>(null)

  useGSAPOriginal(() => {
    if (!ref.current) return

    const anim = animation()
    if (!anim) return

    const trigger = ScrollTrigger.create({
      trigger: options.trigger || ref.current,
      animation: anim,
      start: options.start ?? 'top 80%',
      end: options.end ?? 'bottom 20%',
      scrub: options.scrub ?? false,
      pin: options.pin ?? false,
      markers: options.markers ?? false,
      toggleClass: options.toggleClass,
      onEnter: options.onEnter,
      onLeave: options.onLeave,
      onEnterBack: options.onEnterBack,
      onLeaveBack: options.onLeaveBack,
      onToggle: options.onToggle,
    })

    return () => {
      trigger.kill()
    }
  }, { dependencies: [] })

  return ref
}

/**
 * Observer Hook
 * For unified touch/mouse/scroll handling (Instagram-like swipe)
 */
export interface UseObserverOptions {
  type?: string
  target?: Element | Window
  wheelSpeed?: number
  tolerance?: number
  preventDefault?: boolean
  onUp?: (self: Observer) => void
  onDown?: (self: Observer) => void
  onLeft?: (self: Observer) => void
  onRight?: (self: Observer) => void
  onChange?: (self: Observer) => void
  onChangeX?: (self: Observer) => void
  onChangeY?: (self: Observer) => void
  disabled?: boolean
}

export function useObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseObserverOptions = {}
) {
  const {
    type = 'wheel,touch,pointer',
    wheelSpeed = -1,
    tolerance = 10,
    preventDefault = true,
    onUp,
    onDown,
    onLeft,
    onRight,
    onChange,
    onChangeX,
    onChangeY,
    disabled = false,
  } = options

  const ref = useRef<T>(null)
  const observerRef = useRef<Observer | null>(null)

  useGSAPOriginal(() => {
    if (!ref.current || disabled) return

    observerRef.current = Observer.create({
      target: ref.current,
      type,
      wheelSpeed,
      tolerance,
      preventDefault,
      onUp,
      onDown,
      onLeft,
      onRight,
      onChange,
      onChangeX,
      onChangeY,
    })

    return () => {
      observerRef.current?.kill()
    }
  }, { dependencies: [disabled, type, wheelSpeed, tolerance, preventDefault] })

  return ref
}

/**
 * Stagger Animation Hook
 * For orchestrated element reveals
 */
export interface UseStaggerOptions {
  from?: 'start' | 'center' | 'end' | 'edges' | 'random' | number
  amount?: number
  each?: number
  ease?: string
  grid?: [number, number] | 'auto'
  axis?: 'x' | 'y'
}

export function useStagger(options: UseStaggerOptions = {}) {
  const {
    from = 'start',
    amount,
    each = durations.stagger,
    ease = customEases.staggerReveal,
    grid,
    axis,
  } = options

  const createStagger = useCallback(() => {
    const staggerConfig: gsap.StaggerVars = {
      from,
      ease,
    }

    if (amount !== undefined) {
      staggerConfig.amount = amount
    } else {
      staggerConfig.each = each
    }

    if (grid) {
      staggerConfig.grid = grid
    }

    if (axis) {
      staggerConfig.axis = axis
    }

    return staggerConfig
  }, [from, amount, each, ease, grid, axis])

  return { createStagger }
}

/**
 * Card Flip Hook
 * Specifically for vinyl card flip animation (front/back)
 */
export function useCardFlip<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useGSAPOriginal(() => {
    if (!ref.current) return

    const frontEl = ref.current.querySelector('[data-flip-front]')
    const backEl = ref.current.querySelector('[data-flip-back]')

    if (!frontEl || !backEl) return

    // Set initial state
    gsap.set(ref.current, { transformStyle: 'preserve-3d', transformPerspective: 1000 })
    gsap.set(backEl, { rotateY: 180, backfaceVisibility: 'hidden' })
    gsap.set(frontEl, { backfaceVisibility: 'hidden' })

  }, { dependencies: [] })

  const flip = useCallback(() => {
    if (!ref.current) return

    const target = isFlipped ? 0 : 180

    if (timelineRef.current) {
      timelineRef.current.kill()
    }

    timelineRef.current = gsap.timeline()
      .to(ref.current, {
        rotateY: target,
        duration: durations.flip,
        ease: customEases.vinylFlip,
        onComplete: () => setIsFlipped(!isFlipped),
      })

    return timelineRef.current
  }, [isFlipped])

  const flipTo = useCallback((flipped: boolean) => {
    if (!ref.current || flipped === isFlipped) return

    const target = flipped ? 180 : 0

    if (timelineRef.current) {
      timelineRef.current.kill()
    }

    timelineRef.current = gsap.timeline()
      .to(ref.current, {
        rotateY: target,
        duration: durations.flip,
        ease: customEases.vinylFlip,
        onComplete: () => setIsFlipped(flipped),
      })

    return timelineRef.current
  }, [isFlipped])

  return { ref, isFlipped, flip, flipTo }
}
