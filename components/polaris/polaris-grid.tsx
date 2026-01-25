'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const gapMap = {
  tight: 'gap-2',
  base: 'gap-4',
  loose: 'gap-6',
} as const

export interface PolarisGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
  gap?: 'base' | 'tight' | 'loose'
  children?: React.ReactNode
}

export function PolarisGrid({
  columns = 1,
  gap = 'base',
  children,
  className,
  ...props
}: PolarisGridProps) {
  const colMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }

  const responsiveClasses =
    typeof columns === 'object' && columns !== null
      ? [
          columns.xs != null && (colMap[columns.xs] ?? `grid-cols-[repeat(${columns.xs},minmax(0,1fr))]`),
          columns.sm != null && `sm:${colMap[columns.sm] ?? `grid-cols-[repeat(${columns.sm},minmax(0,1fr))]`}`,
          columns.md != null && `md:${colMap[columns.md] ?? `grid-cols-[repeat(${columns.md},minmax(0,1fr))]`}`,
          columns.lg != null && `lg:${colMap[columns.lg] ?? `grid-cols-[repeat(${columns.lg},minmax(0,1fr))]`}`,
          columns.xl != null && `xl:${colMap[columns.xl] ?? `grid-cols-[repeat(${columns.xl},minmax(0,1fr))]`}`,
        ]
          .filter(Boolean)
          .join(' ')
      : ''

  const gridClass =
    typeof columns === 'number'
      ? colMap[columns] ?? `grid-cols-[repeat(${columns},minmax(0,1fr))]`
      : responsiveClasses || 'grid-cols-1'

  return (
    <div
      className={cn(
        'grid',
        gridClass,
        gapMap[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
