'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { SectionWrapper, Container } from '@/components/impact'

const STAR_SVG = (
  <svg className="size-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

export type TestimonialMedia =
  | { type: 'video'; poster: string; video: string }
  | { type: 'image'; src: string }

export interface TestimonialCardItem {
  id: string
  author: string
  content: string
  rating: number
  media?: TestimonialMedia
}

export interface TestimonialCarouselProps {
  title?: string
  subtitle?: string
  testimonials: TestimonialCardItem[]
  fullWidth?: boolean
  className?: string
}

/**
 * Testimonial carousel with media (video or image), 5-star rating, quote text, and author.
 * Matches thestreetcollector.com AI testimonial carousel structure.
 */
export function TestimonialCarousel({
  title,
  subtitle,
  testimonials,
  fullWidth = true,
  className,
}: TestimonialCarouselProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0)

  const safeList = Array.isArray(testimonials) ? testimonials : []
  const n = safeList.length
  const gap = 24

  // Repeat reviews so there is always a "next" card; keep count modest to avoid heavy DOM/media load.
  // 8 cycles = 8×n cards (e.g. 128 for 16 reviews); start in middle so infinite feel both ways.
  const REPEAT_COUNT = 8
  const infiniteList =
    n > 0 ? Array.from({ length: REPEAT_COUNT }, () => safeList).flat() : []
  const totalCards = infiniteList.length

  const getStep = React.useCallback(() => {
    const el = scrollRef.current
    if (!el || !el.firstElementChild) return 0
    return el.firstElementChild.clientWidth + gap
  }, [])

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current
    if (!el || totalCards === 0) return
    const step = getStep()
    if (step === 0) return
    const raw = Math.round(el.scrollLeft / step)
    const idx = Math.max(0, Math.min(raw, totalCards - 1))
    setCurrentCardIndex(idx)
  }, [totalCards, getStep])

  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll)
    checkScroll()
    return () => el.removeEventListener('scroll', checkScroll)
  }, [checkScroll])

  const hasInitializedScroll = React.useRef(false)
  React.useEffect(() => {
    if (totalCards === 0 || hasInitializedScroll.current) return
    const el = scrollRef.current
    if (!el || !el.firstElementChild) return
    const step = el.firstElementChild.clientWidth + gap
    const startIndex = Math.max(0, Math.floor(totalCards / 2) - Math.floor(n / 2))
    el.scrollLeft = startIndex * step
    setCurrentCardIndex(startIndex)
    hasInitializedScroll.current = true
  }, [totalCards, n])

  const scrollToCard = (cardIndex: number) => {
    const el = scrollRef.current
    if (!el || totalCards === 0) return
    const step = getStep()
    if (step === 0) return
    const clamped = Math.max(0, Math.min(cardIndex, totalCards - 1))
    el.scrollTo({ left: clamped * step, behavior: 'smooth' })
  }

  const goPrev = () => {
    if (totalCards === 0) return
    if (currentCardIndex <= 0) {
      scrollToCard(totalCards - 1)
    } else {
      scrollToCard(currentCardIndex - 1)
    }
  }

  const goNext = () => {
    if (totalCards === 0) return
    if (currentCardIndex >= totalCards - 1) {
      scrollToCard(0)
    } else {
      scrollToCard(currentCardIndex + 1)
    }
  }

  const goNextRef = React.useRef(goNext)
  goNextRef.current = goNext
  React.useEffect(() => {
    if (totalCards <= 1) return
    const t = setInterval(() => goNextRef.current(), 5000)
    return () => clearInterval(t)
  }, [totalCards])

  // Which of the n reviews we're showing (for dots)
  const currentIndex = n > 0 ? currentCardIndex % n : 0

  const scrollToDot = (reviewIndex: number) => {
    const cycle = Math.floor(currentCardIndex / n) * n
    scrollToCard(cycle + reviewIndex)
  }

  return (
    <SectionWrapper spacing="md" fullWidth={fullWidth} className={className}>
      <Container maxWidth="default" paddingX="gutter">
        {(title || subtitle) && (
          <div className="text-center mb-8 sm:mb-14 px-0">
            {title && (
              <h2 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.02em] text-neutral-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-3 sm:mt-4 text-base sm:text-xl md:text-2xl max-w-2xl mx-auto text-neutral-600 px-2 sm:px-0">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Full-bleed scroll on mobile - break out of container padding */}
        <div className="relative -mx-5 sm:-mx-8 lg:-mx-12">
          <div
            ref={scrollRef}
            className={cn(
              'flex gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory pb-4 pl-5 sm:pl-8 lg:pl-12 pr-5 sm:pr-8 lg:pr-12',
              'scroll-smooth'
            )}
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {infiniteList.map((item, i) => (
              <TestimonialCard key={`${item.id}-${i}`} item={item} />
            ))}
          </div>

          {n > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous testimonials"
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4',
                  'w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg',
                  'hover:opacity-90 hidden sm:flex'
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next testimonials"
                className={cn(
                  'absolute right-0 top-1/2 -translate-y-1/2 translate-x-4',
                  'w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg',
                  'hover:opacity-90 hidden sm:flex'
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          {n > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {safeList.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToDot(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={cn(
                    'w-[4px] h-[4px] min-w-0 min-h-0 p-0 rounded-full transition-colors shrink-0',
                    i === currentIndex ? 'bg-neutral-700' : 'bg-neutral-200 hover:bg-neutral-300'
                  )}
                  style={{ width: 4, height: 4 }}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </SectionWrapper>
  )
}

function TestimonialCard({ item }: { item: TestimonialCardItem }) {
  const { author, content, rating, media } = item

  return (
      <div
        className={cn(
          'flex-shrink-0 snap-start w-[280px] min-[375px]:w-[320px] sm:w-[380px] md:w-[400px]',
          'bg-white rounded-2xl shadow-lg overflow-hidden',
          'flex flex-col'
        )}
      >
      {media && (
        <div className="relative w-full aspect-[3/5] bg-neutral-100 overflow-hidden">
          {media.type === 'video' ? (
            <video
              playsInline
              muted
              loop
              autoPlay
              preload="none"
              poster={media.poster}
              className="absolute inset-0 w-full h-full object-cover [&::-webkit-media-controls]:hidden [&::-webkit-media-controls-panel]:hidden"
            >
              <source
                src={`/api/proxy-video?url=${encodeURIComponent(media.video)}`}
                type="video/mp4"
              />
              <img src={media.poster} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            </video>
          ) : (
            <img
              src={media.src}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      <div className="p-5 sm:p-6 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={star <= rating ? 'text-amber-500' : 'text-neutral-200'}>
              {STAR_SVG}
            </span>
          ))}
        </div>

        <p className="text-neutral-700 text-base sm:text-lg leading-relaxed whitespace-pre-line flex-1">
          {content}
        </p>

        <div className="text-neutral-500 text-base font-medium pt-1">
          {author}
        </div>
      </div>
    </div>
  )
}
