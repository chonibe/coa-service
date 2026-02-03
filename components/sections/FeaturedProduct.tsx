'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SectionWrapper, Container, Button } from '@/components/impact'

/**
 * Featured Product Section
 * 
 * A product showcase section matching the Impact theme featured-product section.
 * Displays a product with media gallery and purchase options.
 */

export interface FeaturedProductMedia {
  type: 'image' | 'video'
  url: string
  alt?: string
  poster?: string
}

export interface FeaturedProductSectionProps {
  title: string
  handle: string
  price: string
  compareAtPrice?: string
  description?: string
  media: FeaturedProductMedia[]
  fullWidth?: boolean
  desktopMediaWidth?: number
  desktopMediaLayout?: 'single' | 'grid' | 'grid_highlight'
  mobileMediaSize?: 'contained' | 'full'
  enableVideoAutoplay?: boolean
  enableVideoLooping?: boolean
  enableImageZoom?: boolean
  backgroundColor?: string
  textColor?: string
  ctaText?: string
  ctaUrl?: string
  secondaryCtaText?: string
  secondaryCtaUrl?: string
  className?: string
}

export function FeaturedProductSection({
  title,
  handle,
  price,
  compareAtPrice,
  description,
  media,
  fullWidth = true,
  desktopMediaWidth = 65,
  desktopMediaLayout = 'grid_highlight',
  mobileMediaSize = 'contained',
  enableVideoAutoplay = false,
  enableVideoLooping = false,
  enableImageZoom = false,
  backgroundColor = '#dad9d5',
  textColor = '#1a1a1a',
  ctaText = 'Shop Now',
  ctaUrl,
  secondaryCtaText,
  secondaryCtaUrl,
  className,
}: FeaturedProductSectionProps) {
  const [activeMediaIndex, setActiveMediaIndex] = React.useState(0)
  
  const productUrl = ctaUrl || `/shop/${handle}`
  const primaryMedia = media[0]
  const secondaryMedia = media.slice(1, 4)

  return (
    <SectionWrapper
      spacing="lg"
      fullWidth={fullWidth}
      className={className}
      style={{ backgroundColor }}
    >
      <Container maxWidth="default" paddingX="gutter">
        <div className={cn(
          'grid gap-8 lg:gap-12 items-center',
          `lg:grid-cols-[${desktopMediaWidth}%,1fr]`
        )}
        style={{
          gridTemplateColumns: `${desktopMediaWidth}% 1fr`,
        }}
        >
          {/* Media Section */}
          <div className="space-y-4">
            {/* Main Media */}
            <div className="relative aspect-square rounded-[24px] overflow-hidden bg-white/50">
              {primaryMedia?.type === 'video' ? (
                <video
                  src={primaryMedia.url}
                  poster={primaryMedia.poster}
                  autoPlay={enableVideoAutoplay}
                  loop={enableVideoLooping}
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={primaryMedia?.url}
                  alt={primaryMedia?.alt || title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Secondary Media Grid */}
            {secondaryMedia.length > 0 && desktopMediaLayout === 'grid_highlight' && (
              <div className="hidden lg:grid grid-cols-3 gap-4">
                {secondaryMedia.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMediaIndex(idx + 1)}
                    className={cn(
                      'aspect-square rounded-[16px] overflow-hidden bg-white/50',
                      'ring-2 ring-transparent hover:ring-[#1a1a1a]/20 transition-all',
                      activeMediaIndex === idx + 1 && 'ring-[#1a1a1a]/40'
                    )}
                  >
                    {item.type === 'video' ? (
                      <video
                        src={item.url}
                        poster={item.poster}
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.alt || `${title} - Image ${idx + 2}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center space-y-6" style={{ color: textColor }}>
            {/* Title */}
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.02em]">
              {title}
            </h2>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold">
                {price}
              </span>
              {compareAtPrice && (
                <span className="text-lg opacity-50 line-through">
                  {compareAtPrice}
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-base sm:text-lg opacity-80 leading-relaxed max-w-lg">
                {description}
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={productUrl}>
                <Button variant="primary" size="lg">
                  {ctaText}
                </Button>
              </Link>
              {secondaryCtaText && secondaryCtaUrl && (
                <Link href={secondaryCtaUrl}>
                  <Button variant="outline" size="lg">
                    {secondaryCtaText}
                  </Button>
                </Link>
              )}
            </div>

            {/* Feature List */}
            <div className="pt-4 border-t border-current/10">
              <ul className="space-y-2 text-sm opacity-70">
                <li className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Interchangeable artwork system
                </li>
                <li className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Premium LED backlight
                </li>
                <li className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Worldwide shipping
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </SectionWrapper>
  )
}

export default FeaturedProductSection
