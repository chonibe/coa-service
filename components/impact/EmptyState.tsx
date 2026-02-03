'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from './Button'

/**
 * Empty State Component
 * 
 * Shows a friendly message when there's no content to display.
 * Follows Impact theme styling with optional icon and action button.
 */

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href: string
  }
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-16', className)}>
      {/* Icon */}
      {icon && (
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f5f5f5] rounded-full mb-6">
          {icon}
        </div>
      )}
      
      {/* Title */}
      <h3 className="font-heading text-xl font-semibold text-[#1a1a1a] mb-2">
        {title}
      </h3>
      
      {/* Description */}
      {description && (
        <p className="text-[#1a1a1a]/60 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      
      {/* Action */}
      {action && (
        <Link href={action.href}>
          <Button variant="primary">
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  )
}

/**
 * Loading State Component
 * 
 * Shows animated skeleton for loading content.
 */

export interface LoadingStateProps {
  rows?: number
  className?: string
}

export function LoadingState({ rows = 3, className }: LoadingStateProps) {
  return (
    <div className={cn('animate-pulse space-y-4', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 bg-[#f5f5f5] rounded w-3/4" />
          <div className="h-4 bg-[#f5f5f5] rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

/**
 * Common Empty State Variants
 */

export function NoArticlesFound() {
  return (
    <EmptyState
      icon={
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M7 7h10M7 12h10M7 17h7" />
        </svg>
      }
      title="No articles found"
      description="We couldn't find any articles matching your criteria. Try adjusting your filters or check back later."
      action={{ label: 'View All Articles', href: '/shop/blog' }}
    />
  )
}

export function NoResultsFound({ searchQuery }: { searchQuery?: string }) {
  return (
    <EmptyState
      icon={
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      }
      title={searchQuery ? `No results for "${searchQuery}"` : 'No results found'}
      description="Try searching with different keywords or browse our collections."
      action={{ label: 'Browse All', href: '/shop' }}
    />
  )
}

export function PageNotFound() {
  return (
    <EmptyState
      icon={
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      }
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
      action={{ label: 'Go Home', href: '/shop' }}
    />
  )
}

export default EmptyState
