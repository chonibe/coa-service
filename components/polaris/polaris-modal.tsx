'use client'

import React, { useEffect, useRef } from 'react'

/**
 * React wrapper for Polaris p-modal web component
 */
export interface PolarisModalProps extends React.HTMLAttributes<HTMLElement> {
  open?: boolean
  title?: string
  size?: 'small' | 'medium' | 'large' | 'fullWidth'
  onClose?: () => void
  children?: React.ReactNode
}

export function PolarisModal({
  open,
  title,
  size = 'medium',
  onClose,
  children,
  className,
  style,
  ...props
}: PolarisModalProps) {
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
    if (size) element.setAttribute('size', size)
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
  }, [open, title, size, onClose, className, style])

  return React.createElement('p-modal', { ref, ...props }, children)
}
