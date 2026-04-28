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
  /** Optional hero image behind the section (proxied); fades into section background */
  backdropImageSrc?: string
  /** Uppercase monochrome header; hides decorative stars above title */
  variant?: 'default' | 'editorial'
}

/** Video/image aspect ratio 4×5 to match value props section. */
const MEDIA_ASPECT_RATIO = 4 / 5

/** Light, readable testimonial panel (not peach-on-burgundy). */
const testimonialPanelClass = cn(
  'rounded-[28px] w-full overflow-visible border border-stone-200/90 bg-white shadow-md',
  'dark:border-[#ffba94]/10 dark:bg-[#1d1b1b] dark:shadow-[0_16px_40px_rgba(0,0,0,0.45)]'
)

const testimonialPanelEditorialClass = cn(
  'rounded-none w-full overflow-visible border border-neutral-200/90 bg-neutral-50 shadow-sm',
  'dark:border-white/10 dark:bg-neutral-900/40 dark:shadow-none'
)

const carouselFocusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-stone-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-[#c4a574]/45 dark:focus-visible:ring-offset-[#1d1b1b]'

/**
 * Horizontal testimonial carousel: snap scrolling, finite slides (no duplicate strip).
 * Mobile: one full-width slide per view + swipe + prev/next + dots.
 * Long quotes: collapsed with line clamp + Read more / Show less.
 */
export function TestimonialCarousel({
  title,
  subtitle,
  testimonials,
  fullWidth = true,
  className,
  backdropImageSrc,
  variant = 'default',
}: TestimonialCarouselProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0)

  const safeList = Array.isArray(testimonials) ? testimonials : []
  const n = safeList.length
  /** sm+: gap between cards matches gap-6 (24px) */
  const gapSm = 24

  const getStep = React.useCallback(() => {
    const el = scrollRef.current
    if (!el || !el.firstElementChild) return 0
    const first = el.firstElementChild as HTMLElement
    return first.offsetWidth + (window.matchMedia('(min-width: 640px)').matches ? gapSm : 0)
  }, [])

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current
    if (!el || n === 0) return
    const step = getStep()
    if (step === 0) return
    const raw = Math.round(el.scrollLeft / step)
    const idx = Math.max(0, Math.min(raw, n - 1))
    setCurrentCardIndex(idx)
  }, [n, getStep])

  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    checkScroll()
    return () => el.removeEventListener('scroll', checkScroll)
  }, [checkScroll])

  React.useEffect(() => {
    const onResize = () => {
      scrollRef.current?.dispatchEvent(new Event('scroll'))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const scrollToCard = React.useCallback(
    (cardIndex: number) => {
      const el = scrollRef.current
      if (!el || n === 0) return
      const step = getStep()
      if (step === 0) return
      const clamped = Math.max(0, Math.min(cardIndex, n - 1))
      el.scrollTo({ left: clamped * step, behavior: 'smooth' })
    },
    [n, getStep]
  )

  const goPrev = () => {
    if (n === 0) return
    if (currentCardIndex <= 0) scrollToCard(n - 1)
    else scrollToCard(currentCardIndex - 1)
  }

  const goNext = () => {
    if (n === 0) return
    if (currentCardIndex >= n - 1) scrollToCard(0)
    else scrollToCard(currentCardIndex + 1)
  }

  const goNextRef = React.useRef(goNext)
  goNextRef.current = goNext
  React.useEffect(() => {
    if (n <= 1) return
    const t = setInterval(() => goNextRef.current(), 5000)
    return () => clearInterval(t)
  }, [n])

  React.useEffect(() => {
    setCurrentCardIndex((i) => (n === 0 ? 0 : Math.min(i, n - 1)))
  }, [n])

  return (
    <SectionWrapper
      spacing="sm"
      fullWidth={fullWidth}
      background={variant === 'editorial' ? 'default' : 'experience'}
      overflow="visible"
      className={cn(
        'relative',
        variant === 'editorial' && 'bg-white dark:bg-neutral-950',
        className
      )}
    >
      {backdropImageSrc ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center"
          aria-hidden
        >
          <div className="relative h-[min(220px,42vw)] w-full max-w-4xl sm:h-[min(260px,40vw)] md:h-[min(320px,38vh)] lg:h-[min(360px,36vh)]">
            <img
              src={getProxiedImageUrl(backdropImageSrc)}
              alt=""
              width={1200}
              height={280}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-top opacity-[0.38] sm:opacity-[0.42] md:opacity-[0.45]"
            />
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-b to-white dark:to-neutral-950',
                variant === 'editorial'
                  ? 'from-white/40 via-white/80 dark:from-neutral-950/40 dark:via-neutral-950/85'
                  : 'from-[#faf8f5]/35 via-[#faf8f5]/65 dark:from-[#171515]/25 dark:via-[#171515]/60'
              )}
              aria-hidden
            />
          </div>
        </div>
      ) : null}
      <Container maxWidth="default" paddingX="gutter" className="relative z-10">
        {(title || subtitle) && (
          <div className="text-center mb-6 sm:mb-8 px-0">
            {title && (
              <>
                {variant !== 'editorial' ? (
                  <p
                    className="mb-3 text-center text-lg text-amber-900/85 tracking-[0.35em] dark:text-[#FFBA94] sm:text-xl md:text-2xl"
                    aria-hidden
                  >
                    ★★★★★
                  </p>
                ) : null}
                <h2
                  className={cn(
                    variant === 'editorial'
                      ? 'font-sans text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500 dark:text-neutral-400 sm:text-sm'
                      : 'font-serif font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-amber-950/90 tracking-tight dark:text-[#FFBA94]'
                  )}
                >
                  {title}
                </h2>
              </>
            )}
            {subtitle && (
              <p className="mt-3 sm:mt-4 text-base sm:text-xl md:text-2xl max-w-2xl mx-auto px-2 text-amber-900/75 dark:text-[#FFBA94]/80 sm:px-0">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Carousel: mobile = one full-width snap slide + swipe; sm+ = fixed-width cards */}
        <article
          className={cn(
            variant === 'editorial' ? testimonialPanelEditorialClass : testimonialPanelClass,
            'p-3 pb-5 sm:p-6 md:p-8'
          )}
        >
          <div className="relative">
            <div
              ref={scrollRef}
              className={cn(
                'flex touch-pan-x snap-x snap-mandatory scrollbar-hide',
                'gap-0 sm:gap-6',
                'overflow-x-auto overflow-y-visible overscroll-x-contain scroll-smooth',
                '-mx-1 px-1 sm:mx-0 sm:px-0'
              )}
              style={{ WebkitOverflowScrolling: 'touch' }}
              aria-roledescription="carousel"
            >
              {safeList.map((item, i) => (
                <TestimonialCard key={`${item.id}-${i}`} item={item} slideIndex={i} />
              ))}
            </div>

            {n > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous testimonial"
                  className={cn(
                    carouselFocusRing,
                    'absolute left-0 top-[42%] z-[1] -translate-x-1 -translate-y-1/2 sm:-translate-x-3 md:top-1/2',
                    'flex size-9 items-center justify-center rounded-full border border-stone-200/90 bg-white shadow-md sm:size-11',
                    'text-stone-800 hover:bg-stone-50 dark:border-[#ffba94]/15 dark:bg-[#2a2828] dark:text-[#ffdfc8] dark:hover:bg-[#333]'
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px] sm:size-5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next testimonial"
                  className={cn(
                    carouselFocusRing,
                    'absolute right-0 top-[42%] z-[1] translate-x-1 -translate-y-1/2 sm:translate-x-3 md:top-1/2',
                    'flex size-9 items-center justify-center rounded-full border border-stone-200/90 bg-white shadow-md sm:size-11',
                    'text-stone-800 hover:bg-stone-50 dark:border-[#ffba94]/15 dark:bg-[#2a2828] dark:text-[#ffdfc8] dark:hover:bg-[#333]'
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px] sm:size-5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                <div
                  className="mt-3 flex justify-center gap-1 sm:mt-4"
                  role="tablist"
                  aria-label="Testimonial slides"
                >
                  {safeList.map((item, dotIdx) => (
                    <button
                      key={`dot-${item.id}-${dotIdx}`}
                      type="button"
                      role="tab"
                      aria-selected={dotIdx === currentCardIndex}
                      aria-label={`Go to testimonial ${dotIdx + 1} of ${n}`}
                      onClick={() => scrollToCard(dotIdx)}
                      className={cn(
                        carouselFocusRing,
                        'min-h-[44px] min-w-[44px] shrink-0 p-3 [-webkit-tap-highlight-color:transparent]',
                        'flex items-center justify-center rounded-full'
                      )}
                    >
                      <span
                        className={cn(
                          'block rounded-full transition-[width] duration-200',
                          dotIdx === currentCardIndex
                            ? 'h-1 w-3 bg-stone-700 dark:bg-[#ffdfc8]'
                            : 'size-1 bg-stone-300 hover:bg-stone-400 dark:bg-white/25 dark:hover:bg-white/40'
                        )}
                        aria-hidden
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </article>
      </Container>
    </SectionWrapper>
  )
}

function TestimonialCard({ item, slideIndex }: { item: TestimonialCardItem; slideIndex: number }) {
  const { author, content, rating, media } = item
  const bodyId = `testimonial-body-${slideIndex}-${item.id}`
  const [expanded, setExpanded] = React.useState(false)
  const bodyRef = React.useRef<HTMLParagraphElement>(null)
  const [canToggle, setCanToggle] = React.useState(false)

  React.useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const measure = () => {
      if (expanded) {
        setCanToggle(true)
        return
      }
      setCanToggle(el.scrollHeight > el.clientHeight + 2)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [content, expanded])

  return (
    <div
      className={cn(
        'flex shrink-0 snap-center flex-col px-2 sm:px-0',
        'min-w-0 flex-[0_0_100%] basis-full sm:flex-[0_0_auto] sm:basis-auto sm:snap-start',
        'sm:w-[280px] sm:min-w-[280px] md:w-[320px] md:min-w-[320px]'
      )}
    >
      {media && (
        <div
          className="relative w-full shrink-0 overflow-hidden rounded-lg"
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
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      <div className="flex w-full flex-col gap-2 pt-4 text-center sm:gap-3 sm:pt-5">
        <div className="flex shrink-0 items-center justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={star <= rating ? 'text-amber-500 dark:text-amber-400' : 'text-stone-300 dark:text-white/25'}>
              <svg className="size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </span>
          ))}
        </div>

        <div className="min-w-0 text-left sm:text-center">
          <p
            ref={bodyRef}
            id={bodyId}
            className={cn(
              'text-sm leading-relaxed text-stone-700 sm:text-base dark:text-neutral-200',
              !expanded && 'line-clamp-5'
            )}
          >
            {content}
          </p>
          {canToggle ? (
            <button
              type="button"
              className={cn(
                carouselFocusRing,
                'mt-2 -mx-1 rounded px-1 text-left text-sm font-medium text-stone-800 underline underline-offset-2 hover:text-stone-950 dark:text-[#ffdfc8] dark:hover:text-[#ffe8d8]'
              )}
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-controls={bodyId}
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          ) : null}
        </div>

        <div className="text-sm font-medium text-stone-600 dark:text-neutral-400">
          {author}
        </div>
      </div>
    </div>
  )
}
