'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Polaris-styled separator component
 */
export interface PolarisSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}

export function PolarisSeparator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: PolarisSeparatorProps) {
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
}
