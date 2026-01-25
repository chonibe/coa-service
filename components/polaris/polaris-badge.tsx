'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisBadgeProps } from './types'

/**
 * React wrapper for Polaris p-badge web component
 */
export function PolarisBadge({
  tone = 'info',
  size = 'medium',
  children,
  className,
  style,
  ...props
}: PolarisBadgeProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (tone) element.setAttribute('tone', tone)
    if (size) element.setAttribute('size', size)
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }
  }, [tone, size, className, style])

  return React.createElement('p-badge', { ref, ...props }, children)
}
