'use client'

import React, { useEffect, useRef } from 'react'

/**
 * React wrapper for Polaris p-page web component
 */
export interface PolarisPageProps extends React.HTMLAttributes<HTMLElement> {
  title?: string
  subtitle?: string
  primaryAction?: React.ReactNode
  secondaryActions?: React.ReactNode[]
  backAction?: { url?: string; onAction?: () => void; content?: string }
  children?: React.ReactNode
}

export function PolarisPage({
  title,
  subtitle,
  primaryAction,
  secondaryActions,
  backAction,
  children,
  className,
  style,
  ...props
}: PolarisPageProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (title) element.setAttribute('title', title)
    if (subtitle) element.setAttribute('subtitle', subtitle)
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }

    // Handle back action
    if (backAction) {
      if (backAction.url) {
        element.setAttribute('back-action-url', backAction.url)
      }
      if (backAction.onAction) {
        const handleBack = () => {
          backAction.onAction?.()
        }
        element.addEventListener('back-action', handleBack)
        return () => {
          element.removeEventListener('back-action', handleBack)
        }
      }
    }
  }, [title, subtitle, backAction, className, style])

  return React.createElement('p-page', { ref, ...props }, children)
}
