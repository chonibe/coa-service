'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface PolarisLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  sectioned?: boolean
  children?: React.ReactNode
}

export function PolarisLayout({
  sectioned = false,
  children,
  className,
  style,
  ...props
}: PolarisLayoutProps) {
  return (
    <div
      className={cn(
        'flex flex-col',
        sectioned && 'gap-6 divide-y divide-[var(--p-color-border)] [&>*:first-child]:pt-0 [&>*]:pt-6',
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
}

export interface PolarisLayoutSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'oneHalf' | 'oneThird' | 'fullWidth'
  children?: React.ReactNode
}

const variantMap = {
  oneHalf: 'md:w-1/2',
  oneThird: 'md:w-1/3',
  fullWidth: 'w-full',
} as const

export function PolarisLayoutSection({
  variant = 'fullWidth',
  children,
  className,
  style,
  ...props
}: PolarisLayoutSectionProps) {
  return (
    <div
      className={cn('w-full', variantMap[variant], className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
}
