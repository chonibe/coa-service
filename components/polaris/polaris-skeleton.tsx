'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Polaris-styled skeleton loader component
 */
export interface PolarisSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function PolarisSkeleton({ className, ...props }: PolarisSkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}
