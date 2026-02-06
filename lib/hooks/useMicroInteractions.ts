'use client'

import { useEffect, useRef } from 'react'
import { 
  magneticHover,
  scaleOnHover,
  applyCursorState,
  cursorStates
} from '@/lib/animations/micro-interactions'

/**
 * React hooks for Apple-style micro-interactions
 */

/**
 * Use Magnetic Hover
 * Elements subtly follow cursor
 */
export function useMagneticHover<T extends HTMLElement>(strength: number = 0.2) {
  const ref = useRef<T>(null)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const cleanup = magneticHover(element, strength)
    return cleanup
  }, [strength])
  
  return ref
}

/**
 * Use Scale on Hover
 * Gentle scale animation
 */
export function useScaleOnHover<T extends HTMLElement>(scale: number = 1.05) {
  const ref = useRef<T>(null)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const cleanup = scaleOnHover(element, scale)
    return cleanup
  }, [scale])
  
  return ref
}

/**
 * Use Interactive Cursor
 * Apply cursor states on hover
 */
export function useInteractiveCursor<T extends HTMLElement>(
  hoverState: keyof typeof cursorStates = 'pointer',
  defaultState: keyof typeof cursorStates = 'default'
) {
  const ref = useRef<T>(null)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const handleMouseEnter = () => applyCursorState(element, hoverState)
    const handleMouseLeave = () => applyCursorState(element, defaultState)
    
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)
    
    // Set initial state
    applyCursorState(element, defaultState)
    
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [hoverState, defaultState])
  
  return ref
}

/**
 * Use Button Press Animation
 * Automatic press animation on click
 */
export function useButtonPress<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const handleClick = async () => {
      const { buttonPress } = await import('@/lib/animations/micro-interactions')
      buttonPress(element)
    }
    
    element.addEventListener('click', handleClick)
    
    return () => {
      element.removeEventListener('click', handleClick)
    }
  }, [])
  
  return ref
}
