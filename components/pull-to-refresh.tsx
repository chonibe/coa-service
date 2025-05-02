"use client"

import type { ReactNode } from "react"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { Loader2 } from "lucide-react"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const { containerRef, isPulling, pullDistance, isRefreshing, refreshIndicatorHeight } = usePullToRefresh({
    onRefresh,
  })

  return (
    <div ref={containerRef} className="relative overflow-hidden h-full">
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center transition-transform duration-200 z-10 bg-background/80 backdrop-blur-sm"
        style={{
          height: `${refreshIndicatorHeight}px`,
          transform:
            isPulling || isRefreshing
              ? `translateY(${isRefreshing ? 0 : -refreshIndicatorHeight + pullDistance}px)`
              : `translateY(-${refreshIndicatorHeight}px)`,
        }}
      >
        {isRefreshing ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className="h-6 w-6 text-primary transition-transform"
              style={{
                transform: `rotate(${Math.min(180, (pullDistance / 80) * 180)}deg)`,
              }}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12" />
              <path d="m8 11 4 4 4-4" />
              <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
            </svg>
            <span className="text-xs mt-1">{pullDistance > 80 ? "Release to refresh" : "Pull down to refresh"}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : "translateY(0)",
          transition: !isPulling ? "transform 0.2s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  )
}
