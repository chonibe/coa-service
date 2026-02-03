'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { SectionWrapper, Container } from '@/components/impact'

/**
 * Press / Testimonials Carousel Section
 * 
 * Horizontal carousel for press quotes and testimonials, matching the Impact theme press section.
 */

export interface PressQuote {
  id: string
  author: string
  content: string
  logo?: string
  logoWidth?: number
  rating?: number // 1-5
  showRating?: boolean
}

export interface PressCarouselProps {
  quotes: PressQuote[]
  title?: string
  subtitle?: string
  contentSize?: 'small' | 'medium' | 'large'
  autoplay?: boolean
  autoplaySpeed?: number
  showArrows?: boolean
  showDots?: boolean
  backgroundColor?: string
  textColor?: string
  fullWidth?: boolean
  className?: string
}

export function PressCarousel({
  quotes,
  title,
  subtitle,
  contentSize = 'medium',
  autoplay = false,
  autoplaySpeed = 5000,
  showArrows = true,
  showDots = true,
  backgroundColor,
  textColor,
  fullWidth = true,
  className,
}: PressCarouselProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(true)

  // Size classes
  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-md',
    large: 'max-w-lg',
  }

  // Check scroll state
  const checkScrollState = React.useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )

    // Calculate current index
    const cardWidth = container.firstElementChild?.clientWidth || 0
    const gap = 24 // Gap between cards
    const index = Math.round(container.scrollLeft / (cardWidth + gap))
    setCurrentIndex(index)
  }, [])

  // Scroll to index
  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current
    if (!container) return

    const cardWidth = container.firstElementChild?.clientWidth || 0
    const gap = 24
    container.scrollTo({
      left: index * (cardWidth + gap),
      behavior: 'smooth',
    })
  }

  // Navigation
  const scrollPrev = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1)
    }
  }

  const scrollNext = () => {
    if (currentIndex < quotes.length - 1) {
      scrollToIndex(currentIndex + 1)
    }
  }

  // Setup scroll listener
  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', checkScrollState)
    checkScrollState()

    return () => container.removeEventListener('scroll', checkScrollState)
  }, [checkScrollState])

  // Autoplay
  React.useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      if (currentIndex < quotes.length - 1) {
        scrollToIndex(currentIndex + 1)
      } else {
        scrollToIndex(0)
      }
    }, autoplaySpeed)

    return () => clearInterval(interval)
  }, [autoplay, autoplaySpeed, currentIndex, quotes.length])

  return (
    <SectionWrapper
      spacing="md"
      fullWidth={fullWidth}
      className={className}
      style={{ backgroundColor }}
    >
      <Container maxWidth="default" paddingX="gutter">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-8 sm:mb-12">
            {title && (
              <h2
                className="font-heading text-impact-h2 xl:text-impact-h2-lg font-semibold tracking-[-0.02em]"
                style={{ color: textColor || '#1a1a1a' }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="mt-3 text-base sm:text-lg max-w-2xl mx-auto"
                style={{ color: textColor ? `${textColor}99` : '#1a1a1a99' }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Carousel */}
        <div className="relative">
          {/* Scroll container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
            style={{ scrollPaddingLeft: '1.25rem' }}
          >
            {quotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                sizeClass={sizeClasses[contentSize]}
                textColor={textColor}
              />
            ))}
          </div>

          {/* Navigation arrows */}
          {showArrows && quotes.length > 1 && (
            <>
              <button
                type="button"
                onClick={scrollPrev}
                disabled={!canScrollLeft}
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4',
                  'w-12 h-12 flex items-center justify-center rounded-full',
                  'bg-white shadow-impact-md',
                  'transition-all duration-200',
                  'hover:shadow-impact-lg hover:scale-105',
                  'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
                  'hidden sm:flex'
                )}
                aria-label="Previous quote"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={!canScrollRight}
                className={cn(
                  'absolute right-0 top-1/2 -translate-y-1/2 translate-x-4',
                  'w-12 h-12 flex items-center justify-center rounded-full',
                  'bg-white shadow-impact-md',
                  'transition-all duration-200',
                  'hover:shadow-impact-lg hover:scale-105',
                  'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
                  'hidden sm:flex'
                )}
                aria-label="Next quote"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {showDots && quotes.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {quotes.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollToIndex(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentIndex
                    ? 'bg-[#2c4bce] w-6'
                    : 'bg-[#1a1a1a]/20 hover:bg-[#1a1a1a]/40'
                )}
                aria-label={`Go to quote ${index + 1}`}
              />
            ))}
          </div>
        )}
      </Container>
    </SectionWrapper>
  )
}

/**
 * Quote Card Component
 */
interface QuoteCardProps {
  quote: PressQuote
  sizeClass: string
  textColor?: string
}

function QuoteCard({ quote, sizeClass, textColor }: QuoteCardProps) {
  return (
    <div
      className={cn(
        'flex-shrink-0 snap-start',
        sizeClass,
        'w-[85vw] sm:w-auto',
        'p-6 sm:p-8',
        'bg-white rounded-[24px] shadow-impact-block'
      )}
    >
      {/* Logo */}
      {quote.logo && (
        <img
          src={quote.logo}
          alt=""
          className="h-8 mb-4 object-contain"
          style={{ width: quote.logoWidth || 'auto' }}
        />
      )}

      {/* Content */}
      <blockquote
        className="text-base sm:text-lg leading-relaxed mb-4"
        style={{ color: textColor || '#1a1a1a' }}
      >
        "{quote.content}"
      </blockquote>

      {/* Author & Rating */}
      <div className="flex items-center justify-between">
        <cite
          className="not-italic text-sm font-medium"
          style={{ color: textColor ? `${textColor}99` : '#1a1a1a99' }}
        >
          {quote.author}
        </cite>

        {quote.showRating && quote.rating && (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill={star <= quote.rating! ? '#f0c417' : '#e5e5e5'}
              >
                <path d="M8 1.33l2.06 4.18 4.61.67-3.34 3.25.79 4.59L8 11.84l-4.12 2.18.79-4.59L1.33 6.18l4.61-.67L8 1.33z" />
              </svg>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PressCarousel
