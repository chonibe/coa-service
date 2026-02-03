/**
 * Animation Library Index
 * 
 * Central exports for all animation utilities.
 * 
 * @example
 * ```tsx
 * // GSAP hooks and utilities
 * import { use3DTilt, useCardFlip, fadeInUp } from '@/lib/animations'
 * 
 * // Framer Motion variants
 * import { fadeUp, drawerRight, cardHover } from '@/lib/animations'
 * 
 * // GSAP core
 * import { gsap, ScrollTrigger, Flip } from '@/lib/animations'
 * ```
 */

// GSAP configuration and core
export {
  gsap,
  ScrollTrigger,
  Flip,
  Draggable,
  Observer,
  customEases,
  durations,
  initializeGSAP,
  prefersReducedMotion,
  createResponsiveAnimation,
  cleanupGSAP,
  killScrollTriggers,
} from './gsap-config'

// GSAP React hooks
export {
  useGSAP,
  use3DTilt,
  useFlip,
  useDraggable,
  useScrollTrigger,
  useObserver,
  useStagger,
  useCardFlip,
} from './gsap-hooks'

// Export types
export type {
  Use3DTiltOptions,
  UseFlipOptions,
  UseDraggableOptions,
  UseScrollTriggerOptions,
  UseObserverOptions,
  UseStaggerOptions,
} from './gsap-hooks'

// GSAP animation factories
export {
  fadeInUp,
  fadeInScale,
  staggerChildren,
  createParallax,
  createDrawerTimeline,
  badgePop,
  animateCounter,
  shake,
  pulse,
  glowPulse,
  createScrollReveal,
  killScrollReveals,
} from './gsap-utils'

// Export utility types
export type {
  FadeInUpOptions,
  FadeInScaleOptions,
  StaggerChildrenOptions,
  ParallaxOptions,
  DrawerTimelineOptions,
  CounterOptions,
} from './gsap-utils'

// Framer Motion variants
export {
  // Transitions
  transitions,
  
  // Basic variants
  fade,
  fadeUp,
  fadeDown,
  scaleFade,
  
  // Slide variants
  createSlideVariants,
  
  // Drawer variants
  drawerRight,
  drawerLeft,
  drawerBottom,
  backdrop,
  
  // Stagger variants
  createStaggerContainer,
  staggerItem,
  
  // Interactive variants
  cardHover,
  buttonHover,
  
  // Animation variants
  spin,
  pulse as pulseVariant, // Renamed to avoid conflict with GSAP pulse
  
  // Component-specific variants
  toast,
  modal,
  accordion,
  pageTransition,
  listItem,
} from './framer-variants'

// Scroll-aware header hooks
export { useScrollHeader, useCartBadgeAnimation } from './useScrollHeader'
export type { UseScrollHeaderOptions, UseScrollHeaderReturn } from './useScrollHeader'
