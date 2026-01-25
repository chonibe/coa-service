'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisBannerProps } from './types'

/**
 * React wrapper for Polaris p-banner web component (Alert equivalent)
 */
export function PolarisBanner({
  tone = 'info',
  title,
  status,
  onDismiss,
  children,
  className,
  style,
  ...props
}: PolarisBannerProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Use status if provided, otherwise use tone
    const bannerTone = status || tone
    if (bannerTone) element.setAttribute('tone', bannerTone)
    if (title) element.setAttribute('title', title)
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }

    // Handle dismiss events
    if (onDismiss) {
      const handleDismiss = () => {
        onDismiss()
      }
      element.addEventListener('dismiss', handleDismiss)
      return () => {
        element.removeEventListener('dismiss', handleDismiss)
      }
    }
  }, [tone, title, status, onDismiss, className, style])

  return React.createElement('p-banner', { ref, ...props }, children)
}

// Alert sub-components for backward compatibility
export function PolarisAlert({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <PolarisBanner className={className} {...props}>{children}</PolarisBanner>
}

export function PolarisAlertTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4 className={className} {...props}>
      {children}
    </h4>
  )
}

export function PolarisAlertDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={className} {...props}>
      {children}
    </p>
  )
}
