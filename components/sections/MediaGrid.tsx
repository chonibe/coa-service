'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { SectionWrapper, Container } from '@/components/impact'

/**
 * Media Grid Section
 * 
 * Grid layout for images and videos with optional links, matching the Impact theme.
 */

export interface MediaGridItem {
  id: string
  type: 'image' | 'video'
  src: string
  alt?: string
  poster?: string
  linkUrl?: string
  linkText?: string
  textColor?: string
  overlayColor?: string
  overlayOpacity?: number
}

export interface MediaGridProps {
  items: MediaGridItem[]
  title?: string
  subtitle?: string
  columns?: 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape'
  fullWidth?: boolean
  stretchImages?: boolean
  className?: string
}

export function MediaGrid({
  items,
  title,
  subtitle,
  columns = 3,
  gap = 'md',
  aspectRatio = 'square',
  fullWidth = true,
  stretchImages = true,
  className,
}: MediaGridProps) {
  // Column classes
  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  }

  // Gap classes
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
  }

  // Aspect ratio classes
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  }

  return (
    <SectionWrapper spacing="md" fullWidth={fullWidth} className={className}>
      <Container maxWidth="default" paddingX={fullWidth ? 'none' : 'gutter'}>
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-8 sm:mb-12 px-5 sm:px-8 lg:px-12">
            {title && (
              <h2 className="font-heading text-impact-h2 xl:text-impact-h2-lg font-semibold text-[#1a1a1a] tracking-[-0.02em]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-3 text-base sm:text-lg text-[#1a1a1a]/60 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Grid */}
        <div className={cn(
          'grid',
          columnClasses[columns],
          gapClasses[gap]
        )}>
          {items.map((item) => (
            <MediaGridItem
              key={item.id}
              item={item}
              aspectRatio={aspectClasses[aspectRatio]}
              stretchImages={stretchImages}
            />
          ))}
        </div>
      </Container>
    </SectionWrapper>
  )
}

/**
 * Media Grid Item Component
 */
interface MediaGridItemProps {
  item: MediaGridItem
  aspectRatio: string
  stretchImages: boolean
}

function MediaGridItem({ item, aspectRatio, stretchImages }: MediaGridItemProps) {
  const content = (
    <div className={cn(
      'relative overflow-hidden group',
      aspectRatio
    )}>
      {/* Media */}
      {item.type === 'image' ? (
        <img
          src={item.src}
          alt={item.alt || ''}
          className={cn(
            'w-full h-full transition-transform duration-500 group-hover:scale-105',
            stretchImages ? 'object-cover' : 'object-contain'
          )}
        />
      ) : (
        <video
          src={item.src}
          poster={item.poster}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      )}

      {/* Overlay */}
      {item.overlayColor && (
        <div
          className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0"
          style={{
            backgroundColor: item.overlayColor,
            opacity: (item.overlayOpacity ?? 0) / 100,
          }}
        />
      )}

      {/* Link text overlay */}
      {item.linkText && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div
            className="absolute inset-0 bg-black/50"
          />
          <span
            className="relative z-10 text-lg font-heading font-semibold"
            style={{ color: item.textColor || '#ffffff' }}
          >
            {item.linkText}
          </span>
        </div>
      )}
    </div>
  )

  if (item.linkUrl) {
    return (
      <a href={item.linkUrl} className="block">
        {content}
      </a>
    )
  }

  return content
}

export default MediaGrid
