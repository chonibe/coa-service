'use client'

import React, { useEffect, useRef } from 'react'

/**
 * React wrapper for Polaris p-sheet web component
 */
export interface PolarisSheetProps extends React.HTMLAttributes<HTMLElement> {
  open?: boolean
  title?: string
  onClose?: () => void
  children?: React.ReactNode
}

export function PolarisSheet({
  open,
  title,
  onClose,
  children,
  className,
  style,
  ...props
}: PolarisSheetProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (open !== undefined) {
      if (open) {
        element.setAttribute('open', '')
      } else {
        element.removeAttribute('open')
      }
    }
    if (title) element.setAttribute('title', title)
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }

    // Handle close events
    if (onClose) {
      const handleClose = () => {
        onClose()
      }
      element.addEventListener('close', handleClose)
      return () => {
        element.removeEventListener('close', handleClose)
      }
    }
  }, [open, title, onClose, className, style])

  return React.createElement('p-sheet', { ref, ...props }, children)
}
