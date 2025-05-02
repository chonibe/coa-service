"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>
  pullDownThreshold?: number
  maxPullDownDistance?: number
  refreshIndicatorHeight?: number
}

export function usePullToRefresh({
  onRefresh,
  pullDownThreshold = 80,
  maxPullDownDistance = 120,
  refreshIndicatorHeight = 60,
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number | null>(null)
  const isMounted = useRef(true)

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only enable pull-to-refresh when at the top of the page
    if (window.scrollY > 0) return

    // Store the initial touch position
    startYRef.current = e.touches[0].clientY
    setIsPulling(true)
  }, [])

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!startYRef.current || isRefreshing || window.scrollY > 0) return

      const currentY = e.touches[0].clientY
      const diff = currentY - startYRef.current

      // Only allow pulling down, not up
      if (diff > 0) {
        // Calculate pull distance with resistance (gets harder to pull the further you go)
        const newDistance = Math.min(maxPullDownDistance, diff * 0.5)
        setPullDistance(newDistance)

        // Prevent default scrolling behavior when pulling
        if (diff > 5) {
          e.preventDefault()
        }
      }
    },
    [isRefreshing, maxPullDownDistance],
  )

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!startYRef.current || isRefreshing) return

    // If pulled past threshold, trigger refresh
    if (pullDistance > pullDownThreshold) {
      setIsRefreshing(true)

      try {
        await onRefresh()
      } catch (error) {
        console.error("Refresh failed:", error)
      }

      // Only update state if component is still mounted
      if (isMounted.current) {
        setIsRefreshing(false)
      }
    }

    // Reset
    startYRef.current = null
    setPullDistance(0)
    setIsPulling(false)
  }, [pullDistance, pullDownThreshold, isRefreshing, onRefresh])

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("touchstart", handleTouchStart, { passive: false })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      isMounted.current = false
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    refreshIndicatorHeight,
  }
}
