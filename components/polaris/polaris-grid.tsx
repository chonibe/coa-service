'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisGridProps } from './types'

/**
 * React wrapper for Polaris p-grid web component
 */
export function PolarisGrid({
  columns = 1,
  gap = 'base',
  children,
  className,
  style,
  ...props
}: PolarisGridProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (typeof columns === 'number') {
      element.setAttribute('columns', String(columns))
    } else {
      // Handle responsive columns object
      const columnsStr = JSON.stringify(columns)
      element.setAttribute('columns', columnsStr)
    }
    if (gap) element.setAttribute('gap', gap)
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }
  }, [columns, gap, className, style])

  return React.createElement('p-grid', { ref, ...props }, children)
}
