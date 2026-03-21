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
import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Container, SectionWrapper, SectionHeader, Button } from '@/components/impact'

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
  sectionBackground?:
    | 'default'
    | 'muted'
    | 'dark'
    | 'header'
    | 'experience'
    | 'headerSubtle'
    | 'primary'
    | 'secondary'
    | 'transparent'
    | 'gradient'
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
  const isExperienceCanvas =
    sectionBackground === 'header' || sectionBackground === 'experience'
  const sectionBgForWrapper =
    sectionBackground === 'experience' ? 'experience' : sectionBackground
  const sectionRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [revealedCardKey, setRevealedCardKey] = useState<string | null>(null)

  // Check scroll state
  const checkScrollState = useCallback(() => {
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

  const [cardsVisible, setCardsVisible] = useState(false)

  // Scroll-triggered entrance via IntersectionObserver (replaces GSAP ScrollTrigger)
  useEffect(() => {
    const container = cardsContainerRef.current
    if (!container) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setCardsVisible(true); observer.disconnect() } },
      { rootMargin: '0px 0px -100px 0px' }
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Depth/parallax on horizontal scroll (replaces GSAP gsap.to per card)
  const applyDepth = useCallback(() => {
    const container = cardsContainerRef.current
    if (!container) return
    const cards = container.children
    const containerRect = container.getBoundingClientRect()
    const containerCenter = containerRect.left + containerRect.width / 2
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement
      const rect = card.getBoundingClientRect()
      const cardCenter = rect.left + rect.width / 2
      const dist = (cardCenter - containerCenter) / containerRect.width
      const scale = Math.max(0.95, Math.min(1, 1 - Math.abs(dist) * 0.05))
      const opacity = Math.max(0.7, Math.min(1, 1 - Math.abs(dist) * 0.2))
      card.style.transform = `scale(${scale})`
      card.style.opacity = `${opacity}`
    }
  }, [])

  useEffect(() => {
    const container = cardsContainerRef.current
    if (!container) return
    container.addEventListener('scroll', applyDepth, { passive: true })
    applyDepth()
    return () => container.removeEventListener('scroll', applyDepth)
  }, [applyDepth, safeArtists.length])

  // Monitor scroll state
  useEffect(() => {
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

  // Defer artist duplication until auto-scroll actually starts so extra images
  // don't load eagerly (saves ~2MB on initial paint for Lighthouse)
  const [duplicated, setDuplicated] = useState(false)
  const displayArtists = duplicated && autoScroll && safeArtists.length > 0
    ? [...safeArtists, ...safeArtists]
    : safeArtists

  useEffect(() => {
    if (!autoScroll || safeArtists.length === 0) return

    let intervalId: ReturnType<typeof setInterval> | null = null
    let timeoutId: ReturnType<typeof setTimeout>

    const startScroll = () => {
      setDuplicated(true)
      const container = cardsContainerRef.current
      if (!container) return false
      const first = container.firstElementChild as HTMLElement
      if (!first) return false
      const step = (first.offsetWidth || cardWidth) + cardGap
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
        timeoutId = setTimeout(startScroll, 1000)
      }
    }, 4000)

    return () => {
      clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoScroll, safeArtists.length, cardGap, cardWidth])

  if (safeArtists.length === 0) return null

  return (
    <SectionWrapper
      ref={sectionRef}
      spacing="md"
      background={sectionBgForWrapper}
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
                  isExperienceCanvas
                    ? 'bg-[#FFBA94]/10 border border-[#FFBA94]/20'
                    : 'bg-[#390000]/10 border border-[#390000]/20'
                )}
              >
                <h2
                  className={cn(
                    'font-serif text-sm sm:text-base font-medium tracking-tight',
                    titleClassName ?? (isExperienceCanvas ? 'text-[#FFBA94]' : 'text-[#390000]')
                  )}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p
                    className={cn(
                      'mt-0.5 text-xs sm:text-sm',
                      isExperienceCanvas ? 'text-[#FFBA94]/80' : 'text-[#390000]/80'
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
            isExperienceCanvas && 'text-[#FFBA94]/90',
            sectionBackground === 'headerSubtle' && 'text-[#390000]/90',
            !isExperienceCanvas && sectionBackground !== 'headerSubtle' && 'text-neutral-600'
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
                const staggerDelay = cardsVisible ? `${Math.min(index, 8) * 100}ms` : undefined
                const nameBlock = (
                  <div
                    className={cn(
                      'pt-3 text-center',
                      isExperienceCanvas && 'text-[#FFBA94]',
                      sectionBackground === 'headerSubtle' && 'text-[#390000]',
                      !isExperienceCanvas && sectionBackground !== 'headerSubtle' && 'text-neutral-700'
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
                        loading="lazy"
                        decoding="async"
                        width={cardWidth}
                        height={Math.round(cardWidth * 5 / 3)}
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
                    <div
                      className={cn(
                        'absolute bottom-0 left-0 right-0 bg-gradient-to-t p-4 sm:p-5 text-[#FFBA94]',
                        isExperienceCanvas
                          ? 'from-black/90 via-black/50 to-transparent'
                          : 'from-[#390000]/90 via-[#390000]/50 to-transparent'
                      )}
                    >
                      <h3 className="font-semibold text-lg sm:text-xl">{artist.name}</h3>
                      {artist.location && (
                        <p className="text-sm opacity-90">{artist.location}</p>
                      )}
                    </div>
                    )}
                    
                    {/* Hover/click overlay: dark bg + description only (no name/city) */}
                    <div
                      className={cn(
                        'absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100',
                        isExperienceCanvas ? 'bg-black/70' : 'bg-[#390000]/70',
                        showInfoSheet && 'group-data-[revealed=true]:opacity-100'
                      )}
                    />
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
                      <div
                        className={cn(
                          'absolute inset-0 bg-gradient-to-t opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                          isExperienceCanvas
                            ? 'from-black/80 via-black/25 to-transparent'
                            : 'from-[#390000]/80 via-[#390000]/20 to-transparent'
                        )}
                      />
                    ) : null}
                  </div>
                  {namePosition === 'below' && nameBlock}
                  </div>
                )

                const cardHref = artist.href ?? (showInfoSheet ? undefined : `/shop?collection=${artist.handle}`)
                const cardClassName = cn(
                  'group flex-shrink-0 relative w-full transition-[transform,opacity] duration-500 ease-out',
                  cardsVisible ? 'artist-card-enter' : 'opacity-0 translate-y-[50px] scale-95'
                )
                const cardStyle: React.CSSProperties = {
                  width: `${cardWidth}px`,
                  ...(staggerDelay ? { animationDelay: staggerDelay } : {}),
                }

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
                      (isExperienceCanvas
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
                      (isExperienceCanvas
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
              <div
                className={cn(
                  'mt-6 h-1 w-full overflow-hidden rounded-full px-5 sm:px-8 lg:px-12',
                  isExperienceCanvas ? 'bg-white/15' : 'bg-gray-200'
                )}
              >
                <div
                  ref={progressBarRef}
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    isExperienceCanvas ? 'bg-[#FFBA94]/80' : 'bg-gray-900'
                  )}
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
                    isExperienceCanvas && 'text-[#FFBA94] hover:text-[#FFBA94]/90',
                    sectionBackground === 'headerSubtle' && 'text-[#390000] hover:text-[#390000]/90',
                    !isExperienceCanvas && sectionBackground !== 'headerSubtle' && 'text-neutral-600 hover:text-neutral-900'
                  )}
                >
                  {footerCue}
                </a>
              )}
              {footerCue && !footerCueHref && (
                <p className={cn(
                  'text-base sm:text-lg',
                  isExperienceCanvas && 'text-[#FFBA94]',
                  sectionBackground === 'headerSubtle' && 'text-[#390000]',
                  !isExperienceCanvas && sectionBackground !== 'headerSubtle' && 'text-neutral-600'
                )}>
                  {footerCue}
                </p>
              )}
              {footerScarcity && (
                <div
                  className={cn(
                    'inline-flex max-w-md flex-col items-center gap-3 rounded-2xl px-6 py-5 text-center sm:px-8 sm:py-6',
                    isExperienceCanvas
                      ? 'border border-[#ffba94]/15 bg-[#201c1c]/55'
                      : 'bg-[#390000]/10'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl sm:h-14 sm:w-14',
                      isExperienceCanvas ? 'border border-[#ffba94]/20 bg-[#ffba94]/10' : 'bg-[#390000]/10'
                    )}
                  >
                    <svg
                      className={cn(
                        'w-6 h-6 sm:w-7 sm:h-7',
                        isExperienceCanvas && 'text-[#FFBA94]',
                        sectionBackground === 'headerSubtle' && 'text-[#390000]',
                        !isExperienceCanvas && sectionBackground !== 'headerSubtle' && 'text-neutral-600'
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
                      isExperienceCanvas && 'text-[#FFBA94]/90',
                      sectionBackground === 'headerSubtle' && 'text-[#390000]',
                      !isExperienceCanvas && sectionBackground !== 'headerSubtle' && 'text-neutral-600'
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
                      'flex w-full flex-col items-center gap-2 text-center sm:gap-3',
                      'rounded-xl p-4 sm:p-5',
                      isExperienceCanvas
                        ? 'border border-[#ffba94]/15 bg-[#201c1c]/55'
                        : 'border border-[#390000]/20 bg-[#390000]/10'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-full font-body text-sm font-medium tabular-nums sm:h-8 sm:w-8 sm:text-base',
                        isExperienceCanvas ? 'bg-[#FFBA94] text-[#390000]' : 'bg-[#390000] text-white'
                      )}
                    >
                      {i + 1}
                    </span>
                    <h3
                      className={cn(
                        'font-body text-sm sm:text-base md:text-lg font-normal tracking-tight',
                        isExperienceCanvas && 'text-[#FFBA94]',
                        sectionBackground === 'headerSubtle' && 'text-[#390000]',
                        !isExperienceCanvas && sectionBackground !== 'headerSubtle' && 'text-neutral-900'
                      )}
                    >
                      {prop.title}
                    </h3>
                    <p
                      className={cn(
                        'font-body text-xs sm:text-sm leading-relaxed max-w-none',
                        isExperienceCanvas && 'text-[#FFBA94]/90',
                        sectionBackground === 'headerSubtle' && 'text-neutral-600',
                        !isExperienceCanvas && sectionBackground !== 'headerSubtle' && 'text-neutral-600'
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
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(50px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .artist-card-enter {
          animation: cardEnter 0.6s cubic-bezier(0.33, 1, 0.68, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .artist-card-enter { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
    </SectionWrapper>
  )
}
