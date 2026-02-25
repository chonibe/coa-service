'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// App Shell Content Card
//
// Branded card component with 24px border radius (Impact theme block radius).
// Replaces ad-hoc Card usage in collector and vendor experiences.
// Consistent shadow, hover effects, and spacing.
// ============================================================================

export interface ContentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Padding variant */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Enable hover lift effect */
  hoverable?: boolean
  /** Make the card clickable (shows cursor) */
  clickable?: boolean
  /** Optional header slot */
  header?: React.ReactNode
  /** Optional footer slot */
  footer?: React.ReactNode
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
}

export const ContentCard = React.forwardRef<HTMLDivElement, ContentCardProps>(
  (
    {
      padding = 'md',
      hoverable = false,
      clickable = false,
      header,
      footer,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-impact-block',
          'border border-gray-100',
          'shadow-impact-sm',
          'overflow-hidden',
          hoverable && 'transition-all duration-200 hover:shadow-impact-md hover:-translate-y-0.5',
          clickable && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {header && (
          <div className="border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4">
            {header}
          </div>
        )}
        <div className={paddingMap[padding]}>{children}</div>
        {footer && (
          <div className="border-t border-gray-100 px-4 py-3 sm:px-5 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    )
  }
)

ContentCard.displayName = 'ContentCard'

// ============================================================================
// ContentCardHeader - Consistent card header
// ============================================================================

export interface ContentCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: React.ReactNode
}

export function ContentCardHeader({
  title,
  description,
  action,
  className,
  ...props
}: ContentCardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)} {...props}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-gray-900 font-heading tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5 font-body">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
