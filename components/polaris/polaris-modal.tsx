'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface PolarisModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  title?: string
  size?: 'small' | 'medium' | 'large' | 'fullWidth'
  onClose?: () => void
  children?: React.ReactNode
}

const sizeMap = {
  small: 'max-w-sm',
  medium: 'max-w-md',
  large: 'max-w-lg',
  fullWidth: 'max-w-[calc(100vw-2rem)] w-full',
} as const

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'polaris-modal-title' : undefined}
      aria-label={title ?? 'Modal'}
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
          'relative z-50 w-full overflow-hidden rounded-[var(--p-border-radius-300)] border border-[var(--p-color-border)] bg-[var(--p-color-bg-surface)] shadow-xl',
          sizeMap[size],
          className
        )}
        style={style}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[var(--p-color-border)] px-6 py-4">
            <h2
              id="polaris-modal-title"
              className="text-lg font-semibold font-[var(--font-fraunces),serif] text-[var(--p-color-text)]"
            >
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
        <div className="p-6">{children}</div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(overlay, document.body)
  }
  return overlay
}
