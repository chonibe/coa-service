import gsap from 'gsap'

/**
 * Apple-style Micro-interactions
 * 
 * Smooth, polished animations using spring physics and elastic easing.
 * All timings and easing curves are inspired by Apple's design language.
 */

// Spring physics easing curves (Apple-style)
export const springEasing = {
  // Gentle spring (default buttons, cards)
  gentle: 'elastic.out(1, 0.75)',
  // Medium spring (hovers, toggles)
  medium: 'elastic.out(1, 0.5)',
  // Strong spring (emphasis, confirmations)
  strong: 'back.out(1.7)',
  // Subtle spring (micro movements)
  subtle: 'power2.out',
}

// Duration constants (in seconds)
export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
}

/**
 * Button Press Animation
 * Apple-style button press with scale and subtle shadow change
 */
export function buttonPress(element: HTMLElement, options: {
  scale?: number
  duration?: number
  onComplete?: () => void
} = {}) {
  const {
    scale = 0.96,
    duration = durations.instant,
    onComplete
  } = options
  
  const tl = gsap.timeline({ onComplete })
  
  // Press down
  tl.to(element, {
    scale,
    duration,
    ease: 'power2.in',
  })
  
  // Release
  tl.to(element, {
    scale: 1,
    duration: durations.normal,
    ease: springEasing.gentle,
  })
  
  return tl
}

/**
 * Magnetic Hover Effect
 * Elements subtly follow the cursor (like Apple's AirPods page)
 */
export function magneticHover(
  element: HTMLElement,
  strength: number = 0.2
): () => void {
  const rect = element.getBoundingClientRect()
  
  const handleMouseMove = (e: MouseEvent) => {
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    
    gsap.to(element, {
      x: x * strength,
      y: y * strength,
      duration: durations.normal,
      ease: 'power2.out',
    })
  }
  
  const handleMouseLeave = () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: durations.slow,
      ease: springEasing.gentle,
    })
  }
  
  element.addEventListener('mousemove', handleMouseMove)
  element.addEventListener('mouseleave', handleMouseLeave)
  
  return () => {
    element.removeEventListener('mousemove', handleMouseMove)
    element.removeEventListener('mouseleave', handleMouseLeave)
  }
}

/**
 * Scale on Hover
 * Gentle scale up with spring physics
 */
export function scaleOnHover(element: HTMLElement, scale: number = 1.05) {
  const handleMouseEnter = () => {
    gsap.to(element, {
      scale,
      duration: durations.normal,
      ease: springEasing.gentle,
    })
  }
  
  const handleMouseLeave = () => {
    gsap.to(element, {
      scale: 1,
      duration: durations.normal,
      ease: springEasing.gentle,
    })
  }
  
  element.addEventListener('mouseenter', handleMouseEnter)
  element.addEventListener('mouseleave', handleMouseLeave)
  
  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter)
    element.removeEventListener('mouseleave', handleMouseLeave)
  }
}

/**
 * Ripple Effect
 * Material-style ripple adapted with spring physics
 */
export function rippleEffect(element: HTMLElement, e: MouseEvent) {
  const rect = element.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2
  
  const ripple = document.createElement('span')
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    pointer-events: none;
    transform: scale(0);
  `
  
  element.appendChild(ripple)
  
  gsap.to(ripple, {
    scale: 2,
    opacity: 0,
    duration: durations.slow,
    ease: 'power2.out',
    onComplete: () => ripple.remove(),
  })
}

/**
 * Pulse Animation
 * Gentle pulse for notifications, badges
 */
export function pulse(element: HTMLElement, options: {
  scale?: number
  repeat?: number
  duration?: number
} = {}) {
  const {
    scale = 1.1,
    repeat = 3,
    duration = durations.normal
  } = options
  
  return gsap.to(element, {
    scale,
    duration,
    repeat,
    yoyo: true,
    ease: springEasing.gentle,
  })
}

/**
 * Shake Animation
 * For errors, validation feedback
 */
export function shake(element: HTMLElement, intensity: number = 10) {
  return gsap.to(element, {
    x: intensity,
    duration: 0.1,
    repeat: 3,
    yoyo: true,
    ease: 'power2.inOut',
    onComplete: () => {
      gsap.set(element, { x: 0 })
    }
  })
}

/**
 * Success Checkmark Animation
 * Smooth checkmark draw with scale
 */
export function successCheckmark(element: SVGPathElement) {
  const length = element.getTotalLength()
  
  // Set up the starting position
  gsap.set(element, {
    strokeDasharray: length,
    strokeDashoffset: length,
  })
  
  const tl = gsap.timeline()
  
  // Draw the checkmark
  tl.to(element, {
    strokeDashoffset: 0,
    duration: durations.slow,
    ease: 'power2.inOut',
  })
  
  // Scale in the parent
  const parent = element.closest('svg')
  if (parent) {
    tl.from(parent, {
      scale: 0,
      duration: durations.normal,
      ease: springEasing.strong,
    }, 0)
  }
  
  return tl
}

/**
 * Stagger Fade In
 * For lists, grids - Apple-style stagger
 */
export function staggerFadeIn(elements: HTMLElement[], options: {
  delay?: number
  stagger?: number
  y?: number
} = {}) {
  const {
    delay = 0,
    stagger = 0.05,
    y = 20
  } = options
  
  return gsap.from(elements, {
    opacity: 0,
    y,
    duration: durations.slow,
    stagger,
    delay,
    ease: springEasing.gentle,
  })
}

/**
 * Smooth Counter Animation
 * For numbers, prices, counts
 */
export function animateCounter(
  element: HTMLElement,
  from: number,
  to: number,
  options: {
    duration?: number
    format?: (value: number) => string
  } = {}
) {
  const {
    duration = durations.slow,
    format = (n) => Math.round(n).toString()
  } = options
  
  const obj = { value: from }
  
  return gsap.to(obj, {
    value: to,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      element.textContent = format(obj.value)
    }
  })
}

/**
 * Smooth Scroll to Element
 * Apple-style smooth scroll with spring easing
 */
export function smoothScrollTo(target: HTMLElement, options: {
  offset?: number
  duration?: number
} = {}) {
  const {
    offset = 0,
    duration = durations.slow
  } = options
  
  const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset
  
  return gsap.to(window, {
    scrollTo: { y: targetPosition, autoKill: true },
    duration,
    ease: 'power2.inOut',
  })
}

/**
 * Loading Shimmer
 * Skeleton loading effect
 */
export function loadingShimmer(element: HTMLElement) {
  const shimmer = document.createElement('div')
  shimmer.style.cssText = `
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.5),
      transparent
    );
    animation: shimmer 2s infinite;
  `
  
  element.style.position = 'relative'
  element.style.overflow = 'hidden'
  element.appendChild(shimmer)
  
  gsap.to(shimmer, {
    left: '100%',
    duration: 1.5,
    repeat: -1,
    ease: 'power1.inOut',
  })
  
  return () => shimmer.remove()
}

/**
 * Cursor States
 * Custom cursor styles for better UX feedback
 */
export const cursorStates = {
  default: 'cursor-auto',
  pointer: 'cursor-pointer',
  grab: 'cursor-grab',
  grabbing: 'cursor-grabbing',
  text: 'cursor-text',
  notAllowed: 'cursor-not-allowed',
  wait: 'cursor-wait',
}

/**
 * Apply cursor state with smooth transition
 */
export function applyCursorState(element: HTMLElement, state: keyof typeof cursorStates) {
  element.classList.remove(...Object.values(cursorStates))
  element.classList.add(cursorStates[state])
}
