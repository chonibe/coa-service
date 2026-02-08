/**
 * Horizontal Artists Section
 * 
 * Pinned horizontal scroll showcase for featured artists.
 * - Section pins when it enters viewport
 * - Vertical scroll translates to horizontal movement
 * - Artist cards have staggered depth (3D perspective)
 * - Images reveal with clip-path animation
 * - Progress bar synced with scroll position
 * 
 * @example
 * ```tsx
 * <HorizontalArtistsSection
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

export interface HorizontalArtistsSectionProps {
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

export function HorizontalArtistsSection({
  title = 'Featured Artists',
  artists,
  showProgressBar = true,
  linkText = 'View all artists',
  linkHref = '/shop/artists',
  cardGap = 32,
  cardWidth = 320,
  fullWidth = true,
  className,
}: HorizontalArtistsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useGSAP(() => {
    const section = sectionRef.current
    const container = containerRef.current
    const cardsContainer = cardsContainerRef.current
    const progressBar = progressBarRef.current

    if (!section || !container || !cardsContainer) return

    // Skip horizontal scroll on mobile
    const mm = gsap.matchMedia()

    mm.add('(min-width: 1024px)', () => {
      // Calculate total scroll width
      const cards = cardsContainer.children
      const totalWidth = cards.length * (cardWidth + cardGap)
      const scrollDistance = totalWidth - window.innerWidth + 200 // Add padding

      // Pin section and create horizontal scroll
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: `+=${scrollDistance}`,
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            setScrollProgress(self.progress)
            
            // Update progress bar
            if (progressBar) {
              gsap.set(progressBar, { scaleX: self.progress })
            }
          },
        },
      })

      // Horizontal movement
      tl.to(cardsContainer, {
        x: -scrollDistance,
        ease: 'none',
      })

      // Staggered depth effect on cards
      Array.from(cards).forEach((card, index) => {
        // Each card has slightly different parallax speed
        const depth = index % 3 // Create 3 layers of depth
        const depthMultiplier = 1 + depth * 0.1

        gsap.to(card, {
          x: `-=${50 * depthMultiplier}`,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: `+=${scrollDistance}`,
            scrub: 1,
          },
        })
      })

      // Clip-path reveal for images
      const images = cardsContainer.querySelectorAll('[data-artist-image]')
      images.forEach((img) => {
        gsap.from(img, {
          clipPath: 'inset(0% 100% 0% 0%)',
          duration: 0.8,
          scrollTrigger: {
            trigger: img,
            start: 'left center',
            end: 'left 20%',
            scrub: 1,
            horizontal: true,
            containerAnimation: tl,
          },
        })
      })
    })

    // Mobile: Standard vertical layout
    mm.add('(max-width: 1023px)', () => {
      // Simple fade-up animation for cards
      const cards = cardsContainer.children

      gsap.from(cards, {
        opacity: 0,
        y: 40,
        stagger: 0.1,
        duration: 0.6,
        scrollTrigger: {
          trigger: cardsContainer,
          start: 'top 80%',
        },
      })
    })

    return () => {
      mm.revert()
    }
  }, { dependencies: [artists.length, cardWidth, cardGap], scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative py-16 lg:py-24 bg-white overflow-hidden',
        className
      )}
    >
      <Container maxWidth="default" paddingX="gutter">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <SectionHeader
            title={title}
            alignment="left"
            action={
              linkHref ? (
                <Link href={linkHref}>
                  <Button variant="outline" size="sm">
                    {linkText}
                  </Button>
                </Link>
              ) : undefined
            }
          />
        </div>

        {/* Progress Bar (Desktop only) */}
        {showProgressBar && (
          <div className="hidden lg:block mb-6">
            <div className="h-1 bg-[#1a1a1a]/10 rounded-full overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full bg-[#f0c417] origin-left"
                style={{ transform: 'scaleX(0)' }}
              />
            </div>
          </div>
        )}
      </Container>

      {/* Horizontal Scroll Container */}
      <div ref={containerRef} className="relative">
        <div
          ref={cardsContainerRef}
          className={cn(
            'flex gap-8',
            'lg:pl-[5vw]', // Padding on desktop for horizontal scroll
            'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-nowrap', // Grid on mobile, flex on desktop
            'px-4 lg:px-0'
          )}
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
        >
          {artists.map((artist, index) => (
            <ArtistCard
              key={artist.handle}
              artist={artist}
              cardWidth={cardWidth}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Individual artist card
 */
interface ArtistCardProps {
  artist: Artist
  cardWidth: number
  index: number
}

function ArtistCard({ artist, cardWidth, index }: ArtistCardProps) {
  return (
    <Link
      href={`/shop/artists/${artist.handle}`}
      className={cn(
        'group relative flex-shrink-0 block',
        'transition-transform duration-300',
        'hover:scale-105'
      )}
      style={{
        width: `${cardWidth}px`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#f5f5f5] mb-4">
        {artist.imageUrl ? (
          <img
            data-artist-image
            src={artist.imageUrl}
            alt={artist.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          // Placeholder gradient
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, 
                hsl(${index * 40}, 60%, 70%), 
                hsl(${index * 40 + 60}, 60%, 50%)
              )`,
            }}
          />
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Artist Info */}
      <div className="text-left">
        <h3 className="font-heading text-xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-1 group-hover:text-[#2c4bce] transition-colors">
          {artist.name}
        </h3>
        {artist.location && (
          <p className="text-sm text-[#1a1a1a]/60">
            {artist.location}
          </p>
        )}
      </div>

      {/* Arrow icon on hover */}
      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

export default HorizontalArtistsSection
