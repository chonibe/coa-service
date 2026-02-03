/**
 * useVinylCard Hook
 * 
 * Manages state and animations for a VinylArtworkCard.
 * Combines 3D tilt, flip, and interactive states.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { gsap, durations, customEases } from '@/lib/animations'
import { useGSAP } from '@gsap/react'

export interface UseVinylCardOptions {
  /** Initial flip state */
  defaultFlipped?: boolean
  /** Whether 3D tilt is enabled */
  tiltEnabled?: boolean
  /** Maximum tilt angle in degrees */
  maxTilt?: number
  /** Flip animation duration */
  flipDuration?: number
  /** Callback when card is flipped */
  onFlip?: (isFlipped: boolean) => void
  /** Callback when card is hovered */
  onHover?: (isHovered: boolean) => void
  /** Callback when card is clicked */
  onClick?: () => void
}

export interface UseVinylCardReturn {
  /** Ref for the card container */
  cardRef: React.RefObject<HTMLDivElement>
  /** Whether the card is flipped to back */
  isFlipped: boolean
  /** Whether the card is being hovered */
  isHovered: boolean
  /** Whether flip animation is in progress */
  isAnimating: boolean
  /** Toggle flip state */
  flip: () => void
  /** Set flip state explicitly */
  setFlipped: (flipped: boolean) => void
  /** Handle mouse enter */
  handleMouseEnter: () => void
  /** Handle mouse leave */
  handleMouseLeave: () => void
  /** Handle click */
  handleClick: (e: React.MouseEvent) => void
}

export function useVinylCard(options: UseVinylCardOptions = {}): UseVinylCardReturn {
  const {
    defaultFlipped = false,
    tiltEnabled = true,
    maxTilt = 15,
    flipDuration = durations.flip,
    onFlip,
    onHover,
    onClick,
  } = options

  const cardRef = useRef<HTMLDivElement>(null)
  const [isFlipped, setIsFlipped] = useState(defaultFlipped)
  const [isHovered, setIsHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Quick-to functions for 3D tilt
  const quickTiltX = useRef<gsap.QuickToFunc | null>(null)
  const quickTiltY = useRef<gsap.QuickToFunc | null>(null)
  const quickScale = useRef<gsap.QuickToFunc | null>(null)
  const quickShadow = useRef<gsap.QuickToFunc | null>(null)

  // Set up GSAP context
  useGSAP(() => {
    if (!cardRef.current || !tiltEnabled) return

    const card = cardRef.current

    // Set perspective
    gsap.set(card, {
      transformPerspective: 1000,
      transformStyle: 'preserve-3d',
    })

    // Create quickTo functions for butter-smooth tilt
    quickTiltX.current = gsap.quickTo(card, 'rotateY', {
      duration: 0.5,
      ease: 'power2.out',
    })
    quickTiltY.current = gsap.quickTo(card, 'rotateX', {
      duration: 0.5,
      ease: 'power2.out',
    })
    quickScale.current = gsap.quickTo(card, 'scale', {
      duration: 0.3,
      ease: 'power2.out',
    })

  }, { dependencies: [tiltEnabled] })

  // Handle mouse move for tilt
  useEffect(() => {
    if (!cardRef.current || !tiltEnabled || isFlipped) return

    const card = cardRef.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      // Calculate offset from center (-1 to 1)
      const offsetX = (e.clientX - centerX) / (rect.width / 2)
      const offsetY = (e.clientY - centerY) / (rect.height / 2)
      
      // Apply tilt
      quickTiltX.current?.(offsetX * maxTilt)
      quickTiltY.current?.(-offsetY * maxTilt)
    }

    card.addEventListener('mousemove', handleMouseMove)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
    }
  }, [tiltEnabled, isFlipped, maxTilt])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    onHover?.(true)
    
    if (!isFlipped && quickScale.current) {
      quickScale.current(1.02)
    }
  }, [isFlipped, onHover])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    onHover?.(false)
    
    // Reset tilt
    quickTiltX.current?.(0)
    quickTiltY.current?.(0)
    quickScale.current?.(1)
  }, [onHover])

  const flip = useCallback(() => {
    if (isAnimating || !cardRef.current) return

    setIsAnimating(true)
    const newFlipped = !isFlipped

    // Reset tilt before flip
    quickTiltX.current?.(0)
    quickTiltY.current?.(0)

    // Animate the flip
    gsap.to(cardRef.current, {
      rotateY: newFlipped ? 180 : 0,
      duration: flipDuration,
      ease: customEases.vinylFlip,
      onComplete: () => {
        setIsFlipped(newFlipped)
        setIsAnimating(false)
        onFlip?.(newFlipped)
      },
    })
  }, [isFlipped, isAnimating, flipDuration, onFlip])

  const setFlipped = useCallback((flipped: boolean) => {
    if (flipped === isFlipped || isAnimating || !cardRef.current) return

    setIsAnimating(true)

    // Reset tilt before flip
    quickTiltX.current?.(0)
    quickTiltY.current?.(0)

    gsap.to(cardRef.current, {
      rotateY: flipped ? 180 : 0,
      duration: flipDuration,
      ease: customEases.vinylFlip,
      onComplete: () => {
        setIsFlipped(flipped)
        setIsAnimating(false)
        onFlip?.(flipped)
      },
    })
  }, [isFlipped, isAnimating, flipDuration, onFlip])

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Prevent navigation when clicking on the card itself
    // (not on child links/buttons)
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button')) {
      return
    }
    
    onClick?.()
    flip()
  }, [onClick, flip])

  return {
    cardRef,
    isFlipped,
    isHovered,
    isAnimating,
    flip,
    setFlipped,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
  }
}
