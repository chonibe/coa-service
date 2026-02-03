'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * URL Parameter Banner
 * 
 * A dismissible banner that appears when a specific URL parameter is present.
 * Used for promotional campaigns like the Simply Gift campaign.
 */

export interface URLParamBannerProps {
  /** URL parameter name to check */
  urlParameter: string
  /** Message to display in the banner */
  message: string
  /** Whether to show a CTA button */
  showCta?: boolean
  /** CTA button text */
  ctaText?: string
  /** CTA button link */
  ctaLink?: string
  /** Whether the banner can be dismissed */
  dismissible?: boolean
  /** Text alignment */
  alignment?: 'left' | 'center' | 'right'
  /** Vertical padding */
  paddingVertical?: number
  /** Horizontal padding */
  paddingHorizontal?: number
  /** Font size */
  fontSize?: number
  /** Background color */
  backgroundColor?: string
  /** Text color */
  textColor?: string
  /** CTA background color */
  ctaBackgroundColor?: string
  /** CTA text color */
  ctaTextColor?: string
  /** CTA hover background color */
  ctaHoverBackgroundColor?: string
  /** CTA hover text color */
  ctaHoverTextColor?: string
  /** Additional className */
  className?: string
}

export function URLParamBanner({
  urlParameter,
  message,
  showCta = true,
  ctaText = 'Shop now',
  ctaLink = '/shop',
  dismissible = true,
  alignment = 'center',
  paddingVertical = 20,
  paddingHorizontal = 32,
  fontSize = 16,
  backgroundColor = '#390000',
  textColor = '#ffba94',
  ctaBackgroundColor = '#f0c417',
  ctaTextColor = '#1a1a1a',
  ctaHoverBackgroundColor = '#2c4bce',
  ctaHoverTextColor = '#ffffff',
  className,
}: URLParamBannerProps) {
  const searchParams = useSearchParams()
  const [dismissed, setDismissed] = React.useState(false)
  const [isHovering, setIsHovering] = React.useState(false)
  
  // Check if URL parameter is present
  const paramValue = searchParams?.get('ref') || searchParams?.get(urlParameter)
  const shouldShow = paramValue === urlParameter || searchParams?.has(urlParameter)
  
  // Check localStorage for previously dismissed state
  React.useEffect(() => {
    const dismissedKey = `banner_dismissed_${urlParameter}`
    const wasDismissed = localStorage.getItem(dismissedKey) === 'true'
    if (wasDismissed) {
      setDismissed(true)
    }
  }, [urlParameter])
  
  const handleDismiss = () => {
    setDismissed(true)
    const dismissedKey = `banner_dismissed_${urlParameter}`
    localStorage.setItem(dismissedKey, 'true')
  }
  
  if (!shouldShow || dismissed) return null
  
  const alignmentClasses = {
    left: 'justify-start text-left',
    center: 'justify-center text-center',
    right: 'justify-end text-right',
  }
  
  return (
    <div
      className={cn(
        'relative flex items-center gap-4',
        alignmentClasses[alignment],
        className
      )}
      style={{
        backgroundColor,
        padding: `${paddingVertical}px ${paddingHorizontal}px`,
      }}
    >
      {/* Message */}
      <p
        className="flex-1"
        style={{
          color: textColor,
          fontSize: `${fontSize}px`,
        }}
        dangerouslySetInnerHTML={{ __html: message }}
      />
      
      {/* CTA Button */}
      {showCta && ctaLink && (
        <Link
          href={ctaLink}
          className="inline-flex items-center justify-center px-5 py-2 rounded-full font-medium text-sm transition-colors"
          style={{
            backgroundColor: isHovering ? ctaHoverBackgroundColor : ctaBackgroundColor,
            color: isHovering ? ctaHoverTextColor : ctaTextColor,
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {ctaText}
        </Link>
      )}
      
      {/* Dismiss Button */}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
          style={{ color: textColor }}
          aria-label="Dismiss banner"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

export default URLParamBanner
