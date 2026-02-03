/**
 * VinylArtworkCard
 * 
 * A product/artwork card with vinyl record-inspired interactions:
 * - 3D tilt effect on hover (like holding a physical record)
 * - Flip to reveal B-side (artist notes, edition details)
 * - Buttery smooth 60fps animations via GSAP
 * 
 * @example
 * ```tsx
 * <VinylArtworkCard
 *   title="Mountain Sunset"
 *   price="$299"
 *   image="/artwork.jpg"
 *   artistName="Jane Doe"
 *   href="/shop/mountain-sunset"
 *   onQuickAdd={() => addToCart()}
 * />
 * ```
 */

'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { VinylCardFront } from './VinylCardFront'
import { VinylCardBack } from './VinylCardBack'
import { useVinylCard } from './useVinylCard'

export interface VinylArtworkCardProps {
  /** Product/artwork title */
  title: string
  /** Price display string */
  price?: string
  /** Compare-at price (for sales) */
  compareAtPrice?: string
  /** Main image URL */
  image: string
  /** Secondary image for hover */
  secondImage?: string
  /** Alt text for images */
  imageAlt?: string
  /** Link href */
  href?: string
  /** Artist/vendor name */
  artistName?: string
  /** Artist notes for the back */
  artistNotes?: string
  /** Edition number */
  editionNumber?: number
  /** Total editions */
  editionTotal?: number
  /** Edition type */
  editionType?: string
  /** Series name */
  seriesName?: string
  /** Badge elements */
  badges?: React.ReactNode
  /** Whether card is available/in stock */
  available?: boolean
  /** Show quick add button */
  showQuickAdd?: boolean
  /** Quick add handler */
  onQuickAdd?: () => void
  /** Quick add loading state */
  quickAddLoading?: boolean
  /** Disable flip interaction */
  disableFlip?: boolean
  /** Disable tilt interaction */
  disableTilt?: boolean
  /** Variant: shop vs collector view */
  variant?: 'shop' | 'collector'
  /** Purchase date (for collector view) */
  purchaseDate?: Date | string
  /** Additional className */
  className?: string
}

export const VinylArtworkCard = React.forwardRef<HTMLDivElement, VinylArtworkCardProps>(
  (
    {
      title,
      price,
      compareAtPrice,
      image,
      secondImage,
      imageAlt,
      href,
      artistName,
      artistNotes,
      editionNumber,
      editionTotal,
      editionType,
      seriesName,
      badges,
      available = true,
      showQuickAdd = true,
      onQuickAdd,
      quickAddLoading = false,
      disableFlip = false,
      disableTilt = false,
      variant = 'shop',
      purchaseDate,
      className,
    },
    forwardedRef
  ) => {
    const {
      cardRef,
      isFlipped,
      isHovered,
      isAnimating,
      flip,
      handleMouseEnter,
      handleMouseLeave,
      handleClick,
    } = useVinylCard({
      tiltEnabled: !disableTilt,
      onFlip: (flipped) => {
        // Optional: track analytics
      },
    })

    // Merge refs
    const mergedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [cardRef, forwardedRef]
    )

    const handleQuickAdd = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!quickAddLoading && available) {
        onQuickAdd?.()
      }
    }

    const handleFlipClick = (e: React.MouseEvent) => {
      if (disableFlip) return
      
      // Don't flip when clicking quick add or link
      const target = e.target as HTMLElement
      if (target.closest('[data-no-flip]')) return
      
      handleClick(e)
    }

    // Show back side info
    const hasBackContent = artistNotes || editionNumber || seriesName

    const CardWrapper = href && !isFlipped ? Link : 'div'
    const wrapperProps = href && !isFlipped 
      ? { href, className: 'block' } 
      : { className: 'block' }

    return (
      <div
        ref={mergedRef}
        className={cn(
          'group relative',
          'will-change-transform',
          className
        )}
        style={{ transformStyle: 'preserve-3d' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleFlipClick}
      >
        {/* @ts-ignore - Link/div typing */}
        <CardWrapper {...wrapperProps}>
          {/* Card Container */}
          <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
            {/* Front Face */}
            <VinylCardFront
              image={image}
              imageAlt={imageAlt || title}
              secondImage={secondImage}
              badges={badges}
              transparentBackground
            />

            {/* Back Face (B-side) */}
            {hasBackContent && (
              <VinylCardBack
                artistName={artistName}
                artistNotes={artistNotes}
                editionNumber={editionNumber}
                editionTotal={editionTotal}
                editionType={editionType}
                seriesName={seriesName}
                price={variant === 'shop' ? price : undefined}
                purchaseDate={purchaseDate}
                isCollectorView={variant === 'collector'}
              />
            )}
          </div>

          {/* Quick Add Button - Slides up on hover */}
          {showQuickAdd && onQuickAdd && available && !isFlipped && (
            <div
              data-no-flip
              className={cn(
                'absolute bottom-3 left-3 right-3 z-10',
                'transition-all duration-300',
                isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              )}
            >
              <button
                onClick={handleQuickAdd}
                disabled={quickAddLoading}
                className={cn(
                  'w-full py-3 px-4',
                  'bg-[#f0c417] text-[#1a1a1a]',
                  'font-semibold text-sm',
                  'rounded-full',
                  'hover:bg-[#e0b415] active:scale-[0.98]',
                  'transition-all duration-200',
                  'shadow-lg hover:shadow-xl',
                  'disabled:opacity-70 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2'
                )}
              >
                {quickAddLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  'Add to cart'
                )}
              </button>
            </div>
          )}

          {/* Flip hint indicator */}
          {hasBackContent && !disableFlip && !isFlipped && (
            <div 
              className={cn(
                'absolute top-3 right-3 z-10',
                'w-8 h-8 rounded-full',
                'bg-white/90 backdrop-blur-sm shadow-md',
                'flex items-center justify-center',
                'transition-all duration-300',
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              )}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                className="text-slate-600"
              >
                <path 
                  d="M12 6V18M12 6L7 11M12 6L17 11" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="rotate-90 origin-center"
                />
              </svg>
            </div>
          )}
        </CardWrapper>

        {/* Content - Outside flip container */}
        {!isFlipped && (
          <div className="mt-4 text-center">
            {artistName && (
              <p className="text-xs text-[#1a1a1a]/60 uppercase tracking-wider mb-1">
                {artistName}
              </p>
            )}
            <h3 className="font-heading text-lg font-medium text-[#1a1a1a] tracking-[-0.02em] line-clamp-2">
              {title}
            </h3>
            {price && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className={cn(
                  'text-base font-semibold',
                  compareAtPrice ? 'text-[#f83a3a]' : 'text-[#1a1a1a]'
                )}>
                  {price}
                </span>
                {compareAtPrice && (
                  <span className="text-sm text-[#1a1a1a]/50 line-through">
                    {compareAtPrice}
                  </span>
                )}
              </div>
            )}
            {!available && (
              <span className="inline-block mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sold Out
              </span>
            )}
          </div>
        )}

        {/* Back navigation hint when flipped */}
        {isFlipped && (
          <div 
            className={cn(
              'mt-4 text-center',
              'opacity-60 hover:opacity-100 transition-opacity'
            )}
          >
            <span className="text-xs text-slate-500">
              Click to flip back
            </span>
          </div>
        )}
      </div>
    )
  }
)

VinylArtworkCard.displayName = 'VinylArtworkCard'
