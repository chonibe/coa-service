'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import type { PolarisDialogProps } from './types'

const sizeMap = {
  small: 'max-w-sm',
  medium: 'max-w-md',
  large: 'max-w-lg',
  fullWidth: 'max-w-[calc(100vw-2rem)] w-full',
} as const

const DialogContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
  size: 'small' | 'medium' | 'large' | 'fullWidth'
} | null>(null)

function useDialogContext() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error('Dialog subcomponents must be used within PolarisDialog')
  return ctx
}

/**
 * Polaris-styled Dialog. Use with DialogContent, DialogHeader, DialogTitle, etc.
 * Supports open, onOpenChange (Radix-style) and onClose.
 */
export function PolarisDialog({
  open,
  title,
  size = 'medium',
  onClose,
  onOpenChange,
  children,
  className,
  style,
  ...props
}: PolarisDialogProps & { onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? !!open : internalOpen

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
      if (!next) onClose?.()
    },
    [isControlled, onOpenChange, onClose]
  )

  const value = React.useMemo(
    () => ({ open: isOpen, onOpenChange: handleOpenChange, size }),
    [isOpen, handleOpenChange, size]
  )

  return (
    <DialogContext.Provider value={value}>
      <div className={cn(className)} style={style} data-state={isOpen ? 'open' : 'closed'} {...props}>
        {children}
      </div>
    </DialogContext.Provider>
  )
}

export function PolarisDialogContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = useDialogContext()
  const sizeClass = sizeMap[ctx.size]

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ctx.onOpenChange(false)
    }
    if (ctx.open) {
      document.addEventListener('keydown', onKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [ctx.open, ctx.onOpenChange])

  if (!ctx.open) return null

  const overlay = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => ctx.onOpenChange(false)}
      />
      <div
        className={cn(
          'relative z-50 w-full overflow-hidden rounded-[var(--p-border-radius-300)] border border-[var(--p-color-border)] bg-[var(--p-color-bg-surface)] shadow-xl',
          sizeClass,
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(overlay, document.body)
  }
  return overlay
}

export function PolarisDialogHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 p-6 pb-0 text-left',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function PolarisDialogTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        'text-lg font-semibold leading-none tracking-tight font-[var(--font-fraunces),serif] text-[var(--p-color-text)]',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
}

export function PolarisDialogDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-sm text-[var(--p-color-text-secondary)]',
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

export function PolarisDialogFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2 p-6 pt-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function PolarisDialogTrigger({
  children,
  className,
  asChild,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const ctx = useDialogContext()
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    ctx.onOpenChange(true)
  }
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: React.MouseEventHandler; className?: string }>
    const childOnClick = child.props?.onClick
    const mergedClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      childOnClick?.(e)
      handleClick(e)
    }
    return React.cloneElement(child, {
      ...props,
      onClick: mergedClick,
      className: cn(className, child.props?.className),
    })
  }
  return (
    <button type="button" className={cn(className)} onClick={handleClick} {...props}>
      {children}
    </button>
  )
}
