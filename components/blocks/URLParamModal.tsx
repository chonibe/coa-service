'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/impact'

/**
 * URL Parameter Modal Block
 * 
 * Shows a modal/popup based on URL parameters.
 * Based on blocks/ai_gen_block_43268ae.liquid
 */

export interface URLParamModalProps {
  // URL Parameter matching
  urlParamName: string
  urlParamValue?: string // If empty, any value triggers

  // Auto-dismiss settings
  autoDismissEnabled?: boolean
  autoDismissTime?: number // seconds
  rememberDismiss?: boolean

  // Media
  mediaType?: 'image' | 'video'
  imageUrl?: string
  videoUrl?: string
  videoAutoplay?: boolean
  videoAspectRatio?: string // percentage

  // Content
  heading: string
  message: string // HTML content
  
  // CTA
  showCta?: boolean
  ctaText?: string
  ctaLink?: string

  // Styling
  modalMaxWidth?: number
  modalBackground?: string
  modalBorderRadius?: number
  contentPadding?: number
  backdropColor?: string
  backdropOpacity?: number
  backdropBlur?: number

  // Close button
  closeButtonSize?: number
  closeButtonPosition?: number
  closeButtonBackground?: string
  closeButtonColor?: string
  closeButtonHoverBackground?: string

  // Typography
  headingSize?: number
  headingColor?: string
  headingSpacing?: number
  messageSize?: number
  textColor?: string

  // CTA styling
  ctaSpacing?: number
  ctaFontSize?: number
  ctaPaddingVertical?: number
  ctaPaddingHorizontal?: number
  ctaBackground?: string
  ctaTextColor?: string
  ctaHoverBackground?: string
  ctaBorderRadius?: number

  className?: string
}

export function URLParamModal({
  urlParamName,
  urlParamValue,
  autoDismissEnabled = false,
  autoDismissTime = 15,
  rememberDismiss = true,
  mediaType = 'image',
  imageUrl,
  videoUrl,
  videoAutoplay = true,
  videoAspectRatio = '75',
  heading,
  message,
  showCta = true,
  ctaText = 'Explore Collection',
  ctaLink = '/',
  modalMaxWidth = 800,
  modalBackground = '#ffffff',
  modalBorderRadius = 24,
  contentPadding = 40,
  backdropColor = '#ffffff',
  backdropOpacity = 80,
  backdropBlur = 8,
  closeButtonSize = 45,
  closeButtonPosition = 20,
  closeButtonBackground = '#ffffff',
  closeButtonColor = '#1a1a1a',
  closeButtonHoverBackground = '#f0f0f0',
  headingSize = 36,
  headingColor = '#1a1a1a',
  headingSpacing = 20,
  messageSize = 16,
  textColor = '#1a1a1a',
  ctaSpacing = 30,
  ctaFontSize = 16,
  ctaPaddingVertical = 14,
  ctaPaddingHorizontal = 32,
  ctaBackground = '#803cee',
  ctaTextColor = '#ffffff',
  ctaHoverBackground = '#1a3aa8',
  ctaBorderRadius = 60,
  className,
}: URLParamModalProps) {
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isDismissed, setIsDismissed] = React.useState(false)

  // Check if should show modal
  React.useEffect(() => {
    // Check if already dismissed
    if (rememberDismiss) {
      const dismissed = localStorage.getItem(`modal_dismissed_${urlParamName}`)
      if (dismissed) {
        setIsDismissed(true)
        return
      }
    }

    // Check URL parameter
    const paramValue = searchParams.get(urlParamName)
    if (paramValue !== null) {
      // If urlParamValue is specified, check for match
      if (urlParamValue && paramValue !== urlParamValue) {
        return
      }
      setIsOpen(true)
    }
  }, [searchParams, urlParamName, urlParamValue, rememberDismiss])

  // Auto-dismiss timer
  React.useEffect(() => {
    if (!isOpen || !autoDismissEnabled) return

    const timer = setTimeout(() => {
      handleClose()
    }, autoDismissTime * 1000)

    return () => clearTimeout(timer)
  }, [isOpen, autoDismissEnabled, autoDismissTime])

  // Close handler
  const handleClose = () => {
    setIsOpen(false)
    if (rememberDismiss) {
      localStorage.setItem(`modal_dismissed_${urlParamName}`, 'true')
    }
  }

  // Prevent scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || isDismissed) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: backdropColor,
          opacity: backdropOpacity / 100,
          backdropFilter: `blur(${backdropBlur}px)`,
          WebkitBackdropFilter: `blur(${backdropBlur}px)`,
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full overflow-hidden animate-fade-in-up"
        style={{
          maxWidth: `${modalMaxWidth}px`,
          backgroundColor: modalBackground,
          borderRadius: `${modalBorderRadius}px`,
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute z-10 flex items-center justify-center rounded-full transition-colors"
          style={{
            top: `${closeButtonPosition}px`,
            right: `${closeButtonPosition}px`,
            width: `${closeButtonSize}px`,
            height: `${closeButtonSize}px`,
            backgroundColor: closeButtonBackground,
            color: closeButtonColor,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = closeButtonHoverBackground
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = closeButtonBackground
          }}
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Media */}
        {(mediaType === 'video' && videoUrl) && (
          <div
            className="relative w-full"
            style={{ paddingBottom: `${videoAspectRatio}%` }}
          >
            <video
              src={videoUrl}
              autoPlay={videoAutoplay}
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}
        {(mediaType === 'image' && imageUrl) && (
          <img
            src={imageUrl}
            alt=""
            className="w-full object-cover"
          />
        )}

        {/* Content */}
        <div
          style={{
            padding: `${contentPadding}px`,
          }}
        >
          <h2
            id="modal-heading"
            className="font-heading font-semibold tracking-[-0.02em] text-center"
            style={{
              fontSize: `${headingSize}px`,
              color: headingColor,
              marginBottom: `${headingSpacing}px`,
            }}
          >
            {heading}
          </h2>

          <div
            className="prose prose-sm max-w-none text-center"
            style={{
              fontSize: `${messageSize}px`,
              color: textColor,
            }}
            dangerouslySetInnerHTML={{ __html: message }}
          />

          {showCta && ctaText && ctaLink && (
            <div
              className="flex justify-center"
              style={{ marginTop: `${ctaSpacing}px` }}
            >
              <a
                href={ctaLink}
                className="inline-flex items-center justify-center font-semibold transition-colors"
                style={{
                  fontSize: `${ctaFontSize}px`,
                  padding: `${ctaPaddingVertical}px ${ctaPaddingHorizontal}px`,
                  backgroundColor: ctaBackground,
                  color: ctaTextColor,
                  borderRadius: `${ctaBorderRadius}px`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = ctaHoverBackground
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ctaBackground
                }}
              >
                {ctaText}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default URLParamModal
