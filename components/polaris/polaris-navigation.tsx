'use client'

import React, { useEffect, useRef } from 'react'

/**
 * React wrapper for Polaris p-navigation web component
 */
export interface PolarisNavigationProps extends React.HTMLAttributes<HTMLElement> {
  location?: string
  children?: React.ReactNode
}

export function PolarisNavigation({
  location,
  children,
  className,
  style,
  ...props
}: PolarisNavigationProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (location) element.setAttribute('location', location)
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }
  }, [location, className, style])

  return React.createElement('p-navigation', { ref, ...props }, children)
}
