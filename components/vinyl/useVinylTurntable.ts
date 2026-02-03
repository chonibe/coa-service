/**
 * useVinylTurntable Hook
 * 
 * Manages state and animations for the VinylTurntableViewer component.
 * Handles drag-and-drop, zoom, rotation, and FLIP animations.
 * 
 * Features:
 * - Track artwork placement on turntable
 * - GSAP Flip animations for smooth transitions
 * - Zoom and rotation controls
 * - Keyboard shortcuts
 * - Touch gesture support
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { gsap } from '@/lib/animations/gsap-config'
import { useGSAP } from '@gsap/react'

export interface TurntableArtwork {
  id: string
  title: string
  artist: string
  image: string
  sourceElement?: HTMLElement | null
}

export interface UseVinylTurntableOptions {
  /** Enable zoom functionality */
  enableZoom?: boolean
  /** Enable rotation functionality */
  enableRotation?: boolean
  /** Minimum zoom level */
  minZoom?: number
  /** Maximum zoom level */
  maxZoom?: number
  /** Enable keyboard shortcuts */
  enableKeyboard?: boolean
  /** Callback when artwork is placed */
  onPlace?: (artwork: TurntableArtwork) => void
  /** Callback when artwork is removed */
  onRemove?: (artwork: TurntableArtwork) => void
}

export interface UseVinylTurntableReturn {
  /** Currently placed artwork */
  currentArtwork: TurntableArtwork | null
  /** Whether turntable is active (has artwork) */
  isActive: boolean
  /** Current zoom level (1 = 100%) */
  zoom: number
  /** Current rotation in degrees */
  rotation: number
  /** Whether turntable is accepting drops */
  isDropTarget: boolean
  /** Ref for the turntable container */
  turntableRef: React.RefObject<HTMLDivElement>
  /** Ref for the artwork element on turntable */
  artworkRef: React.RefObject<HTMLDivElement>
  /** Place artwork on turntable */
  placeArtwork: (artwork: TurntableArtwork) => void
  /** Remove artwork from turntable */
  removeArtwork: () => void
  /** Set zoom level */
  setZoom: (zoom: number) => void
  /** Zoom in by step */
  zoomIn: () => void
  /** Zoom out by step */
  zoomOut: () => void
  /** Reset zoom to default */
  resetZoom: () => void
  /** Set rotation */
  setRotation: (degrees: number) => void
  /** Rotate clockwise by step */
  rotateClockwise: () => void
  /** Rotate counter-clockwise by step */
  rotateCounterClockwise: () => void
  /** Reset rotation to 0 */
  resetRotation: () => void
  /** Set drop target state */
  setIsDropTarget: (isTarget: boolean) => void
  /** Animate artwork from source to turntable (FLIP) */
  animateIn: (sourceElement: HTMLElement) => void
  /** Animate artwork from turntable back to source (FLIP) */
  animateOut: () => void
}

export function useVinylTurntable(
  options: UseVinylTurntableOptions = {}
): UseVinylTurntableReturn {
  const {
    enableZoom = true,
    enableRotation = true,
    minZoom = 0.5,
    maxZoom = 3,
    enableKeyboard = true,
    onPlace,
    onRemove,
  } = options

  const [currentArtwork, setCurrentArtwork] = useState<TurntableArtwork | null>(null)
  const [zoom, setZoomState] = useState(1)
  const [rotation, setRotationState] = useState(0)
  const [isDropTarget, setIsDropTarget] = useState(false)
  
  const turntableRef = useRef<HTMLDivElement>(null)
  const artworkRef = useRef<HTMLDivElement>(null)
  const sourceElementRef = useRef<HTMLElement | null>(null)

  const isActive = currentArtwork !== null

  // Place artwork on turntable
  const placeArtwork = useCallback((artwork: TurntableArtwork) => {
    setCurrentArtwork(artwork)
    sourceElementRef.current = artwork.sourceElement || null
    onPlace?.(artwork)
  }, [onPlace])

  // Remove artwork from turntable
  const removeArtwork = useCallback(() => {
    if (currentArtwork) {
      onRemove?.(currentArtwork)
    }
    setCurrentArtwork(null)
    setZoomState(1)
    setRotationState(0)
    sourceElementRef.current = null
  }, [currentArtwork, onRemove])

  // Zoom controls
  const setZoom = useCallback((newZoom: number) => {
    if (!enableZoom) return
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom))
    setZoomState(clampedZoom)
    
    if (artworkRef.current) {
      gsap.to(artworkRef.current, {
        scale: clampedZoom,
        duration: 0.3,
        ease: 'power2.out',
      })
    }
  }, [enableZoom, minZoom, maxZoom])

  const zoomIn = useCallback(() => {
    setZoom(zoom + 0.25)
  }, [zoom, setZoom])

  const zoomOut = useCallback(() => {
    setZoom(zoom - 0.25)
  }, [zoom, setZoom])

  const resetZoom = useCallback(() => {
    setZoom(1)
  }, [setZoom])

  // Rotation controls
  const setRotation = useCallback((degrees: number) => {
    if (!enableRotation) return
    const normalizedDegrees = degrees % 360
    setRotationState(normalizedDegrees)
    
    if (artworkRef.current) {
      gsap.to(artworkRef.current, {
        rotation: normalizedDegrees,
        duration: 0.4,
        ease: 'power2.out',
      })
    }
  }, [enableRotation])

  const rotateClockwise = useCallback(() => {
    setRotation(rotation + 90)
  }, [rotation, setRotation])

  const rotateCounterClockwise = useCallback(() => {
    setRotation(rotation - 90)
  }, [rotation, setRotation])

  const resetRotation = useCallback(() => {
    setRotation(0)
  }, [setRotation])

  // FLIP animation: animate artwork from source to turntable
  const animateIn = useCallback((sourceElement: HTMLElement) => {
    if (!turntableRef.current || !artworkRef.current) return
    
    sourceElementRef.current = sourceElement
    
    // Get source position
    const sourceRect = sourceElement.getBoundingClientRect()
    const targetRect = artworkRef.current.getBoundingClientRect()
    
    // Calculate offset
    const deltaX = sourceRect.left - targetRect.left + (sourceRect.width - targetRect.width) / 2
    const deltaY = sourceRect.top - targetRect.top + (sourceRect.height - targetRect.height) / 2
    const deltaScale = sourceRect.width / targetRect.width
    
    // Hide source during animation
    gsap.set(sourceElement, { opacity: 0 })
    
    // Animate from source position to turntable
    gsap.fromTo(
      artworkRef.current,
      {
        x: deltaX,
        y: deltaY,
        scale: deltaScale,
        opacity: 0.8,
      },
      {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: 'power3.out',
      }
    )
  }, [])

  // FLIP animation: animate artwork back to source
  const animateOut = useCallback(() => {
    const sourceElement = sourceElementRef.current
    if (!sourceElement || !artworkRef.current) {
      removeArtwork()
      return
    }
    
    const sourceRect = sourceElement.getBoundingClientRect()
    const currentRect = artworkRef.current.getBoundingClientRect()
    
    const deltaX = sourceRect.left - currentRect.left + (sourceRect.width - currentRect.width) / 2
    const deltaY = sourceRect.top - currentRect.top + (sourceRect.height - currentRect.height) / 2
    const deltaScale = sourceRect.width / currentRect.width
    
    gsap.to(artworkRef.current, {
      x: deltaX,
      y: deltaY,
      scale: deltaScale,
      opacity: 0.8,
      duration: 0.4,
      ease: 'power3.in',
      onComplete: () => {
        // Show source element again
        gsap.set(sourceElement, { opacity: 1 })
        removeArtwork()
      },
    })
  }, [removeArtwork])

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboard || !isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault()
        animateOut()
        return
      }

      // Zoom controls
      if (enableZoom) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault()
          zoomIn()
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault()
          zoomOut()
        } else if (e.key === '0') {
          e.preventDefault()
          resetZoom()
        }
      }

      // Rotation controls
      if (enableRotation) {
        if (e.key === 'ArrowLeft' && e.shiftKey) {
          e.preventDefault()
          rotateCounterClockwise()
        } else if (e.key === 'ArrowRight' && e.shiftKey) {
          e.preventDefault()
          rotateClockwise()
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault()
          resetRotation()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    enableKeyboard, 
    isActive, 
    enableZoom, 
    enableRotation,
    zoomIn, 
    zoomOut, 
    resetZoom,
    rotateClockwise,
    rotateCounterClockwise,
    resetRotation,
    animateOut,
  ])

  // Wheel zoom
  useGSAP(() => {
    if (!enableZoom || !isActive || !turntableRef.current) return

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(zoom + delta)
    }

    const turntable = turntableRef.current
    turntable.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      turntable.removeEventListener('wheel', handleWheel)
    }
  }, { dependencies: [enableZoom, isActive, zoom, setZoom] })

  return {
    currentArtwork,
    isActive,
    zoom,
    rotation,
    isDropTarget,
    turntableRef,
    artworkRef,
    placeArtwork,
    removeArtwork,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setRotation,
    rotateClockwise,
    rotateCounterClockwise,
    resetRotation,
    setIsDropTarget,
    animateIn,
    animateOut,
  }
}
