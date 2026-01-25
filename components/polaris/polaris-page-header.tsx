'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  actions,
  children,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
        className
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold font-[var(--font-fraunces),serif] tracking-tight text-[var(--p-color-text)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--p-color-text-secondary)]">
            {description}
          </p>
        )}
        {children}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
