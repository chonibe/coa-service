"use client"

import { useState, useEffect, useCallback } from "react"

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  pullDownThreshold?: number
  maxPullDownDistance?: number
}

export function usePullToRefresh({
  onRefresh,
  pullDownThreshold = 80,
  maxPullDownDistance = 120,
}: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState<number | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only enable pull-to-refresh when at the top of the page
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY)
      setIsPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!startY || !isPulling) return

      const currentY = e.touches[0].clientY
      const diff = currentY - startY

      // Only allow pulling down, not up
      if (diff > 0) {
        // Apply resistance as user pulls down further
        const resistance = 0.4
        const newPullDistance = Math.min(diff * resistance, maxPullDownDistance)
        setPullDistance(newPullDistance)

        // Prevent default scrolling behavior when pulling
        if (window.scrollY === 0 && diff > 5) {
          e.preventDefault()
        }
      }
    },
    [startY, isPulling, maxPullDownDistance],
  )

  const handleTouchEnd = useCallback(async () => {
    if (isPulling) {
      // If pulled past threshold, trigger refresh
      if (pullDistance >= pullDownThreshold) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } catch (error) {
          console.error("Refresh failed:", error)
        } finally {
          setIsRefreshing(false)
        }
      }

      // Reset states
      setIsPulling(false)
      setStartY(null)
      setPullDistance(0)
    }
  }, [isPulling, pullDistance, pullDownThreshold, onRefresh])

  useEffect(() => {
    // Add event listeners when component mounts
    document.addEventListener("touchstart", handleTouchStart, { passive: false })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)

    // Remove event listeners when component unmounts
    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / pullDownThreshold, 1),
  }
}
