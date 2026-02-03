'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Impact Theme Container
 * 
 * Matches the exact container settings from the Shopify Impact theme:
 * - Max width: 1600px (page_width)
 * - Narrow max width: 1350px (page_width - 250)
 * - Gutter: 20px mobile, 32px tablet, 48px desktop
 */

const containerVariants = cva(
  [
    'w-full',
    'mx-auto',
  ].join(' '),
  {
    variants: {
      // Max width constraint
      maxWidth: {
        full: 'max-w-none',
        default: 'max-w-[1600px]', // Impact theme page_width
        narrow: 'max-w-[1350px]', // Impact theme narrow
        content: 'max-w-[800px]', // For text-heavy content
        sm: 'max-w-[640px]',
        md: 'max-w-[768px]',
        lg: 'max-w-[1024px]',
        xl: 'max-w-[1280px]',
      },
      // Horizontal padding (gutter)
      paddingX: {
        none: '',
        gutter: 'px-5 sm:px-8 lg:px-12', // Impact theme responsive gutter
        sm: 'px-4 sm:px-6',
        md: 'px-6 sm:px-8 lg:px-10',
        lg: 'px-8 sm:px-12 lg:px-16',
      },
      // Centering
      center: {
        true: 'mx-auto',
        false: '',
      },
    },
    defaultVariants: {
      maxWidth: 'default',
      paddingX: 'gutter',
      center: true,
    },
  }
)

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: 'div' | 'main' | 'article' | 'section'
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      className,
      maxWidth,
      paddingX,
      center,
      as: Component = 'div',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(containerVariants({ maxWidth, paddingX, center }), className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
Container.displayName = 'Container'

/**
 * Grid Container - for product grids and multi-column layouts
 */
export interface GridContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
}

const GridContainer = React.forwardRef<HTMLDivElement, GridContainerProps>(
  (
    {
      className,
      columns = { default: 1, sm: 2, lg: 3, xl: 4 },
      gap = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const gapClasses = {
      sm: 'gap-4 sm:gap-5',
      md: 'gap-5 sm:gap-6', // Impact theme grid gutter
      lg: 'gap-6 sm:gap-8',
      xl: 'gap-8 sm:gap-10',
    }
    
    // Build responsive grid columns
    const getColumnClass = () => {
      const classes: string[] = ['grid']
      
      if (columns.default) classes.push(`grid-cols-${columns.default}`)
      if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`)
      if (columns.md) classes.push(`md:grid-cols-${columns.md}`)
      if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`)
      if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`)
      
      return classes.join(' ')
    }
    
    return (
      <div
        ref={ref}
        className={cn(getColumnClass(), gapClasses[gap], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GridContainer.displayName = 'GridContainer'

/**
 * Flex Container - for flexible layouts
 */
export interface FlexContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse'
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

const FlexContainer = React.forwardRef<HTMLDivElement, FlexContainerProps>(
  (
    {
      className,
      direction = 'row',
      wrap = 'nowrap',
      justify = 'start',
      align = 'stretch',
      gap = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const directionClasses = {
      row: 'flex-row',
      col: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'col-reverse': 'flex-col-reverse',
    }
    
    const wrapClasses = {
      wrap: 'flex-wrap',
      nowrap: 'flex-nowrap',
      'wrap-reverse': 'flex-wrap-reverse',
    }
    
    const justifyClasses = {
      start: 'justify-start',
      end: 'justify-end',
      center: 'justify-center',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    }
    
    const alignClasses = {
      start: 'items-start',
      end: 'items-end',
      center: 'items-center',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    }
    
    const gapClasses = {
      none: '',
      sm: 'gap-3',
      md: 'gap-4 sm:gap-6',
      lg: 'gap-6 sm:gap-8',
      xl: 'gap-8 sm:gap-10',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          directionClasses[direction],
          wrapClasses[wrap],
          justifyClasses[justify],
          alignClasses[align],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FlexContainer.displayName = 'FlexContainer'

/**
 * Stack - vertical stack with consistent spacing
 */
export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'end' | 'center' | 'stretch'
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap = 'md', align = 'stretch', children, ...props }, ref) => {
    const gapClasses = {
      none: '',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    }
    
    const alignClasses = {
      start: 'items-start',
      end: 'items-end',
      center: 'items-center',
      stretch: 'items-stretch',
    }
    
    return (
      <div
        ref={ref}
        className={cn('flex flex-col', gapClasses[gap], alignClasses[align], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Stack.displayName = 'Stack'

/**
 * Inline - horizontal inline with consistent spacing
 */
export interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'end' | 'center' | 'baseline'
  wrap?: boolean
}

const Inline = React.forwardRef<HTMLDivElement, InlineProps>(
  ({ className, gap = 'sm', align = 'center', wrap = false, children, ...props }, ref) => {
    const gapClasses = {
      none: '',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
      xl: 'gap-6',
    }
    
    const alignClasses = {
      start: 'items-start',
      end: 'items-end',
      center: 'items-center',
      baseline: 'items-baseline',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          gapClasses[gap],
          alignClasses[align],
          wrap ? 'flex-wrap' : 'flex-nowrap',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Inline.displayName = 'Inline'

export {
  Container,
  GridContainer,
  FlexContainer,
  Stack,
  Inline,
  containerVariants,
}
