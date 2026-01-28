"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { useIsMobile } from "./use-is-mobile"

/**
 * Canvas gesture hook for the slide editor
 * 
 * Handles both touch gestures (mobile) and mouse fallback (desktop dev mode):
 * - Drag: touch drag / mouse drag
 * - Pinch to resize: two-finger pinch / scroll wheel
 * - Two-finger rotate: rotation gesture / shift+drag
 * 
 * Note: This is a coordination hook - actual Konva gestures are handled by react-konva
 * This hook provides unified gesture state and handlers
 */

export interface GestureState {
  /** Is currently dragging */
  isDragging: boolean
  /** Is currently pinching/scaling */
  isPinching: boolean
  /** Is currently rotating */
  isRotating: boolean
  /** Current gesture position (center point) */
  position: { x: number; y: number }
  /** Current scale factor (1.0 = no change) */
  scale: number
  /** Current rotation delta in degrees */
  rotation: number
}

export interface UseCanvasGesturesOptions {
  /** Callback when drag starts */
  onDragStart?: (position: { x: number; y: number }) => void
  /** Callback during drag */
  onDrag?: (position: { x: number; y: number }, delta: { x: number; y: number }) => void
  /** Callback when drag ends */
  onDragEnd?: () => void
  /** Callback when pinch/scale changes */
  onScale?: (scale: number, center: { x: number; y: number }) => void
  /** Callback when rotation changes */
  onRotate?: (degrees: number, center: { x: number; y: number }) => void
  /** Minimum scale allowed */
  minScale?: number
  /** Maximum scale allowed */
  maxScale?: number
}

export interface UseCanvasGesturesResult {
  /** Current gesture state */
  state: GestureState
  /** Bind these handlers to your element */
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: (e: React.MouseEvent) => void
    onWheel: (e: React.WheelEvent) => void
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
  }
  /** Reset gesture state */
  reset: () => void
}

const initialState: GestureState = {
  isDragging: false,
  isPinching: false,
  isRotating: false,
  position: { x: 0, y: 0 },
  scale: 1,
  rotation: 0,
}

export function useCanvasGestures(
  options: UseCanvasGesturesOptions = {}
): UseCanvasGesturesResult {
  const {
    onDragStart,
    onDrag,
    onDragEnd,
    onScale,
    onRotate,
    minScale = 0.1,
    maxScale = 5,
  } = options

  const { isMobile, hasTouch, isDevBypass } = useIsMobile()
  const [state, setState] = useState<GestureState>(initialState)
  
  // Track previous touch positions for gesture calculation
  const touchRef = useRef<{
    startPos: { x: number; y: number }
    lastPos: { x: number; y: number }
    initialDistance: number
    initialAngle: number
    touchCount: number
  }>({
    startPos: { x: 0, y: 0 },
    lastPos: { x: 0, y: 0 },
    initialDistance: 0,
    initialAngle: 0,
    touchCount: 0,
  })

  // Mouse state for desktop fallback
  const mouseRef = useRef<{
    isDown: boolean
    startPos: { x: number; y: number }
    lastPos: { x: number; y: number }
    shiftKey: boolean
  }>({
    isDown: false,
    startPos: { x: 0, y: 0 },
    lastPos: { x: 0, y: 0 },
    shiftKey: false,
  })

  const reset = useCallback(() => {
    setState(initialState)
    touchRef.current = {
      startPos: { x: 0, y: 0 },
      lastPos: { x: 0, y: 0 },
      initialDistance: 0,
      initialAngle: 0,
      touchCount: 0,
    }
    mouseRef.current = {
      isDown: false,
      startPos: { x: 0, y: 0 },
      lastPos: { x: 0, y: 0 },
      shiftKey: false,
    }
  }, [])

  // ==========================================
  // Touch handlers (mobile)
  // ==========================================

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touches = e.touches
    touchRef.current.touchCount = touches.length

    if (touches.length === 1) {
      // Single touch - drag
      const pos = { x: touches[0].clientX, y: touches[0].clientY }
      touchRef.current.startPos = pos
      touchRef.current.lastPos = pos
      setState(s => ({ ...s, isDragging: true, position: pos }))
      onDragStart?.(pos)
    } else if (touches.length === 2) {
      // Two touches - pinch/rotate
      const dx = touches[1].clientX - touches[0].clientX
      const dy = touches[1].clientY - touches[0].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)
      const center = {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      }

      touchRef.current.initialDistance = distance
      touchRef.current.initialAngle = angle
      touchRef.current.lastPos = center

      setState(s => ({
        ...s,
        isDragging: false,
        isPinching: true,
        isRotating: true,
        position: center,
      }))
    }
  }, [onDragStart])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touches = e.touches

    if (touches.length === 1 && touchRef.current.touchCount === 1) {
      // Drag
      const pos = { x: touches[0].clientX, y: touches[0].clientY }
      const delta = {
        x: pos.x - touchRef.current.lastPos.x,
        y: pos.y - touchRef.current.lastPos.y,
      }
      touchRef.current.lastPos = pos
      setState(s => ({ ...s, position: pos }))
      onDrag?.(pos, delta)
    } else if (touches.length === 2) {
      // Pinch/rotate
      const dx = touches[1].clientX - touches[0].clientX
      const dy = touches[1].clientY - touches[0].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)
      const center = {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      }

      // Calculate scale
      if (touchRef.current.initialDistance > 0) {
        const scale = distance / touchRef.current.initialDistance
        const clampedScale = Math.max(minScale, Math.min(maxScale, scale))
        setState(s => ({ ...s, scale: clampedScale, position: center }))
        onScale?.(clampedScale, center)
      }

      // Calculate rotation
      const rotationDelta = angle - touchRef.current.initialAngle
      setState(s => ({ ...s, rotation: rotationDelta, position: center }))
      onRotate?.(rotationDelta, center)
    }
  }, [onDrag, onScale, onRotate, minScale, maxScale])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setState(s => ({
        ...s,
        isDragging: false,
        isPinching: false,
        isRotating: false,
      }))
      onDragEnd?.()
      touchRef.current.touchCount = 0
    }
  }, [onDragEnd])

  // ==========================================
  // Mouse handlers (desktop dev fallback)
  // ==========================================

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (hasTouch && !isDevBypass) return // Use touch on touch devices

    const pos = { x: e.clientX, y: e.clientY }
    mouseRef.current = {
      isDown: true,
      startPos: pos,
      lastPos: pos,
      shiftKey: e.shiftKey,
    }

    if (e.shiftKey) {
      // Shift+drag = rotate
      setState(s => ({ ...s, isRotating: true, position: pos }))
    } else {
      // Normal drag
      setState(s => ({ ...s, isDragging: true, position: pos }))
      onDragStart?.(pos)
    }
  }, [hasTouch, isDevBypass, onDragStart])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mouseRef.current.isDown) return

    const pos = { x: e.clientX, y: e.clientY }
    const delta = {
      x: pos.x - mouseRef.current.lastPos.x,
      y: pos.y - mouseRef.current.lastPos.y,
    }
    mouseRef.current.lastPos = pos

    if (mouseRef.current.shiftKey) {
      // Rotation (horizontal movement = rotation)
      const rotation = delta.x * 0.5 // 0.5 degrees per pixel
      setState(s => ({
        ...s,
        rotation: s.rotation + rotation,
        position: pos,
      }))
      onRotate?.(state.rotation + rotation, pos)
    } else {
      // Drag
      setState(s => ({ ...s, position: pos }))
      onDrag?.(pos, delta)
    }
  }, [onDrag, onRotate, state.rotation])

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    mouseRef.current.isDown = false
    setState(s => ({
      ...s,
      isDragging: false,
      isRotating: false,
    }))
    onDragEnd?.()
  }, [onDragEnd])

  // Scroll wheel = scale (desktop)
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (hasTouch && !isDevBypass) return

    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1 // Zoom out/in
    const newScale = Math.max(minScale, Math.min(maxScale, state.scale * delta))
    const center = { x: e.clientX, y: e.clientY }

    setState(s => ({ ...s, scale: newScale }))
    onScale?.(newScale, center)
  }, [hasTouch, isDevBypass, state.scale, minScale, maxScale, onScale])

  return {
    state,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onWheel,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    reset,
  }
}

export default useCanvasGestures
