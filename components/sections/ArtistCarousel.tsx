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
  /** Collection/artist description from Shopify */
  description?: string
  /** Custom link URL (e.g. external collection page). When set, card links to this URL. */
  href?: string
}

/** Scrollable description overlay - text scrolls inside the card, no chevrons */
function ArtistDescriptionOverlay({
  description,
  className,
}: {
  description: string
  className?: string
}) {
  return (
    <div className={cn('absolute inset-0 flex flex-col p-4 sm:p-5 text-white', className)}>
      <div className="overflow-y-auto max-h-full min-h-0 flex-1 hide-scrollbar">
        <p className="text-sm sm:text-base opacity-95 leading-relaxed whitespace-pre-line">
          {description}
        </p>
      </div>
    </div>
  )
}

export interface ArtistCarouselProps {
  title?: string
  /** Title size: sm, md, lg, xl, 2xl, 3xl */
  titleSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  /** Header alignment: left or center */
  headerAlignment?: 'left' | 'center'
  /** Subtitle or tagline below the title */
  subtitle?: string
  /** Optional longer intro/description below subtitle */
  description?: string
  artists: Artist[]
  /** Show scroll progress bar */
  showProgressBar?: boolean
  /** Link text and href */
  linkText?: string
  linkHref?: string
  /** Auto-scroll slideshow mode (hides CTA and arrows by default) */
  autoScroll?: boolean
  /** Show prev/next arrow buttons (use with autoScroll to allow manual navigation too) */
  showArrows?: boolean
  /** Show "View all" link (default true when linkText/linkHref provided) */
  showLink?: boolean
  /** Show artist info (name, location, description) as hover overlay on photo instead of linking */
  showInfoSheet?: boolean
  /** Spacing between cards */
  cardGap?: number
  /** Card width in pixels */
  cardWidth?: number
  fullWidth?: boolean
  /** Optional override for section title color (e.g. text-[#390000] or text-[#FFBA94]) */
  titleClassName?: string
  /** Section background variant (e.g. 'header' for dark red #390000, 'headerSubtle' for 10% opacity) */
  sectionBackground?: 'default' | 'muted' | 'dark' | 'header' | 'headerSubtle' | 'primary' | 'secondary' | 'transparent' | 'gradient'
  /** Footer cue link (e.g. "View limited editions.") */
  footerCue?: string
  /** Footer cue link URL */
  footerCueHref?: string
  /** Footer scarcity text (e.g. "Editions are limited. Once sold out, they do not return.") */
  footerScarcity?: string
  /** Value prop tiles to show below artist cards (e.g. Collect original art, Live with it, Support artists) */
  valueProps?: Array<{ title: string; description: string }>
  /** Render title as a long horizontal card with smaller text */
  titleAsCard?: boolean
  /** Content to render at the top of the section (e.g. value prop videos) */
  leadingContent?: React.ReactNode
  /** Content to render below the artist carousel (e.g. value prop banner) */
  trailingContent?: React.ReactNode
  /** HTML element for section title (e.g. 'h5' for smaller) */
  titleTag?: 'h2' | 'h3' | 'h4' | 'h5'
  /** Show artist name/location as overlay on card or below card */
  namePosition?: 'overlay' | 'below'
  /** Override arrow button styling (e.g. "bg-[#FFBA94] text-[#390000]" for dark sections) */
  arrowButtonClassName?: string
  className?: string
}

export function ArtistCarousel({
  title = 'Featured Artists',
  titleSize = 'lg',
  headerAlignment = 'left',
  subtitle,
  description,
  artists,
  showProgressBar = true,
  linkText = 'View all artists',
  linkHref = '/shop/artists',
  autoScroll = false,
  showArrows = false,
  showLink = true,
  showInfoSheet = false,
  cardGap = 32,
  cardWidth = 320,
  fullWidth = true,
  titleClassName,
  sectionBackground = 'default',
  footerCue,
  footerScarcity,
  footerCueHref,
  valueProps,
  titleAsCard = false,
  leadingContent,
  trailingContent,
  titleTag,
  namePosition = 'overlay',
  arrowButtonClassName,
  className,
}: ArtistCarouselProps) {
  const safeArtists = Array.isArray(artists) ? artists : []
  const sectionRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [revealedCardKey, setRevealedCardKey] = useState<string | null>(null)

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
  }, [safeArtists.length])

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

  // Auto-scroll slideshow: duplicate artists for seamless loop, scroll every 4s
  const displayArtists = autoScroll && safeArtists.length > 0
    ? [...safeArtists, ...safeArtists]
    : safeArtists

  React.useEffect(() => {
    if (!autoScroll || displayArtists.length === 0) return

    let intervalId: ReturnType<typeof setInterval> | null = null
    let timeoutId: ReturnType<typeof setTimeout>

    const startScroll = () => {
      const container = cardsContainerRef.current
      if (!container) return false
      const first = container.firstElementChild as HTMLElement
      if (!first) return false
      const step = (first.offsetWidth || cardWidth) + cardGap
      // Start auto-scroll (no overflow check - if no overflow, scroll has no visible effect)
      intervalId = setInterval(() => {
        const el = cardsContainerRef.current
        if (!el) return
        el.scrollLeft += step
        if (el.scrollLeft >= (el.scrollWidth / 2) - step) {
          el.scrollLeft = 0
        }
      }, 4000)
      return true
    }

    timeoutId = setTimeout(() => {
      if (!startScroll()) {
        // Retry after 1s in case layout wasn't ready (e.g. images loading)
        timeoutId = setTimeout(startScroll, 1000)
      }
    }, 500)

    return () => {
      clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoScroll, displayArtists.length, cardGap, cardWidth])

  if (safeArtists.length === 0) return null

  return (
    <SectionWrapper
      ref={sectionRef}
      spacing="md"
      background={sectionBackground}
      fullWidth={fullWidth}
      className={className}
    >
      <Container maxWidth="default" paddingX="gutter">
        {leadingContent && <div className="mb-8 sm:mb-10">{leadingContent}</div>}
        {/* Header with Arrow Controls - stacks on mobile for better layout */}
        <div className={cn(
          'flex flex-col gap-4',
          titleAsCard ? 'mb-1 sm:mb-2' : 'mb-6 sm:mb-8',
          headerAlignment === 'center' ? 'items-center' : 'sm:flex-row sm:items-center sm:justify-between'
        )}>
          <div className={headerAlignment === 'center' ? 'w-full text-center' : 'flex-1 min-w-0'}>
            {titleAsCard ? (
              <div
                className={cn(
                  'w-fit max-w-full rounded-xl px-4 py-2.5 sm:px-5 sm:py-3',
                  'text-center',
                  headerAlignment === 'center' && 'mx-auto',
                  sectionBackground === 'header'
                    ? 'bg-[#FFBA94]/10 border border-[#FFBA94]/20'
                    : 'bg-[#390000]/10 border border-[#390000]/20'
                )}
              >
                <h2
                  className={cn(
                    'font-serif text-sm sm:text-base font-medium tracking-tight',
                    titleClassName ?? (sectionBackground === 'header' ? 'text-[#FFBA94]' : 'text-[#390000]')
                  )}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p
                    className={cn(
                      'mt-0.5 text-xs sm:text-sm',
                      sectionBackground === 'header' ? 'text-[#FFBA94]/80' : 'text-[#390000]/80'
                    )}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            ) : (
              <SectionHeader
                title={title}
                subtitle={subtitle}
                titleClassName={titleClassName}
                alignment={headerAlignment}
                titleSize={titleSize}
                titleTag={titleTag}
                showSquiggle={false}
              />
            )}
          </div>
          
          {(!autoScroll || showArrows) && showLink && linkText && linkHref && (
          <div className={cn(
            'flex items-center gap-3 sm:gap-4 flex-shrink-0',
            headerAlignment === 'center' && 'justify-center'
          )}>
            <Link href={linkHref}>
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                {linkText}
              </Button>
            </Link>
          </div>
          )}
        </div>

        {description && (
          <div className={cn(
            'mb-8 max-w-3xl text-base leading-relaxed',
            sectionBackground === 'header' && 'text-[#FFBA94]/90',
            sectionBackground === 'headerSubtle' && 'text-[#390000]/90',
            sectionBackground !== 'header' && sectionBackground !== 'headerSubtle' && 'text-neutral-600'
          )}>
            {description}
          </div>
        )}

        {/* Carousel + hover info - wrapper keeps info visible when moving mouse to it */}
        <div className="-mx-5 sm:-mx-8 lg:-mx-12">
          {/* Horizontal Scrolling Cards - full-bleed on mobile */}
          <div ref={containerRef} className="relative">
            <div
              ref={cardsContainerRef}
              className="overflow-x-auto overflow-y-hidden hide-scrollbar scroll-smooth flex-nowrap px-5 sm:px-8 lg:px-12"
              style={{
                display: 'flex',
                flexWrap: 'nowrap',
                gap: `${cardGap}px`,
                paddingBottom: '20px',
              }}
            >
              {displayArtists.map((artist, index) => {
                const nameBlock = (
                  <div
                    className={cn(
                      'pt-3 text-center',
                      sectionBackground === 'header' && 'text-[#FFBA94]',
                      sectionBackground === 'headerSubtle' && 'text-[#390000]',
                      sectionBackground !== 'header' && sectionBackground !== 'headerSubtle' && 'text-neutral-700'
                    )}
                  >
                    <h3 className="font-semibold text-base sm:text-lg">{artist.name}</h3>
                    {artist.location && (
                      <p className="text-sm opacity-90 mt-0.5">{artist.location}</p>
                    )}
                  </div>
                )

                const cardContent = (
                  <div className={cn(namePosition === 'below' && 'flex flex-col')}>
                  {/* Artist Card */}
                  <div className="relative aspect-[3/5] overflow-hidden rounded-lg bg-gray-100">
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
                    
                    {/* Rest state: name + city overlay (when namePosition is overlay) */}
                    {namePosition === 'overlay' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#390000]/90 via-[#390000]/50 to-transparent p-4 sm:p-5 text-[#FFBA94]">
                      <h3 className="font-semibold text-lg sm:text-xl">{artist.name}</h3>
                      {artist.location && (
                        <p className="text-sm opacity-90">{artist.location}</p>
                      )}
                    </div>
                    )}
                    
                    {/* Hover/click overlay: dark bg + description only (no name/city) */}
                    <div className={cn(
                      'absolute inset-0 bg-[#390000]/70 transition-opacity duration-300 opacity-0 group-hover:opacity-100',
                      showInfoSheet && 'group-data-[revealed=true]:opacity-100'
                    )} />
                    {(showInfoSheet && artist.description) ? (
                      <div className={cn(
                        'absolute inset-0 flex flex-col justify-start p-4 sm:p-5 text-[#FFBA94] transition-opacity duration-300',
                        'opacity-0 group-hover:opacity-100',
                        'group-data-[revealed=true]:opacity-100'
                      )}>
                        <div className="overflow-y-auto max-h-full min-h-0 flex-1">
                          <p className="text-sm sm:text-base opacity-95 leading-relaxed whitespace-pre-line">
                            {artist.description}
                          </p>
                        </div>
                      </div>
                    ) : !showInfoSheet ? (
                      <div className="absolute inset-0 bg-gradient-to-t from-[#390000]/80 via-[#390000]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    ) : null}
                  </div>
                  {namePosition === 'below' && nameBlock}
                  </div>
                )

                const cardHref = artist.href ?? (showInfoSheet ? undefined : `/shop?collection=${artist.handle}`)
                const cardClassName = 'group flex-shrink-0 relative w-full'
                const cardStyle = { width: `${cardWidth}px` }

                if (cardHref) {
                  return cardHref.startsWith('http') ? (
                    <a
                      key={`${artist.handle}-${index}`}
                      href={cardHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cardClassName}
                      style={cardStyle}
                    >
                      {cardContent}
                    </a>
                  ) : (
                    <Link
                      key={`${artist.handle}-${index}`}
                      href={cardHref}
                      className={cardClassName}
                      style={cardStyle}
                    >
                      {cardContent}
                    </Link>
                  )
                }
                const cardKey = `${artist.handle}-${index}`
                return (
                <div
                  key={cardKey}
                  className={cardClassName}
                  style={cardStyle}
                  {...(showInfoSheet && {
                    'data-revealed': revealedCardKey === cardKey,
                    onClick: () => setRevealedCardKey((prev) => (prev === cardKey ? null : cardKey)),
                    role: 'button',
                    tabIndex: 0,
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setRevealedCardKey((prev) => (prev === cardKey ? null : cardKey))
                      }
                    },
                  })}
                >
                  {cardContent}
                </div>
              )})}
            </div>

            {/* Arrow controls - same placement and style as Join 3000 Collectors (TestimonialCarousel) */}
            {showArrows && safeArtists.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  aria-label="Previous artists"
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4',
                    'w-12 h-12 flex items-center justify-center rounded-full shadow-lg',
                    'hover:opacity-90 hidden sm:flex',
                    arrowButtonClassName ??
                      (sectionBackground === 'header'
                        ? 'bg-[#FFBA94] text-[#390000]'
                        : 'bg-white text-neutral-900'),
                    !canScrollLeft && 'opacity-50 cursor-not-allowed pointer-events-none'
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  aria-label="Next artists"
                  className={cn(
                    'absolute right-0 top-1/2 -translate-y-1/2 translate-x-4',
                    'w-12 h-12 flex items-center justify-center rounded-full shadow-lg',
                    'hover:opacity-90 hidden sm:flex',
                    arrowButtonClassName ??
                      (sectionBackground === 'header'
                        ? 'bg-[#FFBA94] text-[#390000]'
                        : 'bg-white text-neutral-900'),
                    !canScrollRight && 'opacity-50 cursor-not-allowed pointer-events-none'
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}

            {/* Progress Bar */}
            {showProgressBar && !autoScroll && (
              <div className="mt-6 w-full h-1 bg-gray-200 rounded-full overflow-hidden px-5 sm:px-8 lg:px-12">
                <div
                  ref={progressBarRef}
                  className="h-full bg-gray-900 rounded-full transition-all duration-300"
                  style={{ width: `${scrollProgress * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Trailing content (e.g. value prop banner) */}
          {trailingContent && (
            <div className="mt-8 sm:mt-10 px-5 sm:px-8 lg:px-12">{trailingContent}</div>
          )}

          {/* Footer cue + scarcity (inside section) */}
          {(footerCue || footerScarcity) && (
            <div className="text-center space-y-2 mt-8 sm:mt-10">
              {footerCue && footerCueHref && (
                <a
                  href={footerCueHref}
                  className={cn(
                    'block text-base sm:text-lg underline underline-offset-2 transition-colors',
                    sectionBackground === 'header' && 'text-[#FFBA94] hover:text-[#FFBA94]/90',
                    sectionBackground === 'headerSubtle' && 'text-[#390000] hover:text-[#390000]/90',
                    sectionBackground !== 'header' && sectionBackground !== 'headerSubtle' && 'text-neutral-600 hover:text-neutral-900'
                  )}
                >
                  {footerCue}
                </a>
              )}
              {footerCue && !footerCueHref && (
                <p className={cn(
                  'text-base sm:text-lg',
                  sectionBackground === 'header' && 'text-[#FFBA94]',
                  sectionBackground === 'headerSubtle' && 'text-[#390000]',
                  sectionBackground !== 'header' && sectionBackground !== 'headerSubtle' && 'text-neutral-600'
                )}>
                  {footerCue}
                </p>
              )}
              {footerScarcity && (
                <div
                  className={cn(
                    'inline-flex flex-col items-center gap-3 rounded-2xl px-6 py-5 sm:px-8 sm:py-6',
                    'bg-[#390000]/10 text-center max-w-md mx-auto'
                  )}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-[#390000]/10">
                    <svg
                      className={cn(
                        'w-6 h-6 sm:w-7 sm:h-7',
                        sectionBackground === 'header' && 'text-[#FFBA94]',
                        sectionBackground === 'headerSubtle' && 'text-[#390000]',
                        sectionBackground !== 'header' && sectionBackground !== 'headerSubtle' && 'text-neutral-600'
                      )}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <p
                    className={cn(
                      'text-sm sm:text-base',
                      sectionBackground === 'header' && 'text-[#FFBA94]/90',
                      sectionBackground === 'headerSubtle' && 'text-[#390000]',
                      sectionBackground !== 'header' && sectionBackground !== 'headerSubtle' && 'text-neutral-600'
                    )}
                  >
                    {footerScarcity}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Value prop tiles (e.g. Collect original art, Live with it, Support artists) */}
          {valueProps && valueProps.length > 0 && (
            <div className="px-4 sm:px-6 md:px-8 mt-8 sm:mt-10">
              <div
                className={cn(
                  'flex flex-col gap-6 sm:gap-8',
                  'md:grid md:grid-cols-3 md:gap-8 md:items-stretch'
                )}
              >
                {valueProps.map((prop, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex flex-col gap-2 sm:gap-3 text-center items-center w-full',
                      'bg-[#390000]/10 rounded-xl p-4 sm:p-5',
                      'border border-[#390000]/20'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full',
                        'font-body text-sm sm:text-base font-medium tabular-nums',
                        'bg-[#390000] text-white'
                      )}
                    >
                      {i + 1}
                    </span>
                    <h3
                      className={cn(
                        'font-body text-sm sm:text-base md:text-lg font-normal tracking-tight',
                        sectionBackground === 'header' && 'text-[#FFBA94]',
                        sectionBackground === 'headerSubtle' && 'text-[#390000]',
                        sectionBackground !== 'header' && sectionBackground !== 'headerSubtle' && 'text-neutral-900'
                      )}
                    >
                      {prop.title}
                    </h3>
                    <p
                      className={cn(
                        'font-body text-xs sm:text-sm leading-relaxed max-w-none',
                        sectionBackground === 'header' && 'text-[#FFBA94]/90',
                        sectionBackground === 'headerSubtle' && 'text-neutral-600',
                        sectionBackground !== 'header' && sectionBackground !== 'headerSubtle' && 'text-neutral-600'
                      )}
                    >
                      {prop.description}
                    </p>
                  </div>
                ))}
              </div>
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
