/**
 * GSAP Configuration
 * 
 * Central configuration for GSAP animations including:
 * - Plugin registration (all now free!)
 * - Custom eases
 * - Global defaults
 * - Reduced motion support
 */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import { Draggable } from 'gsap/Draggable'
import { Observer } from 'gsap/Observer'

// Register all plugins (all free as of 2024!)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, Flip, Draggable, Observer)
}

/**
 * Custom easing curves for vinyl record interactions
 */
export const customEases = {
  // Vinyl card lift - quick start, gentle settle
  vinylLift: 'power2.out',
  
  // Card flip - smooth rotation
  vinylFlip: 'power1.inOut',
  
  // Crate browsing momentum
  crateMomentum: 'power3.out',
  
  // Tilt return to neutral
  tiltReturn: 'elastic.out(1, 0.5)',
  
  // Subtle hover
  softHover: 'power2.out',
  
  // Cart badge pop
  badgePop: 'elastic.out(1.2, 0.4)',
  
  // Drawer slide
  drawerSlide: 'power2.out',
  
  // Stagger reveal
  staggerReveal: 'power2.out',
  
  // Scroll parallax
  parallax: 'none', // Linear for scroll-based
}

/**
 * Animation duration constants (in seconds)
 */
export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.35,
  slow: 0.5,
  glacial: 0.8,
  
  // Specific interactions
  tilt: 0.15,
  flip: 0.6,
  crateFlip: 0.4,
  drawerOpen: 0.4,
  drawerClose: 0.3,
  stagger: 0.05,
  scrollReveal: 0.6,
}

/**
 * Set GSAP defaults
 */
export function initializeGSAP() {
  if (typeof window === 'undefined') return

  // Set global defaults
  gsap.defaults({
    duration: durations.normal,
    ease: customEases.softHover,
  })

  // Configure ScrollTrigger
  ScrollTrigger.config({
    // Reduce motion when user prefers
    autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load,resize',
  })

  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  
  if (prefersReducedMotion.matches) {
    gsap.globalTimeline.timeScale(0)
    ScrollTrigger.defaults({ animation: false })
  }

  // Listen for changes to reduced motion preference
  prefersReducedMotion.addEventListener('change', (e) => {
    if (e.matches) {
      gsap.globalTimeline.timeScale(0)
      ScrollTrigger.defaults({ animation: false })
    } else {
      gsap.globalTimeline.timeScale(1)
      ScrollTrigger.defaults({ animation: true })
    }
  })
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Create responsive matchMedia for GSAP
 */
export function createResponsiveAnimation(
  desktop: () => gsap.core.Timeline | gsap.core.Tween,
  mobile?: () => gsap.core.Timeline | gsap.core.Tween
) {
  if (typeof window === 'undefined') return null

  const mm = gsap.matchMedia()

  mm.add('(min-width: 768px)', desktop)
  
  if (mobile) {
    mm.add('(max-width: 767px)', mobile)
  }

  return mm
}

/**
 * Safe cleanup for GSAP contexts
 */
export function cleanupGSAP(ctx: gsap.Context | null) {
  if (ctx) {
    ctx.revert()
  }
}

/**
 * Kill all ScrollTrigger instances for a specific element
 */
export function killScrollTriggers(element: Element | string) {
  ScrollTrigger.getAll()
    .filter(st => {
      const trigger = st.trigger
      if (typeof element === 'string') {
        return trigger && trigger.matches(element)
      }
      return trigger === element
    })
    .forEach(st => st.kill())
}

// Export GSAP and plugins for convenience
export { gsap, ScrollTrigger, Flip, Draggable, Observer }
