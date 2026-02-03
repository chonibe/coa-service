'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Impact Theme Button
 * 
 * Matches the exact styling from the Shopify Impact theme:
 * - Primary: #2c4bce background, white text, 60px border radius
 * - Secondary: #f0c417 background, #1a1a1a text
 * - Button hover effect: fade to 85% opacity
 */

const buttonVariants = cva(
  // Base styles matching Impact theme
  [
    'inline-flex items-center justify-center gap-2',
    'font-body font-semibold',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        // Primary button - #2c4bce with white text
        primary: [
          'bg-[#2c4bce] text-white',
          'rounded-[60px]', // Impact theme button border radius
          'hover:opacity-[0.85]', // Impact theme fade hover effect
          'focus-visible:ring-[#2c4bce]',
          'shadow-impact-sm hover:shadow-impact-md',
        ].join(' '),
        
        // Secondary button - #f0c417 with #1a1a1a text
        secondary: [
          'bg-[#f0c417] text-[#1a1a1a]',
          'rounded-[60px]',
          'hover:opacity-[0.85]',
          'focus-visible:ring-[#f0c417]',
          'shadow-impact-sm hover:shadow-impact-md',
        ].join(' '),
        
        // Outline button - transparent with border
        outline: [
          'bg-transparent text-[#1a1a1a]',
          'rounded-[60px]',
          'border-2 border-current',
          'hover:bg-[#1a1a1a] hover:text-white',
          'focus-visible:ring-[#1a1a1a]',
        ].join(' '),
        
        // Outline primary - for dark backgrounds
        'outline-primary': [
          'bg-transparent text-[#2c4bce]',
          'rounded-[60px]',
          'border-2 border-[#2c4bce]',
          'hover:bg-[#2c4bce] hover:text-white',
          'focus-visible:ring-[#2c4bce]',
        ].join(' '),
        
        // Ghost button - minimal styling
        ghost: [
          'bg-transparent text-[#1a1a1a]',
          'rounded-[60px]',
          'hover:bg-[#1a1a1a]/5',
          'focus-visible:ring-[#1a1a1a]',
        ].join(' '),
        
        // Link style - underline on hover
        link: [
          'bg-transparent text-[#2c4bce]',
          'underline-offset-4',
          'hover:underline',
          'focus-visible:ring-[#2c4bce]',
        ].join(' '),
        
        // Subdued button for secondary actions
        subdued: [
          'bg-[#1a1a1a]/5 text-[#1a1a1a]',
          'rounded-[60px]',
          'hover:bg-[#1a1a1a]/10',
          'focus-visible:ring-[#1a1a1a]',
        ].join(' '),
        
        // Header button - for use on dark header background
        header: [
          'bg-transparent text-[#ffba94]',
          'rounded-[60px]',
          'border-2 border-[#ffba94]',
          'hover:bg-[#ffba94] hover:text-[#390000]',
          'focus-visible:ring-[#ffba94]',
        ].join(' '),
        
        // Success button
        success: [
          'bg-[#00a341] text-white',
          'rounded-[60px]',
          'hover:opacity-[0.85]',
          'focus-visible:ring-[#00a341]',
          'shadow-impact-sm hover:shadow-impact-md',
        ].join(' '),
        
        // Destructive/error button
        destructive: [
          'bg-[#f83a3a] text-white',
          'rounded-[60px]',
          'hover:opacity-[0.85]',
          'focus-visible:ring-[#f83a3a]',
          'shadow-impact-sm hover:shadow-impact-md',
        ].join(' '),
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
        xl: 'h-16 px-10 text-xl',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
)

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
    const Comp = asChild ? Slot : 'button'
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
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
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
