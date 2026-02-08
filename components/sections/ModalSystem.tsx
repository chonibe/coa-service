/**
 * Modal System - Osmo-style Modal/Dialog
 * 
 * Features:
 * - GSAP-powered open/close animations
 * - Backdrop blur
 * - Smooth scale + fade transition
 * - Trigger/target data attribute system
 * - Close on escape key
 * - Body scroll lock when open
 * 
 * Inspired by Osmo's modal system
 */

'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { gsap } from '@/lib/animations/gsap-config'
import { useGSAP } from '@gsap/react'

export interface ModalSystemProps {
  id: string
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
}

export function ModalSystem({
  id,
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
}: ModalSystemProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full w-full h-full',
  }

  // GSAP animations
  useGSAP(() => {
    if (!modalRef.current || !backdropRef.current || !contentRef.current) return

    const backdrop = backdropRef.current
    const content = contentRef.current

    if (isOpen) {
      // Set initial state
      gsap.set(backdrop, { opacity: 0 })
      gsap.set(content, { opacity: 0, scale: 0.95, y: 20 })

      // Animate in
      const tl = gsap.timeline()
      tl.to(backdrop, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      })
      tl.to(
        content,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.4,
          ease: 'power3.out',
        },
        '-=0.1'
      )
    } else {
      // Animate out
      const tl = gsap.timeline()
      tl.to(content, {
        opacity: 0,
        scale: 0.95,
        y: 20,
        duration: 0.3,
        ease: 'power2.in',
      })
      tl.to(
        backdrop,
        {
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in',
        },
        '-=0.1'
      )
    }
  }, { dependencies: [isOpen] })

  // Close on escape
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!mounted) return null

  return createPortal(
    <div
      ref={modalRef}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        !isOpen && 'pointer-events-none'
      )}
      aria-hidden={!isOpen}
      data-modal-target={id}
      data-modal-status={isOpen ? 'active' : 'not-active'}
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
        data-modal-bg
      />

      {/* Modal Content */}
      <div
        ref={contentRef}
        className={cn(
          'relative bg-white rounded-2xl shadow-2xl overflow-hidden',
          'max-h-[90vh] overflow-y-auto',
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors group"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 10 10"
              fill="none"
              className="text-[#1a1a1a] transition-transform duration-300 group-hover:rotate-90"
            >
              <path
                d="M1 1L9 9M9 1L1 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
          </button>
        )}

        {/* Content */}
        <div className="p-8 sm:p-12">{children}</div>
      </div>
    </div>,
    document.body
  )
}

/**
 * Modal Trigger Button
 */
export interface ModalTriggerProps {
  targetModal: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function ModalTrigger({
  targetModal,
  children,
  className,
  onClick,
}: ModalTriggerProps) {
  return (
    <button
      data-modal-trigger={targetModal}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  )
}

export default ModalSystem
