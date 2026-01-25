'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface PolarisCardProps extends React.HTMLAttributes<HTMLDivElement> {
  background?: 'subdued' | 'surface' | 'transparent'
  padding?: 'base' | 'tight' | 'loose' | 'none'
  roundedAbove?: 'sm' | 'md' | 'lg' | 'xl'
  children?: React.ReactNode
}

const paddingMap = {
  none: 'p-0',
  tight: 'p-4',
  base: 'p-6',
  loose: 'p-8',
} as const

export function PolarisCard({
  background = 'surface',
  padding = 'none',
  roundedAbove,
  children,
  className,
  ...props
}: PolarisCardProps) {
  const bgClass =
    background === 'subdued'
      ? 'bg-[var(--p-color-bg-surface-secondary)]'
      : background === 'transparent'
        ? 'bg-transparent'
        : 'bg-[var(--p-color-bg-surface)]'

  const roundedClass = roundedAbove
    ? { sm: 'rounded-t-lg', md: 'rounded-t-xl', lg: 'rounded-t-2xl', xl: 'rounded-t-3xl' }[roundedAbove]
    : 'rounded-[var(--p-border-radius-300)]'

  return (
    <div
      className={cn(
        'border border-[var(--p-color-border)] shadow-sm',
        bgClass,
        roundedClass,
        padding !== 'none' && paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function PolarisCardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5 p-6 pb-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function PolarisCardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-xl font-semibold leading-none tracking-tight font-[var(--font-fraunces),serif] text-[var(--p-color-text)]',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export function PolarisCardDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-sm text-[var(--p-color-text-secondary)]',
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

export function PolarisCardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'p-6 pt-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function PolarisCardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center p-6 pt-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
