"use client"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui"

interface LoadingSkeletonProps {
  variant?: "card" | "table" | "list" | "metric" | "chart"
  count?: number
  className?: string
}

/**
 * Content-aware loading skeleton component
 * Provides different skeleton layouts based on content type
 */
export function LoadingSkeleton({ variant = "card", count = 1, className }: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count })

  if (variant === "metric") {
    return (
      <div className={cn("space-y-2", className)}>
        {skeletons.map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Table header */}
        <div className="flex gap-4 border-b pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Table rows */}
        {skeletons.map((_, i) => (
          <div key={i} className="flex gap-4 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-3", className)}>
        {skeletons.map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === "chart") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    )
  }

  // Default card variant
  return (
    <div className={cn("space-y-4", className)}>
      {skeletons.map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      ))}
    </div>
  )
}

