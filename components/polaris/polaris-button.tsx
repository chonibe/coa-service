'use client'

import React, { useEffect, useRef } from 'react'
import type { PolarisButtonProps } from './types'

/**
 * React wrapper for Polaris p-button web component
 */
export function PolarisButton({
  variant = 'primary',
  size = 'medium',
  fullWidth,
  disabled,
  loading,
  submit,
  url,
  external,
  download,
  onClick,
  children,
  className,
  style,
  ...props
}: PolarisButtonProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Set attributes
    if (variant) element.setAttribute('variant', variant)
    if (size) element.setAttribute('size', size)
    if (fullWidth) element.setAttribute('full-width', '')
    if (disabled) element.setAttribute('disabled', '')
    if (loading) element.setAttribute('loading', '')
    if (submit) element.setAttribute('submit', '')
    if (url) element.setAttribute('url', url)
    if (external) element.setAttribute('external', '')
    if (download !== undefined) {
      element.setAttribute('download', download === true ? '' : String(download))
    }
    if (className) element.className = className
    if (style) {
      Object.assign(element.style, style)
    }

    // Handle click events
    if (onClick) {
      element.addEventListener('click', onClick as EventListener)
      return () => {
        element.removeEventListener('click', onClick as EventListener)
      }
    }
  }, [variant, size, fullWidth, disabled, loading, submit, url, external, download, onClick, className, style])

  return React.createElement('p-button', { ref, ...props }, children)
}

// Export buttonVariants for backward compatibility (used by some components)
// This matches the CVA (class-variance-authority) signature used by Shadcn
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "h-7 rounded-md px-2 text-[10px]",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonVariantsProps = VariantProps<typeof buttonVariants>
