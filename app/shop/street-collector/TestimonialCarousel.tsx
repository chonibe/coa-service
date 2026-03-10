'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { SectionWrapper, Container } from '@/components/impact'
import { LazyVideo } from '@/components/LazyVideo'

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

/** Video/image aspect ratio 4×5 to match value props section. */
const MEDIA_ASPECT_RATIO = 4 / 5

/**
 * Single card section with horizontal carousel of testimonials.
 * Matches "Bringing art into everyday life" styling: one dark card, content inside.
 * Carousel: arrows, dots, auto-scroll.
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

  const REPEAT_COUNT = 8
  const infiniteList = n > 0 ? Array.from({ length: REPEAT_COUNT }, () => safeList).flat() : []
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
    if (currentCardIndex <= 0) scrollToCard(totalCards - 1)
    else scrollToCard(currentCardIndex - 1)
  }

  const goNext = () => {
    if (totalCards === 0) return
    if (currentCardIndex >= totalCards - 1) scrollToCard(0)
    else scrollToCard(currentCardIndex + 1)
  }

  const goNextRef = React.useRef(goNext)
  goNextRef.current = goNext
  React.useEffect(() => {
    if (totalCards <= 1) return
    const t = setInterval(() => goNextRef.current(), 5000)
    return () => clearInterval(t)
  }, [totalCards])

  const currentIndex = n > 0 ? currentCardIndex % n : 0

  return (
    <SectionWrapper spacing="sm" fullWidth={fullWidth} background="header" className={cn('bg-[#1a0a0a]', className)}>
      <Container maxWidth="default" paddingX="gutter">
        {(title || subtitle) && (
          <div className="text-center mb-6 sm:mb-8 px-0">
            {title && (
              <h2 className="font-serif font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#FFBA94] tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-3 sm:mt-4 text-base sm:text-xl md:text-2xl max-w-2xl mx-auto text-[#FFBA94]/80 px-2 sm:px-0">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Single card containing carousel */}
        <article
          className={cn(
            'w-full overflow-hidden',
            'bg-[#1a0a0a] rounded-2xl shadow-lg',
            'p-4 sm:p-6 md:p-8'
          )}
        >
          <div className="relative -mx-2 sm:-mx-4">
            <div
              ref={scrollRef}
              className={cn(
                'flex gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory',
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
                    'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4',
                    'w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-[#FFBA94]/90 text-[#390000] shadow-lg',
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
                    'absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4',
                    'w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-[#FFBA94]/90 text-[#390000] shadow-lg',
                    'hover:opacity-90 hidden sm:flex'
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}

          </div>
        </article>
      </Container>
    </SectionWrapper>
  )
}

function TestimonialCard({ item }: { item: TestimonialCardItem }) {
  const { author, content, rating, media } = item

  return (
    <div
      className={cn(
        'flex-shrink-0 snap-start flex flex-col',
        'w-[200px] min-[375px]:w-[240px] sm:w-[280px] md:w-[320px]'
      )}
    >
      {media && (
        <div
          className="relative w-full overflow-hidden flex-shrink-0 rounded-lg"
          style={{ aspectRatio: MEDIA_ASPECT_RATIO }}
        >
          {media.type === 'video' ? (
            <LazyVideo
              src={media.video.startsWith('https://cdn.shopify.com/') ? media.video : `/api/proxy-video?url=${encodeURIComponent(media.video)}`}
              poster={getProxiedImageUrl(media.poster)}
              autoPlay
            >
              <track kind="captions" src="/captions/hero-no-speech.vtt" srcLang="en" label="English" />
            </LazyVideo>
          ) : (
            <img
              src={getProxiedImageUrl(media.src)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:gap-3 text-center w-full pt-4 sm:pt-5">
        <div className="flex items-center justify-center gap-0.5 shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={star <= rating ? 'text-amber-400' : 'text-[#FFBA94]/40'}>
              <svg className="size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </span>
          ))}
        </div>

        <p className="text-neutral-300 text-sm sm:text-base leading-relaxed line-clamp-4">
          {content}
        </p>

        <div className="text-neutral-400 text-sm font-medium">
          {author}
        </div>
      </div>
    </div>
  )
}
