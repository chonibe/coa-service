'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const toneMap: Record<string, 'info' | 'success' | 'attention' | 'warning' | 'critical'> = {
  default: 'info',
  secondary: 'info',
  outline: 'info',
  destructive: 'critical',
  info: 'info',
  success: 'success',
  attention: 'attention',
  warning: 'warning',
  critical: 'critical',
}

const toneClasses: Record<string, string> = {
  info: 'bg-[var(--p-color-bg-info)] text-[#2e72d2] dark:bg-[var(--p-color-bg-info)] dark:text-[#7eb8f0] border-transparent',
  success: 'bg-[var(--p-color-bg-success)] text-[#008060] dark:bg-[var(--p-color-bg-success)] dark:text-[#5fb88a] border-transparent',
  warning: 'bg-[var(--p-color-bg-warning)] text-[#b98900] dark:bg-[var(--p-color-bg-warning)] dark:text-[#e6b800] border-transparent',
  attention: 'bg-[var(--p-color-bg-attention)] text-[#b98900] dark:bg-[var(--p-color-bg-attention)] dark:text-[#e6b800] border-transparent',
  critical: 'bg-[var(--p-color-bg-critical)] text-[#d82c0d] dark:bg-[var(--p-color-bg-critical)] dark:text-[#f87171] border-transparent',
}

const sizeClasses = {
  small: 'text-xs px-2 py-0.5',
  medium: 'text-sm px-2.5 py-1',
  large: 'text-sm px-3 py-1.5',
}

export interface PolarisBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'info' | 'success' | 'attention' | 'warning' | 'critical'
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'info' | 'success' | 'attention' | 'warning' | 'critical'
  size?: 'small' | 'medium' | 'large'
  children?: React.ReactNode
}

export function PolarisBadge({
  tone,
  variant,
  size = 'medium',
  children,
  className,
  ...props
}: PolarisBadgeProps) {
  const resolvedTone = tone ?? (variant ? toneMap[variant] ?? 'info' : 'info')
  const toneClass = toneClasses[resolvedTone] ?? toneClasses.info
  const sizeClass = sizeClasses[size]

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-[var(--p-border-radius-100)] border',
        toneClass,
        sizeClass,
        variant === 'outline' && 'bg-transparent border-[var(--p-color-border)] text-[var(--p-color-text)] dark:text-[var(--p-color-text)]',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
