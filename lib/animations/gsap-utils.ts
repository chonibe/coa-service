/**
 * GSAP Animation Utilities
 * 
 * Animation factory functions for common patterns:
 * - fadeInUp: Standard reveal animation
 * - staggerChildren: Orchestrated child reveals
 * - parallax: Scroll-based parallax
 * - drawerTimeline: Orchestrated drawer animations
 */

import { gsap, ScrollTrigger, durations, customEases } from './gsap-config'

/**
 * Fade In Up Animation
 * Standard reveal animation for elements entering viewport
 */
export interface FadeInUpOptions {
  y?: number
  duration?: number
  ease?: string
  delay?: number
  stagger?: number | gsap.StaggerVars
}

export function fadeInUp(
  elements: Element | Element[] | string,
  options: FadeInUpOptions = {}
): gsap.core.Tween {
  const {
    y = 30,
    duration = durations.scrollReveal,
    ease = customEases.staggerReveal,
    delay = 0,
    stagger = 0,
  } = options

  return gsap.from(elements, {
    y,
    opacity: 0,
    duration,
    ease,
    delay,
    stagger,
    clearProps: 'transform',
  })
}

/**
 * Fade In Scale Animation
 * For elements that should scale up as they appear
 */
export interface FadeInScaleOptions {
  scale?: number
  duration?: number
  ease?: string
  delay?: number
}

export function fadeInScale(
  elements: Element | Element[] | string,
  options: FadeInScaleOptions = {}
): gsap.core.Tween {
  const {
    scale = 0.9,
    duration = durations.normal,
    ease = customEases.softHover,
    delay = 0,
  } = options

  return gsap.from(elements, {
    scale,
    opacity: 0,
    duration,
    ease,
    delay,
    clearProps: 'transform',
  })
}

/**
 * Stagger Children Animation
 * Reveals children elements in sequence
 */
export interface StaggerChildrenOptions {
  y?: number
  duration?: number
  ease?: string
  staggerAmount?: number
  staggerFrom?: 'start' | 'center' | 'end' | 'edges' | 'random'
}

export function staggerChildren(
  parent: Element | string,
  childSelector: string = '> *',
  options: StaggerChildrenOptions = {}
): gsap.core.Tween {
  const {
    y = 20,
    duration = durations.normal,
    ease = customEases.staggerReveal,
    staggerAmount = 0.3,
    staggerFrom = 'start',
  } = options

  const parentEl = typeof parent === 'string' ? document.querySelector(parent) : parent
  if (!parentEl) return gsap.to({}, {})

  const children = parentEl.querySelectorAll(childSelector)

  return gsap.from(children, {
    y,
    opacity: 0,
    duration,
    ease,
    stagger: {
      amount: staggerAmount,
      from: staggerFrom,
    },
  })
}

/**
 * Parallax Effect
 * Creates scroll-based parallax movement
 */
export interface ParallaxOptions {
  y?: number | string
  speed?: number
  scrub?: number | boolean
  start?: string
  end?: string
}

export function createParallax(
  element: Element | string,
  options: ParallaxOptions = {}
): ScrollTrigger {
  const {
    y = '-20%',
    speed = 1,
    scrub = true,
    start = 'top bottom',
    end = 'bottom top',
  } = options

  const yValue = typeof y === 'number' ? y * speed : y

  const tween = gsap.to(element, {
    y: yValue,
    ease: 'none',
  })

  return ScrollTrigger.create({
    trigger: element,
    animation: tween,
    start,
    end,
    scrub,
  })
}

/**
 * Drawer Timeline
 * Orchestrated animation for drawer open/close
 */
export interface DrawerTimelineOptions {
  direction?: 'left' | 'right' | 'top' | 'bottom'
  duration?: number
  backdropDuration?: number
  itemStagger?: number
}

export function createDrawerTimeline(
  drawer: Element | string,
  backdrop: Element | string,
  items?: Element | Element[] | string,
  options: DrawerTimelineOptions = {}
): gsap.core.Timeline {
  const {
    direction = 'right',
    duration = durations.drawerOpen,
    backdropDuration = durations.fast,
    itemStagger = durations.stagger,
  } = options

  const directionMap = {
    left: { x: '-100%', xTo: '0%' },
    right: { x: '100%', xTo: '0%' },
    top: { y: '-100%', yTo: '0%' },
    bottom: { y: '100%', yTo: '0%' },
  }

  const { x, xTo, y, yTo } = directionMap[direction] as {
    x?: string
    xTo?: string
    y?: string
    yTo?: string
  }

  const tl = gsap.timeline({ paused: true })

  // Backdrop fade
  tl.fromTo(
    backdrop,
    { opacity: 0 },
    { opacity: 1, duration: backdropDuration, ease: 'power2.out' },
    0
  )

  // Drawer slide
  if (x !== undefined) {
    tl.fromTo(
      drawer,
      { x },
      { x: xTo, duration, ease: customEases.drawerSlide },
      0
    )
  } else if (y !== undefined) {
    tl.fromTo(
      drawer,
      { y },
      { y: yTo, duration, ease: customEases.drawerSlide },
      0
    )
  }

  // Items stagger
  if (items) {
    tl.from(
      items,
      {
        opacity: 0,
        x: direction === 'right' ? 20 : direction === 'left' ? -20 : 0,
        y: direction === 'bottom' ? 20 : direction === 'top' ? -20 : 0,
        duration: durations.normal,
        ease: customEases.staggerReveal,
        stagger: itemStagger,
      },
      duration * 0.5
    )
  }

  return tl
}

/**
 * Card Badge Pop
 * Elastic pop animation for cart badges
 */
export function badgePop(element: Element | string): gsap.core.Tween {
  return gsap.from(element, {
    scale: 0,
    duration: durations.normal,
    ease: customEases.badgePop,
  })
}

/**
 * Number Counter Animation
 * Animates a number from one value to another
 */
export interface CounterOptions {
  duration?: number
  ease?: string
  onUpdate?: (value: number) => void
}

export function animateCounter(
  from: number,
  to: number,
  options: CounterOptions = {}
): gsap.core.Tween {
  const {
    duration = durations.slow,
    ease = 'power2.out',
    onUpdate,
  } = options

  const obj = { value: from }

  return gsap.to(obj, {
    value: to,
    duration,
    ease,
    onUpdate: () => onUpdate?.(Math.round(obj.value)),
  })
}

/**
 * Shake Animation
 * For error states or attention-grabbing
 */
export function shake(element: Element | string): gsap.core.Timeline {
  return gsap.timeline()
    .to(element, { x: -10, duration: 0.05 })
    .to(element, { x: 10, duration: 0.05 })
    .to(element, { x: -8, duration: 0.05 })
    .to(element, { x: 8, duration: 0.05 })
    .to(element, { x: -4, duration: 0.05 })
    .to(element, { x: 4, duration: 0.05 })
    .to(element, { x: 0, duration: 0.05 })
}

/**
 * Pulse Animation
 * Subtle attention pulse
 */
export function pulse(element: Element | string, options: { scale?: number } = {}): gsap.core.Tween {
  const { scale = 1.05 } = options
  
  return gsap.to(element, {
    scale,
    duration: durations.fast,
    ease: 'power2.inOut',
    yoyo: true,
    repeat: 1,
  })
}

/**
 * Glow Pulse Animation
 * For locked overlay effects
 */
export function glowPulse(element: Element | string): gsap.core.Tween {
  return gsap.to(element, {
    boxShadow: '0 0 30px rgba(240, 196, 23, 0.5), 0 0 60px rgba(240, 196, 23, 0.3)',
    duration: durations.slow,
    ease: 'power1.inOut',
    yoyo: true,
    repeat: -1,
  })
}

/**
 * Create scroll-triggered reveal for multiple elements
 */
export function createScrollReveal(
  elements: Element[] | NodeListOf<Element> | string,
  options: {
    y?: number
    stagger?: number
    start?: string
    once?: boolean
  } = {}
): ScrollTrigger[] {
  const {
    y = 30,
    stagger = 0.1,
    start = 'top 85%',
    once = true,
  } = options

  const els = typeof elements === 'string' 
    ? document.querySelectorAll(elements) 
    : elements

  const triggers: ScrollTrigger[] = []

  Array.from(els).forEach((el, index) => {
    const tween = gsap.from(el, {
      y,
      opacity: 0,
      duration: durations.scrollReveal,
      ease: customEases.staggerReveal,
      delay: index * stagger,
      paused: true,
    })

    const trigger = ScrollTrigger.create({
      trigger: el,
      start,
      onEnter: () => tween.play(),
      onLeaveBack: once ? undefined : () => tween.reverse(),
      once,
    })

    triggers.push(trigger)
  })

  return triggers
}

/**
 * Kill all scroll reveals
 */
export function killScrollReveals(triggers: ScrollTrigger[]) {
  triggers.forEach(t => t.kill())
}
