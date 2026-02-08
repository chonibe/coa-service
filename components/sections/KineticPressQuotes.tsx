/**
 * Kinetic Press Quotes
 * 
 * Animated typography for press quotes and testimonials:
 * - Quote text animates word-by-word or line-by-line
 * - Smooth crossfade between quotes
 * - Author attribution slides in with delay
 * - Optional parallax background
 * - Auto-advance or manual navigation
 * 
 * @example
 * ```tsx
 * <KineticPressQuotes
 *   quotes={[
 *     { author: '@artist', content: 'Amazing product!', rating: 5 }
 *   ]}
 *   autoAdvance={true}
 *   interval={5000}
 * />
 * ```
 */

'use client'

import * as React from 'react'
import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Container, SectionWrapper } from '@/components/impact'
import { gsap } from '@/lib/animations/gsap-config'
import { useGSAP } from '@gsap/react'
import { wrapTextInSpans } from '@/lib/animations/text-animations'

export interface Quote {
  id?: string
  author: string
  content: string
  rating?: number
  showRating?: boolean
}

export interface KineticPressQuotesProps {
  quotes: Quote[]
  /** Content size */
  contentSize?: 'small' | 'medium' | 'large'
  /** Auto-advance quotes */
  autoAdvance?: boolean
  /** Interval between quotes (ms) */
  interval?: number
  /** Show navigation arrows */
  showArrows?: boolean
  /** Show navigation dots */
  showDots?: boolean
  /** Full width layout */
  fullWidth?: boolean
  /** Background color */
  background?: 'default' | 'muted' | 'dark'
  className?: string
}

export function KineticPressQuotes({
  quotes,
  contentSize = 'medium',
  autoAdvance = true,
  interval = 6000,
  showArrows = true,
  showDots = true,
  fullWidth = true,
  background = 'default',
  className,
}: KineticPressQuotesProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const quoteRef = useRef<HTMLParagraphElement>(null)
  const authorRef = useRef<HTMLParagraphElement>(null)

  const currentQuote = quotes[currentIndex]

  // Auto-advance
  useEffect(() => {
    if (!autoAdvance || quotes.length <= 1) return

    const timer = setInterval(() => {
      next()
    }, interval)

    return () => clearInterval(timer)
  }, [currentIndex, autoAdvance, interval, quotes.length])

  const next = () => {
    if (isAnimating) return
    setCurrentIndex((prev) => (prev + 1) % quotes.length)
  }

  const prev = () => {
    if (isAnimating) return
    setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length)
  }

  const goTo = (index: number) => {
    if (isAnimating || index === currentIndex) return
    setCurrentIndex(index)
  }

  // Animate quote change
  useGSAP(() => {
    if (!quoteRef.current || !authorRef.current) return

    setIsAnimating(true)

    const quote = quoteRef.current
    const author = authorRef.current

    // Clear and wrap text
    quote.textContent = currentQuote.content
    author.textContent = currentQuote.author

    const quoteSpans = wrapTextInSpans(quote, { type: 'words' })
    const authorSpans = wrapTextInSpans(author, { type: 'chars' })

    // Create animation timeline
    const tl = gsap.timeline({
      onComplete: () => setIsAnimating(false),
    })

    // Fade out previous (if needed)
    tl.set([quote, author], { opacity: 1 })

    // Animate quote words in
    tl.from(quoteSpans, {
      opacity: 0,
      y: 30,
      rotateX: -45,
      transformOrigin: 'bottom center',
      stagger: {
        amount: 0.8,
        from: 'start',
      },
      duration: 0.6,
      ease: 'power2.out',
    })

    // Animate author in
    tl.from(
      authorSpans,
      {
        opacity: 0,
        x: -10,
        stagger: 0.02,
        duration: 0.4,
        ease: 'power2.out',
      },
      '-=0.2'
    )

    return () => {
      tl.kill()
    }
  }, { dependencies: [currentIndex], scope: containerRef })

  // Content size classes
  const sizeClasses = {
    small: 'text-lg sm:text-xl',
    medium: 'text-xl sm:text-2xl lg:text-3xl',
    large: 'text-2xl sm:text-3xl lg:text-4xl',
  }

  // Background classes
  const bgClasses = {
    default: 'bg-white',
    muted: 'bg-[#f5f5f5]',
    dark: 'bg-[#1a1a1a] text-white',
  }

  return (
    <SectionWrapper
      spacing="md"
      background={background === 'default' ? 'default' : background === 'muted' ? 'muted' : 'default'}
      className={cn(bgClasses[background], className)}
    >
      <Container maxWidth={fullWidth ? 'default' : 'narrow'} paddingX="gutter">
        <div ref={containerRef} className="relative">
          {/* Quote Container */}
          <div className="text-center py-12 sm:py-16 lg:py-20">
            {/* Stars Rating (if shown) */}
            {currentQuote.showRating && currentQuote.rating && (
              <div className="flex items-center justify-center gap-1 mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill={i < currentQuote.rating! ? '#f0c417' : 'none'}
                    stroke={i < currentQuote.rating! ? '#f0c417' : 'currentColor'}
                    strokeWidth="2"
                    className="opacity-80"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
            )}

            {/* Quote Text */}
            <blockquote className="mb-8">
              <p
                ref={quoteRef}
                className={cn(
                  'font-heading font-medium leading-relaxed max-w-4xl mx-auto',
                  sizeClasses[contentSize],
                  background === 'dark' ? 'text-white' : 'text-[#1a1a1a]'
                )}
                style={{ perspective: '1000px' }}
              >
                {currentQuote.content}
              </p>
            </blockquote>

            {/* Author */}
            <p
              ref={authorRef}
              className={cn(
                'text-sm sm:text-base font-medium',
                background === 'dark' ? 'text-white/70' : 'text-[#1a1a1a]/60'
              )}
            >
              {currentQuote.author}
            </p>
          </div>

          {/* Navigation Arrows */}
          {showArrows && quotes.length > 1 && (
            <>
              <button
                onClick={prev}
                disabled={isAnimating}
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2',
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  'transition-all duration-200',
                  'disabled:opacity-30 disabled:cursor-not-allowed',
                  background === 'dark'
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-[#1a1a1a]/5 hover:bg-[#1a1a1a]/10 text-[#1a1a1a]'
                )}
                aria-label="Previous quote"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={next}
                disabled={isAnimating}
                className={cn(
                  'absolute right-0 top-1/2 -translate-y-1/2',
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  'transition-all duration-200',
                  'disabled:opacity-30 disabled:cursor-not-allowed',
                  background === 'dark'
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-[#1a1a1a]/5 hover:bg-[#1a1a1a]/10 text-[#1a1a1a]'
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

        {/* Navigation Dots */}
        {showDots && quotes.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {quotes.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                disabled={isAnimating}
                className={cn(
                  'transition-all duration-300 rounded-full',
                  'disabled:cursor-not-allowed',
                  index === currentIndex
                    ? 'w-8 h-2'
                    : 'w-2 h-2',
                  index === currentIndex
                    ? background === 'dark'
                      ? 'bg-white'
                      : 'bg-[#f0c417]'
                    : background === 'dark'
                    ? 'bg-white/30 hover:bg-white/50'
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

export default KineticPressQuotes
