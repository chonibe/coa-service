'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const variantToTone: Record<string, 'info' | 'success' | 'warning' | 'critical'> = {
  default: 'info',
  destructive: 'critical',
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'critical',
}

const toneClasses: Record<string, string> = {
  info: 'bg-[var(--p-color-bg-info)] border-[#b3e8ff] dark:border-[var(--p-color-bg-info-strong)] text-[var(--p-color-text)]',
  success: 'bg-[var(--p-color-bg-success)] border-[#b8e0b0] dark:border-[var(--p-color-bg-success-strong)] text-[var(--p-color-text)]',
  warning: 'bg-[var(--p-color-bg-warning)] border-[#ffd79d] dark:border-[var(--p-color-bg-warning-strong)] text-[var(--p-color-text)]',
  critical: 'bg-[var(--p-color-bg-critical)] border-[#fecaca] dark:border-[var(--p-color-bg-critical-strong)] text-[var(--p-color-text)]',
}

export interface PolarisBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'info' | 'success' | 'warning' | 'critical'
  variant?: 'default' | 'destructive' | 'info' | 'success' | 'warning' | 'critical'
  status?: 'info' | 'success' | 'warning' | 'critical'
  title?: string
  onDismiss?: () => void
  children?: React.ReactNode
}

export function PolarisBanner({
  tone,
  variant,
  status,
  title,
  onDismiss,
  children,
  className,
  ...props
}: PolarisBannerProps) {
  const resolvedTone = tone ?? status ?? (variant ? variantToTone[variant] ?? 'info' : 'info')
  const isCritical = resolvedTone === 'critical'
  const role = isCritical ? 'alert' : 'status'

  return (
    <div
      role={role}
      aria-live={isCritical ? 'assertive' : 'polite'}
      className={cn(
        'rounded-[var(--p-border-radius-200)] border px-4 py-3',
        toneClasses[resolvedTone] ?? toneClasses.info,
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-[var(--p-color-text)] mb-1">{title}</h4>
          )}
          {children}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export function PolarisAlert({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: string; tone?: string; status?: string; title?: string; onDismiss?: () => void }) {
  return (
    <PolarisBanner className={className} {...props}>
      {children}
    </PolarisBanner>
  )
}

export function PolarisAlertTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4
      className={cn('font-semibold text-[var(--p-color-text)]', className)}
      {...props}
    >
      {children}
    </h4>
  )
}

export function PolarisAlertDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-[var(--p-color-text-secondary)]', className)}
      {...props}
    >
      {children}
    </p>
  )
}
