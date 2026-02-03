/**
 * Framer Motion Variants
 * 
 * Standardized Framer Motion variants for React component animations.
 * Use these for AnimatePresence, layout animations, and simple hover states.
 * 
 * For complex animations (3D tilt, scroll-based, drag), use GSAP hooks instead.
 */

import { Variants, Transition } from 'framer-motion'

/**
 * Standard transition presets
 */
export const transitions = {
  fast: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } as Transition,
  normal: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } as Transition,
  slow: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } as Transition,
  spring: { type: 'spring', stiffness: 400, damping: 25 } as Transition,
  softSpring: { type: 'spring', stiffness: 200, damping: 20 } as Transition,
  bouncy: { type: 'spring', stiffness: 500, damping: 15 } as Transition,
}

/**
 * Fade variants
 */
export const fade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transitions.normal },
  exit: { opacity: 0, transition: transitions.fast },
}

/**
 * Fade up variants (for entering content)
 */
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: transitions.normal,
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: transitions.fast,
  },
}

/**
 * Fade down variants
 */
export const fadeDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: transitions.normal,
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: transitions.fast,
  },
}

/**
 * Scale fade variants
 */
export const scaleFade: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: transitions.fast,
  },
}

/**
 * Slide variants (configurable direction)
 */
export function createSlideVariants(
  direction: 'left' | 'right' | 'up' | 'down',
  distance: number = 100
): Variants {
  const directionMap = {
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
    up: { x: 0, y: -distance },
    down: { x: 0, y: distance },
  }

  const { x, y } = directionMap[direction]

  return {
    initial: { opacity: 0, x, y },
    animate: { 
      opacity: 1, 
      x: 0, 
      y: 0,
      transition: transitions.normal,
    },
    exit: { 
      opacity: 0, 
      x: x / 2, 
      y: y / 2,
      transition: transitions.fast,
    },
  }
}

/**
 * Drawer variants
 */
export const drawerRight: Variants = {
  initial: { x: '100%' },
  animate: { 
    x: 0,
    transition: { ...transitions.normal, duration: 0.4 },
  },
  exit: { 
    x: '100%',
    transition: { ...transitions.fast, duration: 0.3 },
  },
}

export const drawerLeft: Variants = {
  initial: { x: '-100%' },
  animate: { 
    x: 0,
    transition: { ...transitions.normal, duration: 0.4 },
  },
  exit: { 
    x: '-100%',
    transition: { ...transitions.fast, duration: 0.3 },
  },
}

export const drawerBottom: Variants = {
  initial: { y: '100%' },
  animate: { 
    y: 0,
    transition: { ...transitions.normal, duration: 0.4 },
  },
  exit: { 
    y: '100%',
    transition: { ...transitions.fast, duration: 0.3 },
  },
}

/**
 * Backdrop variants
 */
export const backdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transitions.fast },
  exit: { opacity: 0, transition: transitions.fast },
}

/**
 * Stagger container variants
 * Use with children that have staggerItem variants
 */
export function createStaggerContainer(
  staggerDelay: number = 0.05,
  delayChildren: number = 0
): Variants {
  return {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
    exit: {
      transition: {
        staggerChildren: staggerDelay / 2,
        staggerDirection: -1,
      },
    },
  }
}

/**
 * Stagger item variants (for use with stagger container)
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: transitions.normal,
  },
  exit: { 
    opacity: 0,
    transition: transitions.fast,
  },
}

/**
 * Card hover variants
 */
export const cardHover: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: transitions.spring,
  },
  tap: { 
    scale: 0.98,
    transition: transitions.fast,
  },
}

/**
 * Button hover variants
 */
export const buttonHover: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: transitions.spring,
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 },
  },
}

/**
 * Icon spin variants (for loading states)
 */
export const spin: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: 'linear',
    },
  },
}

/**
 * Pulse variants (for attention)
 */
export const pulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      repeat: Infinity,
      repeatDelay: 1,
      duration: 0.5,
    },
  },
}

/**
 * Toast variants
 */
export const toast: Variants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: 20,
    transition: transitions.fast,
  },
}

/**
 * Modal variants
 */
export const modal: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: transitions.fast,
  },
}

/**
 * Accordion content variants
 */
export const accordion: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { 
    height: 'auto', 
    opacity: 1,
    transition: { 
      height: transitions.normal,
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
  exit: { 
    height: 0, 
    opacity: 0,
    transition: {
      height: transitions.fast,
      opacity: { duration: 0.1 },
    },
  },
}

/**
 * Page transition variants
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
  },
}

/**
 * List item reorder variants (for drag-and-drop)
 */
export const listItem: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: transitions.fast,
  },
}
