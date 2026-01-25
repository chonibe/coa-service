'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisCardProps } from './types'

/**
 * React wrapper for Polaris p-card web component
 */
export function PolarisCard({
  background,
  padding,
  roundedAbove,
  children,
  className,
  style,
  ...props
}: PolarisCardProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (background) element.setAttribute('background', background)
    if (padding) element.setAttribute('padding', padding)
    if (roundedAbove) element.setAttribute('rounded-above', roundedAbove)
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }
  }, [background, padding, roundedAbove, className, style])

  return React.createElement('p-card', { ref, ...props }, children)
}

// Card sub-components for backward compatibility
export function PolarisCardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function PolarisCardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={className} {...props}>
      {children}
    </h3>
  )
}

export function PolarisCardDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={className} {...props}>
      {children}
    </p>
  )
}

export function PolarisCardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function PolarisCardFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}
