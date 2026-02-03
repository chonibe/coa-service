/**
 * VinylCardFront
 * 
 * The front face of a vinyl artwork card.
 * Displays the artwork image with optional badges and quick actions.
 * 
 * This component is meant to be used within VinylArtworkCard.
 */

'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface VinylCardFrontProps {
  /** Main artwork image URL */
  image: string
  /** Alt text for the image */
  imageAlt?: string
  /** Optional secondary image for hover state */
  secondImage?: string
  /** Badge elements to display */
  badges?: React.ReactNode
  /** Whether to show loading skeleton */
  loading?: boolean
  /** Aspect ratio of the card */
  aspectRatio?: 'square' | 'portrait' | 'landscape'
  /** Additional className */
  className?: string
  /** Whether to use transparent background */
  transparentBackground?: boolean
}

export const VinylCardFront = React.forwardRef<HTMLDivElement, VinylCardFrontProps>(
  (
    {
      image,
      imageAlt = 'Artwork',
      secondImage,
      badges,
      loading = false,
      aspectRatio = 'square',
      className,
      transparentBackground = true,
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const [imageLoaded, setImageLoaded] = React.useState(false)

    const aspectClasses = {
      square: 'aspect-square',
      portrait: 'aspect-[3/4]',
      landscape: 'aspect-[4/3]',
    }

    return (
      <div
        ref={ref}
        data-flip-front
        className={cn(
          'relative overflow-hidden rounded-[24px]',
          aspectClasses[aspectRatio],
          transparentBackground ? 'bg-transparent' : 'bg-[#f5f5f5]',
          'backface-hidden',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Loading Skeleton */}
        {(loading || !imageLoaded) && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        )}

        {/* Primary Image */}
        {image && (
          <img
            src={image}
            alt={imageAlt}
            className={cn(
              'w-full h-full object-contain transition-all duration-300',
              secondImage && isHovered ? 'opacity-0' : 'opacity-100',
              isHovered && 'scale-105',
              !imageLoaded && 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
          />
        )}

        {/* Secondary Image (hover) */}
        {secondImage && (
          <img
            src={secondImage}
            alt={`${imageAlt} - alternate view`}
            className={cn(
              'absolute inset-0 w-full h-full object-contain transition-all duration-300',
              isHovered ? 'opacity-100 scale-105' : 'opacity-0'
            )}
          />
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        {badges && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {badges}
          </div>
        )}

        {/* Vinyl record groove effect (subtle) */}
        <div 
          className={cn(
            'absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-500',
            isHovered && 'opacity-[0.02]'
          )}
          style={{
            background: `repeating-radial-gradient(
              circle at center,
              transparent 0px,
              transparent 3px,
              rgba(0,0,0,1) 3px,
              rgba(0,0,0,1) 4px
            )`,
          }}
        />
      </div>
    )
  }
)

VinylCardFront.displayName = 'VinylCardFront'
