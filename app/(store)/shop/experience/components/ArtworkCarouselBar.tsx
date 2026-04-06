'use client'

import { useRef, useEffect, useState, useMemo, type RefObject } from 'react'
import Image from 'next/image'
import { ChevronRight, Eye, LayoutGrid, Plus, Trash2 } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import { useExperienceOrder } from '../../experience-v2/ExperienceOrderContext'
import { cn } from '@/lib/utils'
import {
  EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS,
  resolveExperienceNextAction,
} from '@/lib/shop/experience-journey-next-action'
import { getMiniSplineEmbedUrl } from '@/lib/shop/experience-carousel-mini-spline'
import type { CarouselStripLampSplineProps } from './CarouselStripLampSpline'
import { CarouselStripLampSpline } from './CarouselStripLampSpline'

/** Cap horizontal strip tiles so the bar + fixed + control do not crowd or clip the layout. */
const MAX_CAROUSEL_STRIP_THUMBS = 7

interface ArtworkCarouselBarProps {
  selectedArtworks: ShopifyProduct[]
  spotlightPlaceholders?: ShopifyProduct[]
  activeIndex: number
  lampPreviewOrder: string[]
  onTapItem: (index: number) => void
  onRemoveItem: (index: number) => void
  onOpenPicker: () => void
  /** Add a product directly to the cart (used by spotlight placeholder + buttons) */
  onAddProduct?: (product: ShopifyProduct) => void
  /** When false, carousel is minimized (user scrolled past Spline preview) */
  splineInView?: boolean
  /** Ref to [`SplineFullScreen`](./SplineFullScreen.tsx) vertical reel (`useRef<HTMLDivElement | null>(null)`); vertical wheel over the carousel scrolls this container. */
  experienceReelRef?: RefObject<HTMLDivElement | null> | { current: HTMLDivElement | null }
  /** Collection strip vs edition watchlist strip */
  stripMode?: 'collection' | 'watchlist'
  /** When in watchlist mode, switch back to collection thumbnails */
  onSwitchToCollection?: () => void
  /**
   * When the sticky checkout row already exposes add-artwork / empty-bundle CTAs, hide duplicate controls in the strip
   * (≥1 artwork or empty **collection** row on sticky bar).
   */
  reserveCheckoutBar?: boolean
  /** Scroll reel to Spline + sync preview slide (collection strip mini lamp / Spline tile) */
  onJumpToSpline?: () => void
  /** Same `Spline3DPreview` as the main lamp reel; when set with `onJumpToSpline`, used instead of embed/facade. */
  miniSplineLampPreview?: Omit<CarouselStripLampSplineProps, 'className'> | null
  /** Strip mini lamp is shown only when `lampQuantity > 0`; first-slot + placeholder uses this for image/title. */
  stripLampProduct?: ShopifyProduct | null
  lampQuantity?: number
  /** Empty collection + no lamp: spotlight-style + tile to add lamp to cart */
  onAddLampFromCarouselStrip?: () => void
  /** Lamp in cart: trash removes lamp from order */
  onRemoveLampFromCarouselStrip?: () => void
}

export function ArtworkCarouselBar({
  selectedArtworks,
  spotlightPlaceholders = [],
  activeIndex,
  lampPreviewOrder,
  onTapItem,
  onRemoveItem,
  onOpenPicker,
  onAddProduct,
  splineInView = true,
  experienceReelRef,
  stripMode = 'collection',
  onSwitchToCollection,
  reserveCheckoutBar = false,
  onJumpToSpline,
  miniSplineLampPreview = null,
  stripLampProduct = null,
  lampQuantity = 0,
  onAddLampFromCarouselStrip,
  onRemoveLampFromCarouselStrip,
}: ArtworkCarouselBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const carouselWheelHostRef = useRef<HTMLDivElement>(null)
  const { theme } = useExperienceTheme()
  const { pickerEngaged, orderDrawerOpen, orderBarProps } = useExperienceOrder()
  const lampQuantityForJourney = orderBarProps?.lampQuantity ?? 0
  const miniSplineEmbedUrl = useMemo(() => getMiniSplineEmbedUrl(), [])

  const journeyNext = useMemo(() => {
    if (orderDrawerOpen) return null
    return resolveExperienceNextAction({
      lampQuantity: lampQuantityForJourney,
      artworkCount: selectedArtworks.length,
      pickerEngaged,
      orderDrawerOpen: false,
      hasAddress: false,
      hasPaymentSelection: false,
      paymentSectionExpanded: false,
      paymentStripeUnlocked: false,
    })
  }, [orderDrawerOpen, pickerEngaged, lampQuantityForJourney, selectedArtworks.length])
  const [isDesktop, setIsDesktop] = useState(false)
  const isDraggingRef = useRef(false)
  const didDragRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Desktop: drag-to-scroll for smoother sliding
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDesktop || !scrollRef.current) return
    isDraggingRef.current = true
    didDragRef.current = false
    startXRef.current = e.pageX
    scrollLeftRef.current = scrollRef.current.scrollLeft
  }
  const handleClickCapture = (e: React.MouseEvent) => {
    if (didDragRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }
  useEffect(() => {
    if (!isDesktop) return
    const onMouseUp = () => {
      if (isDraggingRef.current) {
        setTimeout(() => { didDragRef.current = false }, 0)
      }
      isDraggingRef.current = false
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !scrollRef.current) return
      if (Math.abs(e.pageX - startXRef.current) > 5) didDragRef.current = true
      e.preventDefault()
      const walk = (e.pageX - startXRef.current) * 1.2
      scrollRef.current.scrollLeft = scrollLeftRef.current - walk
    }
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousemove', onMouseMove, { passive: false })
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [isDesktop])

  // Vertical wheel over the carousel (+ / thumb strip) scrolls the main reel; horizontal wheel scrolls the thumb strip only.
  useEffect(() => {
    const host = carouselWheelHostRef.current
    const strip = scrollRef.current
    if (!host || !experienceReelRef) return

    const wheelDeltaY = (e: WheelEvent, scrollEl: HTMLElement) => {
      let dy = e.deltaY
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) dy *= 16
      if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) dy *= scrollEl.clientHeight
      return dy
    }

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return
      if (!host.contains(e.target as Node)) return
      const reel = experienceReelRef.current
      if (!reel) return

      const dy = wheelDeltaY(e, reel)
      const dx = e.deltaX
      const onStrip = strip?.contains(e.target as Node) ?? false

      if (onStrip && Math.abs(dx) > Math.abs(dy)) {
        return
      }

      if (dy === 0) return

      const max = reel.scrollHeight - reel.clientHeight
      if (max <= 0) return
      const st = reel.scrollTop
      if (dy < 0 && st <= 0) return
      if (dy > 0 && st >= max - 1) return
      reel.scrollTop += dy
      e.preventDefault()
    }

    host.addEventListener('wheel', onWheel, { passive: false })
    return () => host.removeEventListener('wheel', onWheel)
  }, [experienceReelRef])

  const hasCarouselArtworks = selectedArtworks.length > 0
  const emptyCollectionStart = !hasCarouselArtworks && stripMode === 'collection'

  const lampInCart = lampQuantity > 0
  const showStripMiniLampSpline =
    stripMode === 'collection' &&
    Boolean(onJumpToSpline && miniSplineLampPreview && lampInCart)
  const showStripLampFirstPlaceholder =
    stripMode === 'collection' &&
    emptyCollectionStart &&
    !lampInCart &&
    Boolean(onJumpToSpline && onAddLampFromCarouselStrip)

  const stripLampTitle = stripLampProduct?.title?.trim() || 'Street Lamp'
  const stripLampImageUrl =
    stripLampProduct?.featuredImage?.url || stripLampProduct?.images?.edges?.[0]?.node?.url || null

  const showSpotlightPlaceholders =
    stripMode === 'collection' &&
    selectedArtworks.length === 0 &&
    spotlightPlaceholders.length > 0
  const placeholderItems = showSpotlightPlaceholders ? spotlightPlaceholders.slice(0, 2) : []

  const nSelected = selectedArtworks.length
  const stripWindowStart =
    nSelected <= MAX_CAROUSEL_STRIP_THUMBS
      ? 0
      : activeIndex >= 0
        ? Math.min(
            Math.max(0, activeIndex - Math.floor(MAX_CAROUSEL_STRIP_THUMBS / 2)),
            nSelected - MAX_CAROUSEL_STRIP_THUMBS
          )
        : nSelected - MAX_CAROUSEL_STRIP_THUMBS
  const stripArtworks =
    nSelected <= MAX_CAROUSEL_STRIP_THUMBS
      ? selectedArtworks
      : selectedArtworks.slice(stripWindowStart, stripWindowStart + MAX_CAROUSEL_STRIP_THUMBS)

  // Desktop: scroll strip to end when count or visible window changes so thumbnails stay reachable
  useEffect(() => {
    if (!isDesktop || !scrollRef.current || selectedArtworks.length === 0) return
    const el = scrollRef.current
    const scrollToEnd = () => {
      el.scrollLeft = el.scrollWidth - el.clientWidth
    }
    requestAnimationFrame(scrollToEnd)
  }, [isDesktop, selectedArtworks.length, stripWindowStart, activeIndex])

  /* 12×18 (same 14:21 ratio, smaller); 12px corners */
  /** Carousel thumbs stay w-24; neutral glass (e.g. watchlist back) */
  const glassAddButtonClass = cn(
    'flex h-[4.5rem] w-12 shrink-0 items-center justify-center rounded-[12px] border transition-all duration-200 active:scale-[0.95]',
    'backdrop-blur-xl backdrop-saturate-150 shadow-lg',
    theme === 'light'
      ? [
          'border-white/80 bg-white/45 text-neutral-800',
          'shadow-[0_6px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.85)]',
          'hover:bg-white/60 hover:border-white hover:shadow-[0_8px_28px_rgba(0,0,0,0.14)]',
        ]
      : [
          'border-white/30 bg-white/18 text-white',
          'shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]',
          'hover:bg-white/28 hover:border-white/45 hover:shadow-[0_10px_36px_rgba(0,0,0,0.5)]',
        ]
  )

  /** Opens artwork picker — purple CTA */
  const pickerPlusButtonClass = cn(
    'flex h-[4.5rem] w-12 shrink-0 items-center justify-center rounded-[12px] border transition-all duration-200 active:scale-[0.95]',
    'backdrop-blur-xl backdrop-saturate-150 shadow-lg text-white',
    theme === 'light'
      ? [
          'border-violet-600 bg-violet-600',
          'shadow-[0_6px_24px_rgba(124,58,237,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]',
          'hover:bg-violet-700 hover:border-violet-700 hover:shadow-[0_8px_28px_rgba(124,58,237,0.42)]',
        ]
      : [
          'border-violet-400/85 bg-violet-600',
          'shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]',
          'hover:bg-violet-500 hover:border-violet-300',
        ]
  )

  /** Empty lamp: primary entry to picker — labeled CTA instead of an unlabeled + control */
  const emptyCollectionCtaClass = cn(
    'relative flex w-full max-w-[min(100%,22rem)] items-center justify-center gap-2 rounded-2xl border px-5 py-4 text-base font-semibold leading-tight tracking-tight shadow-lg transition-all duration-200 active:scale-[0.98] min-h-[3.25rem]',
    theme === 'light'
      ? 'border-blue-600 bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-700 hover:border-blue-700'
      : 'border-blue-500 bg-blue-600 text-white shadow-black/40 hover:bg-blue-500 hover:border-blue-400',
    journeyNext === 'create_bundle' && EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS
  )

  const pickerPlusWithJourney = cn(
    pickerPlusButtonClass,
    journeyNext === 'choose_artworks' && EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS
  )

  return (
    <div
      className={cn(
        'pointer-events-none relative z-50 w-full shrink-0 bg-transparent transition-[opacity] duration-300 ease-out',
        splineInView ? 'opacity-100' : 'h-0 min-h-0 overflow-hidden opacity-0'
      )}
    >
      <div className="relative bg-transparent px-4 pt-2 pb-1 md:pt-3 md:pb-2">
        <div className="relative z-[1] flex flex-col items-center gap-2 bg-transparent pointer-events-none">
          <div className="relative flex w-full flex-col gap-2 bg-transparent">
          <div
            ref={carouselWheelHostRef}
            className="pointer-events-auto flex w-full min-w-0 flex-col items-center gap-1.5 bg-transparent px-3 text-transparent"
          >
            {stripMode === 'watchlist' && onSwitchToCollection && (
              <div className="flex w-full min-w-0 flex-row items-end justify-center gap-2">
                <button
                  type="button"
                  onClick={onSwitchToCollection}
                  className={glassAddButtonClass}
                  aria-label="Back to collection"
                  title="Back to collection"
                >
                  <LayoutGrid className="w-5 h-5" strokeWidth={2.25} />
                </button>
              </div>
            )}
            {stripMode === 'collection' && emptyCollectionStart && !reserveCheckoutBar && (
              <div className="flex w-full min-w-0 flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onOpenPicker}
                  className={emptyCollectionCtaClass}
                >
                  <span>Create your own bundle</span>
                  <ChevronRight className="h-5 w-5 shrink-0 opacity-95" strokeWidth={2.5} aria-hidden />
                </button>
              </div>
            )}
            {!hasCarouselArtworks && stripMode === 'watchlist' && (
              <p
                className={cn(
                  'text-center text-xs font-medium max-w-[14rem] leading-snug',
                  theme === 'light' ? 'text-neutral-600' : 'text-[#c4a0a0]'
                )}
              >
                No editions on your watchlist yet — switch back to your collection to browse, or tap Watch on an artwork.
              </p>
            )}
          <div
            ref={scrollRef}
            data-experience-carousel-strip
            onMouseDown={handleMouseDown}
            onClickCapture={handleClickCapture}
            className={cn(
              /* justify-start + snap-start: snap-center/mandatory clips first/last tiles and blocks full scroll */
              'touch-manipulation flex w-full min-w-0 items-center justify-start gap-4 overflow-x-auto bg-transparent text-transparent scrollbar-hide snap-x snap-proximity pb-3',
              'pl-2 pr-2 sm:pl-3 sm:pr-3 overscroll-x-contain',
              isDesktop && hasCarouselArtworks && 'cursor-grab active:cursor-grabbing select-none'
            )}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth' }}
          >
            <>
              {showStripMiniLampSpline && onJumpToSpline ? (
                <div
                  data-carousel-item
                  className="flex shrink-0 snap-start snap-always flex-col items-center gap-1"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveLampFromCarouselStrip?.()
                      }}
                      className={cn(
                        'flex items-center justify-center transition-opacity opacity-40 hover:opacity-100',
                        theme === 'light' ? 'text-neutral-700' : 'text-white/80'
                      )}
                      aria-label="Remove Street Lamp from order"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const reel = experienceReelRef?.current
                      const spline = reel?.querySelector('[data-experience-reel-spline-section]')
                      if (spline instanceof HTMLElement) {
                        spline.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                      onJumpToSpline()
                    }}
                    className={cn(
                      'relative isolate block aspect-[14/20] w-16 shrink-0 overflow-hidden rounded-[12px] sm:w-[4.5rem]',
                      'ring-1 shadow-none ring-inset ring-black/10 dark:ring-white/15',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                      theme === 'light'
                        ? 'focus-visible:outline-blue-600'
                        : 'focus-visible:outline-white/80'
                    )}
                    aria-label="Scroll to main lamp preview"
                  >
                    <div className="absolute inset-0 overflow-hidden bg-transparent">
                      {miniSplineLampPreview ? (
                        <CarouselStripLampSpline
                          image1={null}
                          image2={null}
                          lampPreviewCount={0}
                          collectionArtworkCount={0}
                          resetTrigger={miniSplineLampPreview.resetTrigger}
                          rotateToSide={miniSplineLampPreview.rotateToSide}
                          rotateTrigger={miniSplineLampPreview.rotateTrigger}
                          onFrontSideSettled={miniSplineLampPreview.onFrontSideSettled}
                          className="h-full w-full min-h-0"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-transparent">
                          <div className="experience-carousel-mini-turntable flex h-[150%] w-[150%] shrink-0 items-center justify-center">
                            {miniSplineEmbedUrl ? (
                              <iframe
                                title="Lamp 3D preview"
                                src={miniSplineEmbedUrl}
                                className="pointer-events-none h-[240px] w-[240px] max-w-none shrink-0 border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                loading="lazy"
                              />
                            ) : (
                              <div className="relative h-14 w-14 shrink-0">
                                <Image
                                  src="/internal.webp"
                                  alt=""
                                  fill
                                  className="object-contain"
                                  sizes="72px"
                                  unoptimized
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              ) : null}
              {stripArtworks.map((artwork, i) => {
                const index = stripWindowStart + i
                const imageUrl = artwork.featuredImage?.url || artwork.images?.edges?.[0]?.node?.url
                const isOnLamp = lampPreviewOrder.includes(artwork.id)
                /* Eye on every tile assigned to the lamp (up to two sides). */
                const showViewingEye = isOnLamp
                const isCarouselCurrent = activeIndex >= 0 && index === activeIndex
                const isFirstVisible = i === 0

                return (
                  <div
                    key={artwork.id}
                    data-carousel-item
                    className="flex shrink-0 snap-start snap-always flex-col items-center gap-1"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemoveItem(index) }}
                        className={cn(
                          'flex items-center justify-center transition-opacity opacity-40 hover:opacity-100',
                          theme === 'light' ? 'text-neutral-700' : 'text-white/80'
                        )}
                        aria-label={
                          stripMode === 'watchlist'
                            ? `Remove ${artwork.title} from watchlist`
                            : `Remove ${artwork.title} from selection`
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onTapItem(index)}
                      className={cn(
                        'relative isolate block w-24 aspect-[14/20] overflow-visible rounded-[15px] transition-transform duration-200 active:scale-[0.95] shadow-none'
                      )}
                      aria-label={`Select artwork ${index + 1}: ${artwork.title}`}
                      aria-current={isCarouselCurrent ? 'true' : undefined}
                    >
                      {showViewingEye ? (
                        <span
                          role="img"
                          aria-label="Shown on lamp preview"
                          className={cn(
                            'pointer-events-none absolute left-1/2 top-1 z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border shadow-md backdrop-blur-sm',
                            theme === 'light'
                              ? 'border-white/95 bg-white/95 text-neutral-800 shadow-black/15'
                              : 'border-white/35 bg-[#2a2626]/95 text-[#f0e8e8] shadow-black/50'
                          )}
                        >
                          <Eye className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                        </span>
                      ) : null}
                      <div className="absolute inset-0 rounded-[15px] overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={getShopifyImageUrl(imageUrl, 400) ?? imageUrl}
                            alt={artwork.title}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="96px"
                            priority={isFirstVisible && stripWindowStart === 0}
                            loading={isFirstVisible && stripWindowStart === 0 ? 'eager' : 'lazy'}
                          />
                        ) : (
                          <div className={cn(
                            'w-full h-full flex items-center justify-center',
                            theme === 'light' ? 'bg-neutral-200' : 'bg-neutral-800'
                          )}>
                            <span className={cn(
                              'text-xs',
                              theme === 'light' ? 'text-neutral-600' : 'text-neutral-400'
                            )}>{index + 1}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                  )
              })}
              {showStripLampFirstPlaceholder ? (
                <div
                  key="strip-lamp-first-placeholder"
                  data-carousel-item
                  className="flex shrink-0 snap-start snap-always flex-col items-center gap-1"
                >
                  <div className="flex h-3.5 w-5 items-center justify-center" aria-hidden />
                  <button
                    type="button"
                    onClick={() => onAddLampFromCarouselStrip?.()}
                    className={cn(
                      'relative block w-24 aspect-[14/20] rounded-[15px] transition-all duration-200 active:scale-[0.95] overflow-hidden',
                      theme === 'light'
                        ? 'ring-1 ring-neutral-200/95 hover:ring-neutral-100'
                        : 'ring-1 ring-white/45 hover:ring-white/60'
                    )}
                    aria-label={`Add ${stripLampTitle} to order`}
                  >
                    <div className="absolute inset-0">
                      {stripLampImageUrl ? (
                        <Image
                          src={getShopifyImageUrl(stripLampImageUrl, 400) ?? stripLampImageUrl}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover opacity-65"
                          sizes="96px"
                        />
                      ) : (
                        <div className="relative h-full w-full">
                          <Image
                            src="/internal.webp"
                            alt=""
                            fill
                            className="object-cover opacity-65"
                            sizes="96px"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/20" />
                    <div
                      className={cn(
                        'absolute inset-x-0 bottom-0 z-[2] pointer-events-none flex justify-center px-1 pb-1.5'
                      )}
                    >
                      <div
                        className={cn(
                          'flex w-4/5 max-w-[80%] min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5',
                          'border border-white/30 dark:border-white/20',
                          'bg-black/40 backdrop-blur-md backdrop-saturate-150 dark:bg-black/50',
                          'text-white shadow-sm shadow-black/20'
                        )}
                      >
                        <span
                          className="min-w-0 flex-1 text-center text-[9px] font-semibold leading-tight tracking-tight line-clamp-2 break-words [overflow-wrap:anywhere]"
                          title={stripLampTitle}
                        >
                          {stripLampTitle}
                        </span>
                        <Plus
                          className="h-3 w-3 shrink-0 text-white opacity-95"
                          strokeWidth={2.5}
                          aria-hidden
                        />
                      </div>
                    </div>
                  </button>
                </div>
              ) : null}
              {placeholderItems.map((artwork, index) => {
                const imageUrl = artwork.featuredImage?.url || artwork.images?.edges?.[0]?.node?.url
                const isFirstItem = index === 0
                return (
                  <div
                    key={`spotlight-placeholder-${artwork.id}`}
                    data-carousel-item
                    className="flex shrink-0 snap-start snap-always flex-col items-center gap-1"
                  >
                    <div className="flex items-center justify-center w-5 h-3.5" aria-hidden />
                    <button
                      type="button"
                      onClick={() => onAddProduct ? onAddProduct(artwork) : onOpenPicker()}
                      className={cn(
                        'relative block w-24 aspect-[14/20] rounded-[15px] transition-all duration-200 active:scale-[0.95] overflow-hidden',
                        theme === 'light'
                          ? 'ring-1 ring-neutral-200/95 hover:ring-neutral-100'
                          : 'ring-1 ring-white/45 hover:ring-white/60'
                      )}
                      aria-label={`Add ${artwork.title} to collection`}
                    >
                      <div className="absolute inset-0">
                        {imageUrl ? (
                          <Image
                            src={getShopifyImageUrl(imageUrl, 400) ?? imageUrl}
                            alt={artwork.title}
                            fill
                            unoptimized
                            className="object-cover opacity-65"
                            sizes="96px"
                            priority={isFirstItem}
                            loading={isFirstItem ? 'eager' : 'lazy'}
                          />
                        ) : (
                          <div className={cn(
                            'w-full h-full flex items-center justify-center',
                            theme === 'light' ? 'bg-neutral-200' : 'bg-neutral-800'
                          )}>
                            <span className={cn(
                              'text-xs',
                              theme === 'light' ? 'text-neutral-600' : 'text-neutral-400'
                            )}>+</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/20" />
                      <div
                        className={cn(
                          'absolute inset-x-0 bottom-0 z-[2] pointer-events-none flex justify-center px-1 pb-1.5'
                        )}
                      >
                        <div
                          className={cn(
                            'flex w-4/5 max-w-[80%] min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5',
                            'border border-white/30 dark:border-white/20',
                            'bg-black/40 backdrop-blur-md backdrop-saturate-150 dark:bg-black/50',
                            'text-white shadow-sm shadow-black/20'
                          )}
                        >
                          <span
                            className="min-w-0 flex-1 text-center text-[9px] font-semibold leading-tight tracking-tight line-clamp-2 break-words [overflow-wrap:anywhere]"
                            title={artwork.title}
                          >
                            {artwork.title}
                          </span>
                          <Plus
                            className="h-3 w-3 shrink-0 text-white opacity-95"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                        </div>
                      </div>
                    </button>
                  </div>
                )
              })}
              {stripMode === 'collection' && !emptyCollectionStart && !reserveCheckoutBar && (
                <div
                  data-carousel-item
                  className="flex shrink-0 snap-start snap-always flex-col items-center gap-1"
                >
                  <div className="flex items-center justify-center gap-1.5" aria-hidden>
                    <span className="inline-block w-3.5 h-3.5" />
                  </div>
                  <button
                    type="button"
                    onClick={onOpenPicker}
                    className={pickerPlusWithJourney}
                    aria-label="Add artwork to collection"
                    title="Add artwork to collection"
                  >
                    <Plus className="w-5 h-5" strokeWidth={2.25} />
                  </button>
                </div>
              )}
              {/* Spacer so last tile (+) can scroll fully into view past snap/edge clipping */}
              <div className="shrink-0 w-3 sm:w-4" aria-hidden />
            </>
          </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
