'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Toast Notification Component
 * 
 * Displays temporary notifications matching the Impact theme style.
 */

export interface ToastProps {
  id: string
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose?: () => void
}

export function Toast({ id, message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isExiting, setIsExiting] = React.useState(false)

  React.useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true)
    })

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }

  const typeStyles = {
    success: 'bg-[#0a8754] text-white',
    error: 'bg-[#f83a3a] text-white',
    warning: 'bg-[#f0c417] text-[#1a1a1a]',
    info: 'bg-[#1a1a1a] text-white',
  }

  const typeIcons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 6L7.5 14.5L4 11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 6V10M10 14H10.01M4.93 2.93L2.93 4.93M15.07 2.93L17.07 4.93M10 2V4M2 10H4M16 10H18M4.93 17.07L2.93 15.07M15.07 17.07L17.07 15.07M10 16V18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="10" r="9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 14V10M10 6H10.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg',
        'transition-all duration-300 ease-out',
        'min-w-[280px] max-w-md',
        typeStyles[type],
        isVisible && !isExiting && 'translate-y-0 opacity-100',
        !isVisible && 'translate-y-2 opacity-0',
        isExiting && 'translate-y-2 opacity-0'
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {typeIcons[type]}
      </div>

      {/* Message */}
      <p className="flex-1 text-sm font-medium">
        {message}
      </p>

      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4L12 12M4 12L12 4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

/**
 * Toast Container Component
 */
export interface ToastContainerProps {
  toasts: ToastProps[]
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  onRemoveToast: (id: string) => void
}

export function ToastContainer({ 
  toasts, 
  position = 'bottom-right',
  onRemoveToast 
}: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4 items-end',
    'top-left': 'top-4 left-4 items-start',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-left': 'bottom-4 left-4 items-start',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  }

  if (toasts.length === 0) return null

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 pointer-events-none',
        positionClasses[position]
      )}
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            {...toast}
            onClose={() => onRemoveToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}

/**
 * Toast Hook
 * 
 * Usage:
 * const { showToast } = useToast()
 * showToast({ message: 'Added to cart', type: 'success' })
 */
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const showToast = React.useCallback((
    options: Omit<ToastProps, 'id' | 'onClose'>
  ) => {
    const id = Math.random().toString(36).substring(7)
    const toast: ToastProps = { ...options, id }
    
    setToasts((prev) => [...prev, toast])
    
    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id)
    }, options.duration || 3000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return {
    toasts,
    showToast,
    removeToast,
  }
}
