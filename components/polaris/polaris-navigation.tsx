'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface PolarisNavigationProps extends React.HTMLAttributes<HTMLElement> {
  location?: string
  children?: React.ReactNode
}

export function PolarisNavigation({
  location,
  children,
  className,
  style,
  ...props
}: PolarisNavigationProps) {
  return (
    <nav
      aria-label={location ?? 'Navigation'}
      className={cn(
        'flex flex-col gap-1 rounded-[var(--p-border-radius-200)] bg-[var(--p-color-bg-surface)] p-2',
        className
      )}
      style={style}
      {...(props as React.HTMLAttributes<HTMLElement>)}
    >
      {children}
    </nav>
  )
}
