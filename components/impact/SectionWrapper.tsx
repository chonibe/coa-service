'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Impact Theme Section Wrapper
 * 
 * Matches the exact section spacing from the Shopify Impact theme:
 * - Mobile: py-12 (48px)
 * - Tablet (700px+): py-16 (64px)
 * - Desktop (1000px+): py-[4.5rem] (72px)
 * - Large (1400px+): py-24 (96px)
 * 
 * Spacing setting: 'medium'
 */

const sectionVariants = cva(
  [
    'relative',
    'w-full',
  ].join(' '),
  {
    variants: {
      // Vertical spacing (py)
      spacing: {
        none: '',
        xs: 'py-6 sm:py-8 md:py-10 xl:py-12',
        sm: 'py-8 sm:py-10 md:py-12 xl:py-14',
        md: 'py-12 sm:py-16 md:py-[4.5rem] xl:py-24', // Default Impact theme 'medium'
        lg: 'py-16 sm:py-20 md:py-24 xl:py-28',
        xl: 'py-20 sm:py-24 md:py-28 xl:py-32',
      },
      // Horizontal padding
      paddingX: {
        none: '',
        gutter: 'px-5 sm:px-8 lg:px-12', // Container gutter
        full: '', // Full bleed - no horizontal padding
      },
      // Background color
      background: {
        default: 'bg-white',
        muted: 'bg-[#f5f5f5]',
        dark: 'bg-[#1a1a1a] text-white',
        header: 'bg-[#390000] text-[#ffba94]',
        primary: 'bg-[#2c4bce] text-white',
        secondary: 'bg-[#f0c417] text-[#1a1a1a]',
        transparent: 'bg-transparent',
        gradient: 'bg-gradient-to-b from-white to-[#f5f5f5]',
      },
      // Container constraint
      container: {
        none: '',
        default: '', // Will apply via child Container component
        narrow: '',
        full: '',
      },
      // Overflow handling
      overflow: {
        visible: 'overflow-visible',
        hidden: 'overflow-hidden',
        clip: 'overflow-clip',
      },
    },
    defaultVariants: {
      spacing: 'md',
      paddingX: 'gutter',
      background: 'default',
      container: 'none',
      overflow: 'visible',
    },
  }
)

export interface SectionWrapperProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  as?: 'section' | 'div' | 'article' | 'aside'
  /** Apply full-width background while constraining content */
  fullWidth?: boolean
  /** ID for anchor links */
  anchorId?: string
}

const SectionWrapper = React.forwardRef<HTMLElement, SectionWrapperProps>(
  (
    {
      className,
      spacing,
      paddingX,
      background,
      container,
      overflow,
      as: Component = 'section',
      fullWidth,
      anchorId,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref as React.Ref<HTMLElement>}
        id={anchorId}
        className={cn(
          sectionVariants({
            spacing,
            paddingX: fullWidth ? 'none' : paddingX,
            background,
            container,
            overflow,
          }),
          className
        )}
        {...props}
      >
        {fullWidth ? (
          <div className="px-5 sm:px-8 lg:px-12">
            {children}
          </div>
        ) : (
          children
        )}
      </Component>
    )
  }
)
SectionWrapper.displayName = 'SectionWrapper'

/**
 * Section Header - title and subtitle for sections
 */
export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  alignment?: 'left' | 'center' | 'right'
  titleSize?: 'sm' | 'md' | 'lg' | 'xl'
  action?: React.ReactNode
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  (
    {
      className,
      title,
      subtitle,
      alignment = 'center',
      titleSize = 'lg',
      action,
      ...props
    },
    ref
  ) => {
    const alignmentClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }
    
    const titleSizeClasses = {
      sm: 'text-impact-h4 xl:text-impact-h4-lg',
      md: 'text-impact-h3 xl:text-impact-h3-lg',
      lg: 'text-impact-h2 xl:text-impact-h2-lg',
      xl: 'text-impact-h1 xl:text-impact-h1-lg',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'mb-8 sm:mb-10 md:mb-12',
          alignmentClasses[alignment],
          className
        )}
        {...props}
      >
        <div className={cn(
          'flex gap-4',
          alignment === 'center' && 'flex-col items-center',
          alignment === 'left' && 'flex-col items-start sm:flex-row sm:items-end sm:justify-between',
          alignment === 'right' && 'flex-col items-end sm:flex-row-reverse sm:items-end sm:justify-between',
        )}>
          <div>
            <h2 className={cn(
              'font-heading font-semibold text-[#1a1a1a] tracking-[-0.02em]',
              titleSizeClasses[titleSize]
            )}>
              {title}
            </h2>
            {subtitle && (
              <p className={cn(
                'mt-3 text-base sm:text-lg text-[#1a1a1a]/60 max-w-2xl',
                alignment === 'center' && 'mx-auto',
              )}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </div>
    )
  }
)
SectionHeader.displayName = 'SectionHeader'

/**
 * Section Divider - visual separator between sections
 */
export interface SectionDividerProps extends React.HTMLAttributes<HTMLHRElement> {
  variant?: 'line' | 'gradient' | 'dots' | 'none'
}

const SectionDivider = React.forwardRef<HTMLHRElement, SectionDividerProps>(
  ({ className, variant = 'line', ...props }, ref) => {
    if (variant === 'none') return null
    
    if (variant === 'dots') {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={cn('flex justify-center gap-2 py-8', className)}
          role="separator"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]/20" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]/20" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]/20" />
        </div>
      )
    }
    
    return (
      <hr
        ref={ref}
        className={cn(
          'border-0 h-px',
          variant === 'line' && 'bg-[#1a1a1a]/12',
          variant === 'gradient' && 'bg-gradient-to-r from-transparent via-[#1a1a1a]/12 to-transparent',
          className
        )}
        {...props}
      />
    )
  }
)
SectionDivider.displayName = 'SectionDivider'

export { SectionWrapper, SectionHeader, SectionDivider, sectionVariants }
