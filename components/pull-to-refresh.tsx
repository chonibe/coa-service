"use client"

import type React from "react"

import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { Loader2 } from "lucide-react"
import { useMemo } from "react"
import { useMobile } from "@/hooks/use-mobile"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
}

export function PullToRefresh({ onRefresh, children, className = "" }: PullToRefreshProps) {
  const { isPulling, isRefreshing, pullDistance, pullProgress } = usePullToRefresh({
    onRefresh,
  })

  const isMobile = useMobile()

  const indicatorStyle = useMemo(() => {
    if (!isMobile) {
      return {}
    }
    return {
      height: `${pullDistance}px`,
      opacity: Math.min(pullProgress * 1.5, 1),
      transition: !isPulling ? "all 0.2s ease" : "none",
    }
  }, [pullDistance, pullProgress, isPulling, isMobile])

  if (!isMobile) {
    return <>{children}</>
  }

  return (
    <div className={`relative ${className}`}>
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden z-10"
        style={indicatorStyle}
        aria-hidden="true"
      >
        {isRefreshing ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className="h-6 w-6 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: `rotate(${Math.min(pullProgress * 180, 180)}deg)`,
                transition: isPulling ? "none" : "all 0.2s ease",
              }}
            >
              <polyline points="7 13 12 18 17 13"></polyline>
              <polyline points="7 6 12 11 17 6"></polyline>
            </svg>
            <span className="text-xs text-muted-foreground mt-1">
              {pullProgress >= 1 ? "Release to refresh" : "Pull to refresh"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : "none",
          transition: !isPulling ? "all 0.2s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  )
}
