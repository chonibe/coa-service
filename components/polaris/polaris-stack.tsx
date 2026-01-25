'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisStackProps } from './types'

/**
 * React wrapper for Polaris p-stack web component
 */
export function PolarisStack({
  spacing = 'base',
  distribution,
  alignment,
  vertical = false,
  wrap = false,
  children,
  className,
  style,
  ...props
}: PolarisStackProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (spacing) element.setAttribute('spacing', spacing)
    if (distribution) element.setAttribute('distribution', distribution)
    if (alignment) element.setAttribute('alignment', alignment)
    if (vertical) element.setAttribute('vertical', '')
    if (wrap) element.setAttribute('wrap', '')
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }
  }, [spacing, distribution, alignment, vertical, wrap, className, style])

  return React.createElement('p-stack', { ref, ...props }, children)
}
