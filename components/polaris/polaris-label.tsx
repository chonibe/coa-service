'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Polaris-styled label component
 */
export interface PolarisLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string
  required?: boolean
}

export function PolarisLabel({
  className,
  required,
  children,
  ...props
}: PolarisLabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  )
}
