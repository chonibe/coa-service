'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisTabsProps } from './types'

/**
 * React wrapper for Polaris p-tabs web component
 */
export function PolarisTabs({
  tabs = [],
  selected,
  onSelect,
  children,
  className,
  style,
  ...props
}: PolarisTabsProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (tabs.length > 0) {
      element.setAttribute('tabs', JSON.stringify(tabs))
    }
    if (selected !== undefined) {
      element.setAttribute('selected', String(selected))
    }
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }

    // Handle select events
    if (onSelect) {
      const handleSelect = (event: Event) => {
        const customEvent = event as CustomEvent<{ selectedTabIndex: number }>
        onSelect(customEvent.detail.selectedTabIndex)
      }
      element.addEventListener('select', handleSelect)
      return () => {
        element.removeEventListener('select', handleSelect)
      }
    }
  }, [tabs, selected, onSelect, className, style])

  return React.createElement('p-tabs', { ref, ...props }, children)
}

// Tabs sub-components for backward compatibility
export function PolarisTabsList({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function PolarisTabsTrigger({ value, children, className, ...props }: React.HTMLAttributes<HTMLButtonElement> & { value: string }) {
  return (
    <button className={className} data-value={value} {...props}>
      {children}
    </button>
  )
}

export function PolarisTabsContent({ value, children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  return (
    <div className={className} data-value={value} {...props}>
      {children}
    </div>
  )
}
