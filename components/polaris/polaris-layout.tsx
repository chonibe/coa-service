'use client'

import React, { useEffect, useRef } from 'react'

/**
 * React wrapper for Polaris p-layout web component
 */
export interface PolarisLayoutProps extends React.HTMLAttributes<HTMLElement> {
  sectioned?: boolean
  children?: React.ReactNode
}

export function PolarisLayout({
  sectioned = false,
  children,
  className,
  style,
  ...props
}: PolarisLayoutProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (sectioned) element.setAttribute('sectioned', '')
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }
  }, [sectioned, className, style])

  return React.createElement('p-layout', { ref, ...props }, children)
}

// Layout Section
export interface PolarisLayoutSectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'oneHalf' | 'oneThird' | 'fullWidth'
  children?: React.ReactNode
}

export function PolarisLayoutSection({
  variant,
  children,
  className,
  style,
  ...props
}: PolarisLayoutSectionProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (variant) element.setAttribute('variant', variant)
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }
  }, [variant, className, style])

  return React.createElement('p-layout-section', { ref, ...props }, children)
}
