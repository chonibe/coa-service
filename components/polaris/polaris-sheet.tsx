'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface PolarisSheetProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  title?: string
  onClose?: () => void
  side?: 'top' | 'right' | 'bottom' | 'left'
  children?: React.ReactNode
}

const sideClasses = {
  top: 'inset-x-0 top-0 h-auto max-h-[90vh] w-full rounded-b-[var(--p-border-radius-300)] border-b',
  right: 'inset-y-0 right-0 h-full w-full max-w-sm rounded-l-[var(--p-border-radius-300)] border-l',
  bottom: 'inset-x-0 bottom-0 h-auto max-h-[90vh] w-full rounded-t-[var(--p-border-radius-300)] border-t',
  left: 'inset-y-0 left-0 h-full w-full max-w-sm rounded-r-[var(--p-border-radius-300)] border-r',
} as const

// Sub-components for compatibility with shadcn-style imports
export function PolarisSheetContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex-1 p-6", className)} {...props}>
      {children}
    </div>
  )
}

export function PolarisSheetHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between p-6 pb-0", className)} {...props}>
      {children}
    </div>
  )
}

export function PolarisSheetTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </h3>
  )
}

export function PolarisSheet({
  open,
  title,
  onClose,
  side = 'right',
  children,
  className,
  style,
  ...props
}: PolarisSheetProps) {
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) {
      document.addEventListener('keydown', onKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const overlay = (
    <div
      className="fixed inset-0 z-50"
      aria-modal="true"
      role="dialog"
      aria-label={title ?? 'Sheet'}
    >
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed z-50 flex flex-col overflow-auto border-[var(--p-color-border)] bg-[var(--p-color-bg-surface)] shadow-xl',
          sideClasses[side],
          className
        )}
        style={style}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[var(--p-color-border)] px-6 py-4">
            <h2 className="text-lg font-semibold font-[var(--font-fraunces),serif] text-[var(--p-color-text)]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 hover:bg-[var(--p-color-bg-surface-secondary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(overlay, document.body)
  }
  return overlay
}

// Ensure all exports are visible
export { PolarisSheetContent, PolarisSheetHeader, PolarisSheetTitle, PolarisSheet }
