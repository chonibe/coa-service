'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
  return (
    <div
      className={cn('flex flex-col gap-6', className)}
      style={style}
      {...(props as React.HTMLAttributes<HTMLDivElement>)}
    >
      {(title || subtitle || primaryAction || secondaryActions?.length || backAction) && (
        <div className="flex flex-col gap-2">
          {backAction && (
            <div className="flex items-center gap-2">
              {backAction.url ? (
                <Link
                  href={backAction.url}
                  className="text-sm font-medium text-[var(--p-color-text-secondary)] hover:text-[var(--p-color-text)] transition-colors"
                >
                  {backAction.content ?? 'Back'}
                </Link>
              ) : backAction.onAction ? (
                <button
                  type="button"
                  onClick={backAction.onAction}
                  className="text-sm font-medium text-[var(--p-color-text-secondary)] hover:text-[var(--p-color-text)] transition-colors"
                >
                  {backAction.content ?? 'Back'}
                </button>
              ) : null}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {title && (
                <h1 className="text-2xl font-semibold font-[var(--font-fraunces),serif] text-[var(--p-color-text)]">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-[var(--p-color-text-secondary)]">{subtitle}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {secondaryActions?.map((action, i) => (
                <span key={i}>{action}</span>
              ))}
              {primaryAction && <span>{primaryAction}</span>}
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
