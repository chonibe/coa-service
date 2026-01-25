'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisDialogProps } from './types'

/**
 * React wrapper for Polaris p-dialog web component
 */
export function PolarisDialog({
  open,
  title,
  size = 'medium',
  onClose,
  children,
  className,
  style,
  ...props
}: PolarisDialogProps) {
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

  return React.createElement('p-dialog', { ref, ...props }, children)
}

// Dialog sub-components for backward compatibility
export function PolarisDialogHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function PolarisDialogTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={className} {...props}>
      {children}
    </h2>
  )
}

export function PolarisDialogDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={className} {...props}>
      {children}
    </p>
  )
}

export function PolarisDialogContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function PolarisDialogFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function PolarisDialogTrigger({ children, className, asChild, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { ...props, className })
  }
  return (
    <button className={className} {...props}>
      {children}
    </button>
  )
}
