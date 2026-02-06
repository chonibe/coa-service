/**
 * Text Animation Utilities
 * 
 * Utilities for splitting text and creating kinetic typography effects.
 * Works with GSAP for high-performance text animations.
 * 
 * @example
 * ```tsx
 * const spans = splitTextIntoSpans('Hello World', { type: 'words' })
 * gsap.from(spans, { opacity: 0, y: 20, stagger: 0.1 })
 * ```
 */

export type SplitType = 'chars' | 'words' | 'lines'

export interface SplitTextOptions {
  /** Type of split: characters, words, or lines */
  type?: SplitType
  /** CSS class to add to each span */
  className?: string
  /** Preserve white space between elements */
  preserveSpaces?: boolean
}

export interface AnimateTextOptions {
  /** Stagger delay between elements (seconds) */
  stagger?: number
  /** Animation duration (seconds) */
  duration?: number
  /** GSAP easing function */
  ease?: string
  /** Delay before animation starts */
  delay?: number
  /** Starting Y position */
  y?: number
  /** Starting opacity */
  opacity?: number
}

/**
 * Split text into spans for individual animation
 * 
 * @param text - Text to split
 * @param options - Split options
 * @returns Array of span elements
 */
export function splitTextIntoSpans(
  text: string,
  options: SplitTextOptions = {}
): HTMLSpanElement[] {
  const { type = 'words', className = '', preserveSpaces = true } = options

  let parts: string[] = []

  switch (type) {
    case 'chars':
      parts = text.split('')
      break
    case 'words':
      parts = text.split(/\s+/)
      break
    case 'lines':
      parts = text.split('\n')
      break
  }

  return parts.map((part, index) => {
    const span = document.createElement('span')
    span.textContent = part
    
    if (className) {
      span.className = className
    }

    // Add inline styles for animation
    span.style.display = 'inline-block'
    span.style.whiteSpace = type === 'lines' ? 'pre-wrap' : 'nowrap'

    // Preserve spaces between words
    if (type === 'words' && preserveSpaces && index < parts.length - 1) {
      span.style.marginRight = '0.25em'
    }

    return span
  })
}

/**
 * Wrap text content in spans for animation (DOM mutation)
 * 
 * @param element - Element containing text to split
 * @param options - Split options
 * @returns Array of created span elements
 */
export function wrapTextInSpans(
  element: HTMLElement,
  options: SplitTextOptions = {}
): HTMLSpanElement[] {
  const text = element.textContent || ''
  const spans = splitTextIntoSpans(text, options)

  // Clear original content
  element.textContent = ''

  // Append spans
  spans.forEach(span => element.appendChild(span))

  return spans
}

/**
 * Create a split text animation preset
 * 
 * @param spans - Array of span elements to animate
 * @param options - Animation options
 * @returns GSAP animation vars object
 */
export function createTextRevealAnimation(
  options: AnimateTextOptions = {}
): gsap.TweenVars {
  const {
    stagger = 0.05,
    duration = 0.6,
    ease = 'power2.out',
    delay = 0,
    y = 30,
    opacity = 0,
  } = options

  return {
    y,
    opacity,
    duration,
    ease,
    delay,
    stagger: {
      amount: stagger * 10, // Adjust based on typical element count
      from: 'start',
    },
  }
}

/**
 * Fade-up reveal animation preset
 */
export const fadeUpReveal: AnimateTextOptions = {
  y: 30,
  opacity: 0,
  duration: 0.8,
  ease: 'power2.out',
  stagger: 0.05,
}

/**
 * Scale reveal animation preset
 */
export const scaleReveal: AnimateTextOptions = {
  y: 0,
  opacity: 0,
  duration: 0.6,
  ease: 'back.out(1.7)',
  stagger: 0.03,
}

/**
 * Blur reveal animation preset (requires CSS filter)
 */
export const blurReveal: AnimateTextOptions = {
  opacity: 0,
  duration: 0.7,
  ease: 'power2.out',
  stagger: 0.04,
}

/**
 * Wave reveal animation preset
 */
export const waveReveal: AnimateTextOptions = {
  y: 40,
  opacity: 0,
  duration: 0.5,
  ease: 'power1.out',
  stagger: 0.02,
}

/**
 * Utility: Get lines from wrapped text (after wrapping)
 * Groups spans by their offsetTop position
 */
export function groupSpansByLines(spans: HTMLSpanElement[]): HTMLSpanElement[][] {
  const lines: HTMLSpanElement[][] = []
  let currentLine: HTMLSpanElement[] = []
  let currentTop: number | null = null

  spans.forEach((span) => {
    const top = span.offsetTop

    if (currentTop === null) {
      currentTop = top
    }

    if (Math.abs(top - currentTop) > 5) {
      // New line detected (5px threshold for rounding errors)
      if (currentLine.length > 0) {
        lines.push(currentLine)
      }
      currentLine = [span]
      currentTop = top
    } else {
      currentLine.push(span)
    }
  })

  // Push last line
  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  return lines
}

/**
 * Cleanup: Remove split spans and restore original text
 */
export function cleanupSplitText(element: HTMLElement, originalText: string) {
  element.textContent = originalText
}

/**
 * Type guard for checking if element has been split
 */
export function isTextSplit(element: HTMLElement): boolean {
  return (
    element.children.length > 0 &&
    Array.from(element.children).every(child => child.tagName === 'SPAN')
  )
}
