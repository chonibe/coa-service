'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Impact Theme Badge
 * 
 * Matches the exact styling from the Shopify Impact theme:
 * - On-sale badge: #f83a3a background, white text
 * - Sold-out badge: #000000 background, white text  
 * - Primary badge: #803cee background, white text
 */

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-body font-semibold',
    'text-xs uppercase tracking-wider',
    'whitespace-nowrap',
  ].join(' '),
  {
    variants: {
      variant: {
        // On-sale badge - red (#f83a3a)
        'on-sale': [
          'bg-[#f83a3a] text-white',
        ].join(' '),
        
        // Sold-out badge - black (#000000)
        'sold-out': [
          'bg-[#000000] text-white',
        ].join(' '),
        
        // Primary badge - purple (#803cee)
        primary: [
          'bg-[#803cee] text-white',
        ].join(' '),
        
        // Secondary badge - yellow (#f0c417)
        secondary: [
          'bg-[#f0c417] text-[#1a1a1a]',
        ].join(' '),
        
        // Success badge - green (#00a341)
        success: [
          'bg-[#00a341] text-white',
        ].join(' '),
        
        // Warning badge - orange (#ffb74a)
        warning: [
          'bg-[#ffb74a] text-[#1a1a1a]',
        ].join(' '),
        
        // Error badge - red (#f83a3a)
        error: [
          'bg-[#f83a3a] text-white',
        ].join(' '),
        
        // Outline badge - transparent with border
        outline: [
          'bg-transparent text-[#1a1a1a]',
          'border border-[#1a1a1a]/20',
        ].join(' '),
        
        // Subdued badge - light gray
        subdued: [
          'bg-[#1a1a1a]/5 text-[#1a1a1a]/80',
        ].join(' '),
        
        // New/limited badge - for special items
        new: [
          'bg-gradient-to-r from-[#2c4bce] to-[#803cee] text-white',
        ].join(' '),
        
        // Low stock badge
        'low-stock': [
          'bg-[#ffb74a]/20 text-[#b27300]',
          'border border-[#ffb74a]/30',
        ].join(' '),
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
      rounded: {
        sm: 'rounded',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      rounded: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Icon to display before the text */
  icon?: React.ReactNode
  /** Whether the badge can be dismissed */
  dismissible?: boolean
  /** Callback when the badge is dismissed */
  onDismiss?: () => void
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      rounded,
      icon,
      dismissible,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, rounded }), className)}
        {...props}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-1 -mr-0.5 hover:opacity-70 transition-opacity"
            aria-label="Dismiss"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 3L3 9M3 3L9 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

/**
 * Product Badge - specifically for product cards
 */
export interface ProductBadgeProps {
  type: 'sale' | 'sold-out' | 'new' | 'limited' | 'low-stock' | 'custom'
  /** Discount percentage for sale badges */
  discount?: number
  /** Custom text for custom badge type */
  text?: string
  className?: string
}

const ProductBadge = React.forwardRef<HTMLSpanElement, ProductBadgeProps>(
  ({ type, discount, text, className }, ref) => {
    const getBadgeContent = () => {
      switch (type) {
        case 'sale':
          return discount ? `-${discount}%` : 'Sale'
        case 'sold-out':
          return 'Sold Out'
        case 'new':
          return 'New'
        case 'limited':
          return 'Limited'
        case 'low-stock':
          return 'Low Stock'
        case 'custom':
          return text || ''
        default:
          return ''
      }
    }
    
    const getVariant = () => {
      switch (type) {
        case 'sale':
          return 'on-sale'
        case 'sold-out':
          return 'sold-out'
        case 'new':
        case 'limited':
          return 'new'
        case 'low-stock':
          return 'low-stock'
        case 'custom':
          return 'primary'
        default:
          return 'primary'
      }
    }
    
    return (
      <Badge
        ref={ref}
        variant={getVariant()}
        size="sm"
        rounded="md"
        className={className}
      >
        {getBadgeContent()}
      </Badge>
    )
  }
)
ProductBadge.displayName = 'ProductBadge'

/**
 * Status Badge - for order/item status
 */
export interface StatusBadgeProps {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  className?: string
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className }, ref) => {
    const getVariant = () => {
      switch (status) {
        case 'pending':
          return 'warning'
        case 'processing':
          return 'primary'
        case 'shipped':
          return 'secondary'
        case 'delivered':
          return 'success'
        case 'cancelled':
        case 'refunded':
          return 'error'
        default:
          return 'subdued'
      }
    }
    
    const getLabel = () => {
      return status.charAt(0).toUpperCase() + status.slice(1)
    }
    
    return (
      <Badge
        ref={ref}
        variant={getVariant()}
        size="sm"
        rounded="full"
        className={className}
      >
        {getLabel()}
      </Badge>
    )
  }
)
StatusBadge.displayName = 'StatusBadge'

export { Badge, ProductBadge, StatusBadge, badgeVariants }
