'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button-variants'

/**
 * Impact Theme Button
 *
 * Matches the exact styling from the Shopify Impact theme:
 * - Primary: #047AFF background, white text, 60px border radius
 * - Secondary: #f0c417 background, #1a1a1a text
 * - Button hover effect: fade to 85% opacity
 */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // When asChild is true, Slot requires exactly one child. We must not add
    // loading spinner, leftIcon, or rightIcon. If we have multiple/invalid
    // children, fall back to a regular button to avoid React.Children.only error.
    const arr = React.Children.toArray(children)
    const hasSingleValidChild = arr.length === 1 && React.isValidElement(arr[0])
    const useSlot = Boolean(asChild && hasSingleValidChild)

    const Comp = useSlot ? Slot : 'button'
    const slotContent = useSlot ? (
      arr[0]
    ) : (
      <>
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-1">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-1">{rightIcon}</span>}
      </>
    )
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {slotContent}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button }
