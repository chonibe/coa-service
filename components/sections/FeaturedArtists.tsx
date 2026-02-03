'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SectionWrapper, Container, SectionHeader, Button } from '@/components/impact'

/**
 * Featured Artists Section
 * 
 * A horizontal scrollable grid of artist collection cards,
 * matching the Impact theme collection list style.
 */

export interface FeaturedArtist {
  handle: string
  name: string
  location: string
  imageUrl?: string
}

export interface FeaturedArtistsSectionProps {
  title?: string
  artists: FeaturedArtist[]
  collectionsPerRow?: {
    mobile: number
    desktop: number
  }
  showProgressBar?: boolean
  fullWidth?: boolean
  linkText?: string
  linkHref?: string
  className?: string
}

export function FeaturedArtistsSection({
  title = 'Featured Artists',
  artists,
  collectionsPerRow = { mobile: 1, desktop: 3 },
  showProgressBar = true,
  fullWidth = true,
  linkText = 'View all',
  linkHref = '/shop?collection=artists',
  className,
}: FeaturedArtistsSectionProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = React.useState(0)

  // Handle scroll progress
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    const progress = scrollLeft / (scrollWidth - clientWidth)
    setScrollProgress(Math.min(1, Math.max(0, progress)))
  }

  // Navigation handlers
  const scrollPrev = () => {
    if (!scrollContainerRef.current) return
    const cardWidth = scrollContainerRef.current.clientWidth / collectionsPerRow.desktop
    scrollContainerRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' })
  }

  const scrollNext = () => {
    if (!scrollContainerRef.current) return
    const cardWidth = scrollContainerRef.current.clientWidth / collectionsPerRow.desktop
    scrollContainerRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' })
  }

  return (
    <SectionWrapper spacing="md" fullWidth={fullWidth} className={className}>
      <Container maxWidth="default" paddingX="gutter">
        {/* Header */}
        <SectionHeader
          title={title}
          alignment="center"
          action={
            <div className="flex items-center gap-2">
              {/* Navigation arrows */}
              <button
                onClick={scrollPrev}
                className="w-10 h-10 rounded-full border border-[#1a1a1a]/20 flex items-center justify-center hover:border-[#1a1a1a]/40 transition-colors"
                aria-label="Previous artists"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={scrollNext}
                className="w-10 h-10 rounded-full border border-[#1a1a1a]/20 flex items-center justify-center hover:border-[#1a1a1a]/40 transition-colors"
                aria-label="Next artists"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          }
        />

        {/* Scrollable Grid */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={cn(
            'flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide',
            '-mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0'
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {artists.map((artist) => (
            <ArtistCard key={artist.handle} artist={artist} />
          ))}
        </div>

        {/* Progress Bar */}
        {showProgressBar && artists.length > collectionsPerRow.desktop && (
          <div className="mt-6 sm:mt-8">
            <div className="h-0.5 bg-[#1a1a1a]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1a1a1a] transition-all duration-200"
                style={{ width: `${Math.max(10, scrollProgress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* View All Link */}
        {linkText && linkHref && (
          <div className="mt-8 text-center">
            <Link href={linkHref}>
              <Button variant="outline">{linkText}</Button>
            </Link>
          </div>
        )}
      </Container>
    </SectionWrapper>
  )
}

/**
 * Artist Card Component
 */
function ArtistCard({ artist }: { artist: FeaturedArtist }) {
  // Generate placeholder image if not provided
  const imageUrl = artist.imageUrl || `https://placehold.co/400x500/f5f5f5/1a1a1a?text=${encodeURIComponent(artist.name)}`
  
  return (
    <Link
      href={`/shop?collection=${artist.handle}`}
      className={cn(
        'flex-shrink-0 snap-start group',
        'w-[280px] sm:w-[320px] lg:w-[calc(33.333%-16px)]'
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/5] bg-[#f5f5f5] rounded-[16px] overflow-hidden mb-4">
        <img
          src={imageUrl}
          alt={artist.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>
      
      {/* Info */}
      <div className="text-center">
        <h3 className="font-heading text-lg font-semibold text-[#1a1a1a] group-hover:text-[#2c4bce] transition-colors">
          {artist.name}
        </h3>
        <p className="text-sm text-[#1a1a1a]/60 mt-1">
          {artist.location}
        </p>
      </div>
    </Link>
  )
}

export default FeaturedArtistsSection
