/**
 * Artist Carousel
 * 
 * Horizontal scrolling carousel for featured artists with arrow controls.
 * - User-controlled with left/right arrow buttons
 * - Smooth horizontal scrolling
 * - Artist cards with depth/parallax effects
 * - Progress bar synced with scroll position
 * - Touch/swipe friendly on mobile
 * 
 * @example
 * ```tsx
 * <ArtistCarousel
 *   title="Featured Artists"
 *   artists={[
 *     { handle: 'artist-1', name: 'Artist Name', location: 'City', imageUrl: '...' }
 *   ]}
 * />
 * ```
 */

'use client'

import * as React from 'react'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Container, SectionWrapper, SectionHeader, Button } from '@/components/impact'
import { gsap } from '@/lib/animations/gsap-config'
import { useGSAP } from '@gsap/react'

export interface Artist {
  handle: string
  name: string
  location?: string
  imageUrl?: string
}

export interface ArtistCarouselProps {
  title?: string
  artists: Artist[]
  /** Show scroll progress bar */
  showProgressBar?: boolean
  /** Link text and href */
  linkText?: string
  linkHref?: string
  /** Spacing between cards */
  cardGap?: number
  /** Card width in pixels */
  cardWidth?: number
  fullWidth?: boolean
  className?: string
}

export function ArtistCarousel({
  title = 'Featured Artists',
  artists,
  showProgressBar = true,
  linkText = 'View all artists',
  linkHref = '/shop/artists',
  cardGap = 32,
  cardWidth = 320,
  fullWidth = true,
  className,
}: ArtistCarouselProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Check scroll state
  const checkScrollState = React.useCallback(() => {
    const container = cardsContainerRef.current
    if (!container) return

    const scrollLeft = container.scrollLeft
    const scrollWidth = container.scrollWidth
    const clientWidth = container.clientWidth

    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)

    // Update progress
    const progress = scrollLeft / (scrollWidth - clientWidth)
    setScrollProgress(progress)
  }, [])

  // Scroll left/right
  const scroll = (direction: 'left' | 'right') => {
    const container = cardsContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.8
    const newPosition =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: newPosition,
      behavior: 'smooth',
    })
  }

  // GSAP animations for cards
  useGSAP(() => {
    const cards = cardsContainerRef.current?.children
    if (!cards || cards.length === 0) return

    // Staggered entrance animation
    gsap.fromTo(
      cards,
      {
        opacity: 0,
        y: 50,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: cardsContainerRef.current,
          start: 'top bottom-=100',
        },
      }
    )

    // Add depth/parallax effect on scroll
    const container = cardsContainerRef.current
    if (!container) return

    const handleScroll = () => {
      Array.from(cards).forEach((card, index) => {
        const rect = card.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        
        // Calculate distance from center
        const cardCenter = rect.left + rect.width / 2
        const containerCenter = containerRect.left + containerRect.width / 2
        const distanceFromCenter = (cardCenter - containerCenter) / containerRect.width
        
        // Apply subtle depth effect (closer to center = more prominent)
        const scale = 1 - Math.abs(distanceFromCenter) * 0.05
        const opacity = 1 - Math.abs(distanceFromCenter) * 0.2
        
        gsap.to(card, {
          scale: Math.max(0.95, Math.min(1, scale)),
          opacity: Math.max(0.7, Math.min(1, opacity)),
          duration: 0.3,
          ease: 'power1.out',
        })
      })
    }

    container.addEventListener('scroll', handleScroll)
    handleScroll() // Initial state

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [artists.length])

  // Monitor scroll state
  React.useEffect(() => {
    const container = cardsContainerRef.current
    if (!container) return

    checkScrollState()
    container.addEventListener('scroll', checkScrollState)
    window.addEventListener('resize', checkScrollState)

    return () => {
      container.removeEventListener('scroll', checkScrollState)
      window.removeEventListener('resize', checkScrollState)
    }
  }, [checkScrollState])

  if (artists.length === 0) return null

  return (
    <SectionWrapper
      ref={sectionRef}
      spacing="md"
      background="default"
      fullWidth={fullWidth}
      className={className}
    >
      <Container maxWidth="default" paddingX="gutter">
        {/* Header with Arrow Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <SectionHeader
              title={title}
              alignment="start"
            />
          </div>
          
          <div className="flex items-center gap-4">
            {linkText && linkHref && (
              <Link href={linkHref}>
                <Button variant="outline" size="sm">
                  {linkText}
                </Button>
              </Link>
            )}
            
            {/* Arrow Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={cn(
                  'p-3 rounded-full border-2 transition-all',
                  canScrollLeft
                    ? 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                    : 'border-gray-300 text-gray-300 cursor-not-allowed'
                )}
                aria-label="Scroll left"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={cn(
                  'p-3 rounded-full border-2 transition-all',
                  canScrollRight
                    ? 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                    : 'border-gray-300 text-gray-300 cursor-not-allowed'
                )}
                aria-label="Scroll right"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Scrolling Cards Container */}
        <div ref={containerRef} className="relative">
          <div
            ref={cardsContainerRef}
            className="overflow-x-auto overflow-y-hidden hide-scrollbar scroll-smooth"
            style={{
              display: 'flex',
              gap: `${cardGap}px`,
              paddingBottom: '20px',
            }}
          >
            {artists.map((artist, index) => (
              <Link
                key={artist.handle}
                href={`/shop?collection=${artist.handle}`}
                className="group flex-shrink-0 relative"
                style={{ width: `${cardWidth}px` }}
              >
                {/* Artist Card */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                  {artist.imageUrl ? (
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                      <span className="text-4xl font-bold text-gray-400">
                        {artist.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Artist Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-semibold text-xl mb-1">{artist.name}</h3>
                    {artist.location && (
                      <p className="text-sm opacity-90">{artist.location}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Progress Bar */}
          {showProgressBar && (
            <div className="mt-6 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full bg-gray-900 rounded-full transition-all duration-300"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
          )}
        </div>
      </Container>

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </SectionWrapper>
  )
}
