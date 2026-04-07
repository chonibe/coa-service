'use client'

import { useCallback, useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react'
import Image from 'next/image'
import { Eye } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn, formatPriceCompact } from '@/lib/utils'
import { ExperienceOrderLampIcon } from '../../experience-v2/components/ExperienceOrderLampIcon'
import type { FeaturedBundleFilterOffer } from '../../experience-v2/components/FilterPanel'

/** Match carousel strip density; bundle tiles stay smaller (w-14 / sm:w-24). */
const MAX_BUNDLE_STRIP_ITEMS = 8

function BundlePlusSep({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <span
      className={cn(
        'shrink-0 self-end pb-2 text-sm font-semibold leading-none sm:pb-3 sm:text-lg',
        theme === 'light' ? 'text-neutral-500' : 'text-[#d4b8b8]'
      )}
      aria-hidden
    >
      +
    </span>
  )
}

const bundleThumbFrameClass =
  'relative aspect-[14/20] w-14 shrink-0 overflow-hidden rounded-[10px] shadow-md ring-1 ring-inset ring-black/10 dark:ring-white/15 sm:w-24 sm:rounded-[15px]'

function LampPreviewEyeBadge({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <span
      role="img"
      aria-label="Shown on lamp preview"
      className={cn(
        'pointer-events-none flex h-4 w-4 shrink-0 items-center justify-center rounded-full border shadow-md backdrop-blur-sm sm:h-[1.125rem] sm:w-[1.125rem]',
        theme === 'light'
          ? 'border-white/95 bg-white/95 text-neutral-800 shadow-black/15'
          : 'border-white/35 bg-[#2a2626]/95 text-[#f0e8e8] shadow-black/50'
      )}
    >
      <Eye className="h-2 w-2 sm:h-2.5 sm:w-2.5" strokeWidth={2.5} aria-hidden />
    </span>
  )
}

export interface FeaturedArtistBundleSectionProps {
  theme: 'light' | 'dark'
  offer: FeaturedBundleFilterOffer
  /** First item is always the Street Lamp; remaining entries are bundle / spotlight prints (max {@link MAX_BUNDLE_STRIP_ITEMS}). */
  stripProducts: ShopifyProduct[]
  /** Single tap handler: index 0 = lamp, rest = prints (add or carousel-select — parent decides). */
  onStripItemPress: (index: number, product: ShopifyProduct) => void
  /** Highlights the active tile (same idea as carousel `aria-current`). */
  selectedProductId?: string | null
  /** Product IDs on the lamp preview — prints show the eye badge (carousel parity). */
  lampPreviewProductIds?: string[]
  /**
   * Vertical reel (`overflow-y-auto`). When set, wheel/trackpad over this card scrolls the reel unless the event is
   * clearly horizontal on the thumb strip — same contract as [`ArtworkCarouselBar`](./ArtworkCarouselBar.tsx).
   */
  experienceReelRef?: RefObject<HTMLDivElement | null> | MutableRefObject<HTMLDivElement | null> | null
}

/** Featured artist bundle block: horizontal strip (scroll + snap + drag), pricing, primary Add to cart. */
export function FeaturedArtistBundleSection({
  theme,
  offer,
  stripProducts,
  onStripItemPress,
  selectedProductId = null,
  lampPreviewProductIds = [],
  experienceReelRef = null,
}: FeaturedArtistBundleSectionProps) {
  const disabled = offer.disabled === true
  const scrollRef = useRef<HTMLDivElement>(null)
  /** Whole card (title + strip + CTA): wheel target for forwarding vertical scroll to the reel. */
  const bundleWheelHostRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [isDesktop, setIsDesktop] = useState(false)
  const isDraggingRef = useRef(false)
  const didDragRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  const items = stripProducts.slice(0, MAX_BUNDLE_STRIP_ITEMS)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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
        setTimeout(() => {
          didDragRef.current = false
        }, 0)
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

  // Vertical wheel over the bundle card scrolls the main reel; horizontal wheel on the thumb strip scrolls the strip only.
  useEffect(() => {
    const host = bundleWheelHostRef.current
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

  const scrollSelectedIntoView = useCallback(() => {
    if (!selectedProductId || !scrollRef.current) return
    const i = items.findIndex((p) => p.id === selectedProductId)
    if (i < 0) return
    const el = itemRefs.current[i]
    el?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
  }, [items, selectedProductId])

  useEffect(() => {
    scrollSelectedIntoView()
  }, [scrollSelectedIntoView])

  const lampPreviewSet = new Set(lampPreviewProductIds)

  return (
    <section
      className="relative z-[2] w-full shrink-0 px-4 pb-5 pt-1 pointer-events-auto md:px-5 md:pb-6 md:pt-2"
      aria-labelledby="experience-featured-bundle-title"
    >
      <div
        ref={bundleWheelHostRef}
        className={cn(
          'mx-auto w-full max-w-md rounded-2xl border px-4 py-4 shadow-lg sm:px-5 sm:py-5',
          theme === 'light'
            ? 'border-amber-200/90 bg-amber-50/90 shadow-amber-200/20'
            : 'border-[#FFBA94]/40 bg-[#2a2420]/95 shadow-black/40'
        )}
      >
        <h2
          id="experience-featured-bundle-title"
          className={cn(
            'mb-3 text-center text-[10px] font-semibold uppercase tracking-wide sm:mb-3.5 sm:text-[11px]',
            theme === 'light' ? 'text-amber-900' : 'text-[#FFBA94]'
          )}
        >
          Featured artist bundle
        </h2>

        <div className="flex w-full min-w-0 justify-center">
          <div
            ref={scrollRef}
            data-featured-bundle-strip
            onMouseDown={handleMouseDown}
            onClickCapture={handleClickCapture}
            className={cn(
              'touch-pan-x flex max-w-full min-w-0 items-end justify-start gap-1 overflow-x-auto overscroll-x-contain overscroll-y-auto pb-1 sm:gap-2 md:gap-3',
              'snap-x snap-proximity scrollbar-hide',
              isDesktop && items.length > 1 && 'cursor-grab select-none active:cursor-grabbing'
            )}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth' }}
          >
            {items.map((product, index) => {
              const isLamp = index === 0
              const imageUrl = product.featuredImage?.url || product.images?.edges?.[0]?.node?.url
              const label = (product.title ?? (isLamp ? 'Street Lamp' : 'Artwork')).trim()
              const addable =
                !disabled &&
                (isLamp ? product.availableForSale !== false : product.availableForSale !== false)
              const isSelected = selectedProductId != null && product.id === selectedProductId
              const showEye = !isLamp && lampPreviewSet.has(product.id)

              return (
                <div key={`${product.id}-${index}`} className="flex shrink-0 items-end gap-1 sm:gap-2 md:gap-3">
                  {index > 0 ? <BundlePlusSep theme={theme} /> : null}
                  <div
                    ref={(el) => {
                      itemRefs.current[index] = el
                    }}
                    data-bundle-strip-item
                    className="flex shrink-0 snap-start snap-always flex-col items-center gap-1"
                  >
                    <div className="flex h-4 w-full items-center justify-center sm:h-[1.125rem]">
                      {showEye ? <LampPreviewEyeBadge theme={theme} /> : <span className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden />}
                    </div>
                    {addable ? (
                      <button
                        type="button"
                        onClick={() => onStripItemPress(index, product)}
                        title={label}
                        aria-label={isLamp ? `Select ${label}` : `Select artwork: ${label}`}
                        aria-current={isSelected ? 'true' : undefined}
                        className={cn(
                          bundleThumbFrameClass,
                          'cursor-pointer border-0 bg-transparent p-0 text-left',
                          'transition-transform duration-200 active:scale-[0.98]',
                          'outline-none focus-visible:ring-2 focus-visible:ring-[#047AFF] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:focus-visible:ring-[#60A5FA]',
                          isSelected &&
                            'ring-2 ring-[#047AFF] ring-offset-2 ring-offset-transparent dark:ring-[#60A5FA]'
                        )}
                      >
                        {imageUrl ? (
                          <Image
                            src={getShopifyImageUrl(imageUrl, 400) ?? imageUrl}
                            alt=""
                            fill
                            unoptimized
                            className="pointer-events-none object-cover"
                            sizes="(max-width: 640px) 56px, 96px"
                            priority={index < 3}
                            loading={index < 3 ? 'eager' : 'lazy'}
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center bg-neutral-200 dark:bg-neutral-800">
                            {isLamp ? (
                              <ExperienceOrderLampIcon
                                className={cn(
                                  'h-6 w-6 sm:h-10 sm:w-10',
                                  theme === 'light' ? 'text-neutral-500' : 'text-[#b89090]'
                                )}
                                aria-hidden
                              />
                            ) : (
                              <span
                                className={cn(
                                  'text-[10px] sm:text-xs',
                                  theme === 'light' ? 'text-neutral-600' : 'text-neutral-400'
                                )}
                              >
                                —
                              </span>
                            )}
                          </span>
                        )}
                      </button>
                    ) : (
                      <div
                        className={cn(
                          bundleThumbFrameClass,
                          'opacity-50',
                          isSelected && 'ring-2 ring-neutral-400 ring-offset-2 ring-offset-transparent'
                        )}
                        title={label}
                      >
                        {imageUrl ? (
                          <Image
                            src={getShopifyImageUrl(imageUrl, 400) ?? imageUrl}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="(max-width: 640px) 56px, 96px"
                            priority={index < 3}
                            loading={index < 3 ? 'eager' : 'lazy'}
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p
          className={cn(
            'mt-3 text-center text-sm font-semibold leading-snug sm:mt-4 sm:text-base',
            theme === 'light' ? 'text-neutral-900' : 'text-white'
          )}
        >
          Get {offer.vendorName} bundle — ${formatPriceCompact(offer.bundleUsd)}
        </p>
        <p className="mt-1 text-center text-xs leading-snug text-neutral-600 dark:text-[#c4a0a0] sm:text-sm">
          <span className="line-through tabular-nums text-neutral-500 dark:text-[#b89090]">
            ${formatPriceCompact(offer.compareAtUsd)}
          </span>{' '}
          <span className="hidden sm:inline">regular · lamp + 2 prints</span>
          <span className="sm:hidden">reg. · lamp + 2</span>
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => offer.onApply()}
          className={cn(
            'mt-4 w-full rounded-xl px-4 py-3.5 text-center text-base font-semibold tracking-tight shadow-md transition-all duration-200',
            'active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50',
            theme === 'light'
              ? 'bg-neutral-900 text-white shadow-black/20 hover:bg-neutral-800'
              : 'bg-[#FFBA94] text-neutral-950 shadow-black/30 hover:bg-[#ffc4a8]'
          )}
        >
          Add to cart
        </button>
      </div>
    </section>
  )
}

