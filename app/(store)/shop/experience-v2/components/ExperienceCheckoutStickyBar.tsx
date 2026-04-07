'use client'

import { Fragment, useMemo } from 'react'
import Image from 'next/image'
import { ChevronRight, Eye, Plus } from 'lucide-react'
import { ExperienceOrderLampIcon } from './ExperienceOrderLampIcon'
import { useExperienceOrder } from '../ExperienceOrderContext'
import { useExperienceTheme } from '../ExperienceThemeContext'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn, formatPriceCompact } from '@/lib/utils'
import { CollectionArcLabel } from '../../experience/components/CollectionArcLabel'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import {
  EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS,
  resolveExperienceNextAction,
} from '@/lib/shop/experience-journey-next-action'
/** Portrait tiles match [`ArtworkCarouselBar`](../../experience/components/ArtworkCarouselBar.tsx) strip (14×20, 15px radius). */
const THUMB_WIDTH_PX = 36
const IMAGE_REQUEST_PX = 280

export interface ExperienceCheckoutStickyBarProps {
  lamp: ShopifyProduct
  lampQuantity: number
  /** Artworks in the experience cart (excludes lamp). */
  selectedArtworks: ShopifyProduct[]
  /** Lamp + artworks subtotal before promo (same basis as OrderBar). */
  orderSubtotal: number
  /** Opens the artwork picker; **empty collection** row uses it for “Create your own bundle”; **≥1 artwork** uses centered FAB. */
  onOpenPicker?: () => void
  /** Lamp thumbnail / icon opens product detail (slide-up sheet on mobile). */
  onViewLampDetail?: (product: ShopifyProduct) => void
  /** When `collection` and there are no artworks yet, the bar shows the primary CTA (not in watchlist empty state). */
  stripMode?: 'collection' | 'watchlist'
  /**
   * When true, hide the cart thumbnail row (add-artwork FAB + checkout stay). Used only when a separate strip duplicates thumbs; shells normally pass **`false`** so thumbnails are always visible.
   */
  suppressCartThumbnails?: boolean
  /**
   * When set, tapping a lamp or artwork thumbnail selects that item on the main Spline preview. Takes priority over `onViewLampDetail` for lamp tiles so the primary tap syncs the 3D preview.
   */
  onSelectThumbnailForSpline?: (product: ShopifyProduct) => void
  /** Product id currently shown as selected on the lamp preview (e.g. active carousel tile). */
  previewSelectedProductId?: string | null
  /**
   * Product IDs assigned to the lamp sides (same as `lampPreviewOrder` on the experience shell).
   * Sticky **artwork** tiles show the “on preview” eye when their id is in this list (both sides).
   */
  lampPreviewProductIds?: string[]
}

function firstImageUrl(product: ShopifyProduct): string | null {
  return product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null
}

type Slot = { key: string; product: ShopifyProduct; isLamp: boolean }

function PlusSep({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <span
      className={cn(
        'shrink-0 self-center text-base font-semibold leading-none',
        theme === 'light' ? 'text-neutral-400' : 'text-[#d4b8b8]'
      )}
      aria-hidden
    >
      +
    </span>
  )
}

/** Same meaning as carousel strip eye; sits in layout above the thumb (not overflow-clipped). */
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

function StickyThumb({
  product,
  isLamp,
  theme,
  onDetailPress,
  onSplinePreviewPress,
  isSplinePreviewSelected,
}: {
  product: ShopifyProduct
  isLamp: boolean
  theme: 'light' | 'dark'
  /** When set (lamp slots only), opens product detail sheet. Ignored when `onSplinePreviewPress` is set. */
  onDetailPress?: () => void
  /** Select this item on the Spline preview (sticky thumbnail tap). */
  onSplinePreviewPress?: () => void
  isSplinePreviewSelected?: boolean
}) {
  const raw = firstImageUrl(product)
  const src = raw ? (getShopifyImageUrl(raw, IMAGE_REQUEST_PX) ?? raw) : null
  const label = (product.title ?? (isLamp ? 'Street Lamp' : 'Artwork')).trim()

  const frame = cn(
    'relative shrink-0 overflow-hidden rounded-[15px]',
    /* Same portrait ratio as carousel thumbs; compact width for the sticky row */
    'w-9 aspect-[14/20] sm:w-10'
  )

  const interactiveFrame = cn(
    frame,
    'm-0 cursor-pointer border-0 bg-transparent p-0 text-left touch-manipulation',
    'transition-transform duration-200 active:scale-[0.95]',
    'outline-none focus-visible:ring-2 focus-visible:ring-[#047AFF] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:focus-visible:ring-[#60A5FA]'
  )

  const thumbImage = (
    <div className="absolute inset-0 rounded-[15px] overflow-hidden">
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes={`(max-width:640px) ${THUMB_WIDTH_PX}px, 40px`}
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {isLamp ? (
            <ExperienceOrderLampIcon
              className={cn('h-5 w-5 sm:h-6 sm:w-6', theme === 'light' ? 'text-neutral-400' : 'text-[#d4b8b8]')}
            />
          ) : (
            <span className="text-xs text-neutral-400 dark:text-[#b89090]">—</span>
          )}
        </span>
      )}
    </div>
  )

  if (onSplinePreviewPress) {
    return (
      <button
        type="button"
        onClick={onSplinePreviewPress}
        title={label}
        aria-label={
          isLamp ? `Select ${label} on lamp preview` : `Select artwork on lamp preview: ${label}`
        }
        aria-current={isSplinePreviewSelected ? 'true' : undefined}
        className={interactiveFrame}
      >
        {thumbImage}
      </button>
    )
  }

  if (onDetailPress) {
    return (
      <button
        type="button"
        onClick={onDetailPress}
        title={label}
        aria-label={`${label}, view product details`}
        className={cn(
          frame,
          'relative m-0 cursor-pointer border-0 bg-transparent p-0 text-left touch-manipulation',
          'transition-opacity hover:opacity-90',
          'outline-none focus-visible:ring-2 focus-visible:ring-[#047AFF] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:focus-visible:ring-[#60A5FA]'
        )}
      >
        {thumbImage}
      </button>
    )
  }

  return (
    <div className={cn(frame, 'relative')} title={label}>
      {thumbImage}
    </div>
  )
}

/**
 * Sticky bottom bar: **empty collection** shows “Create your own bundle”; **≥1 artwork** shows a top row (cart thumbnails unless `suppressCartThumbnails`, **add-artwork FAB on the right**) and a **full-width checkout button below**.
 * Experience shells pass **`suppressCartThumbnails={false}`** so checkout thumbnails are the single collection strip at all breakpoints; optional **`onSelectThumbnailForSpline`** syncs taps to the main Spline preview.
 * Featured bundle promo (lamp + two prints) lives under the Spline in the reel ([`SplineFullScreen`](../../experience/components/SplineFullScreen.tsx)) when applicable.
 * Opens the OrderBar drawer via `openOrderBar` (same as header cart).
 */
export function ExperienceCheckoutStickyBar({
  lamp,
  lampQuantity,
  selectedArtworks,
  orderSubtotal,
  onOpenPicker,
  onViewLampDetail,
  stripMode = 'collection',
  suppressCartThumbnails = false,
  onSelectThumbnailForSpline,
  previewSelectedProductId = null,
  lampPreviewProductIds = [],
}: ExperienceCheckoutStickyBarProps) {
  const { openOrderBar, promoDiscount, pickerEngaged, orderDrawerOpen } = useExperienceOrder()
  const { theme } = useExperienceTheme()

  const journeyNext = useMemo(() => {
    if (orderDrawerOpen) return null
    return resolveExperienceNextAction({
      lampQuantity,
      artworkCount: selectedArtworks.length,
      pickerEngaged,
      orderDrawerOpen: false,
      hasAddress: false,
      hasPaymentSelection: false,
      paymentSectionExpanded: false,
      paymentStripeUnlocked: false,
    })
  }, [orderDrawerOpen, pickerEngaged, lampQuantity, selectedArtworks.length])

  const hasArtworks = selectedArtworks.length >= 1
  const showEmptyCollectionCta = !hasArtworks && stripMode === 'collection'
  /** Lamp in experience cart but user still needs to pick artwork(s). */
  const lampInCartNeedsArtwork = showEmptyCollectionCta && lampQuantity > 0
  const visible = hasArtworks || showEmptyCollectionCta
  const finalTotal = Math.max(0, orderSubtotal - promoDiscount)

  const createBundleCtaClass = cn(
    'relative flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-left text-base font-semibold leading-tight tracking-tight shadow-lg transition-all duration-200 active:scale-[0.98]',
    theme === 'light'
      ? 'border-blue-600 bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-700 hover:border-blue-700'
      : 'border-blue-500 bg-blue-600 text-white shadow-black/40 hover:bg-blue-500 hover:border-blue-400',
    journeyNext === 'create_bundle' && EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS
  )

  const chooseArtworksAfterLampClass = cn(
    'relative flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-left text-base font-semibold leading-tight tracking-tight shadow-lg transition-all duration-200 active:scale-[0.98]',
    theme === 'light'
      ? 'border-violet-600 bg-violet-600 text-white hover:bg-violet-700 hover:border-violet-700'
      : 'border-violet-500 bg-violet-600 text-white shadow-black/40 hover:bg-violet-500 hover:border-violet-400',
    (journeyNext === 'choose_artworks' || lampInCartNeedsArtwork) && 'animate-experience-artwork-cta-pulse',
    journeyNext === 'choose_artworks' && EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS
  )

  const openPickerFabClass = cn(
    'relative flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-full border text-white shadow-md transition-all active:scale-95 sm:h-[3.25rem] sm:w-[3.25rem]',
    'animate-experience-collection-plus-prize-pulse',
    theme === 'light'
      ? 'border-violet-600 bg-violet-600 shadow-violet-600/35 hover:border-violet-700 hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600'
      : 'border-violet-500 bg-violet-600 shadow-black/40 hover:border-violet-400 hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400',
    journeyNext === 'choose_artworks' && EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS
  )

  const checkoutPillClass = cn(
    'relative z-[3] flex w-full items-center justify-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold shadow-md transition-transform active:scale-[0.98] md:px-8',
    'bg-[#047AFF] text-white hover:bg-[#0366d6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047AFF]',
    journeyNext === 'open_checkout' && EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS
  )

  const slots = useMemo<Slot[]>(() => {
    const out: Slot[] = []
    for (let i = 0; i < lampQuantity; i++) {
      out.push({ key: `lamp-${i}`, product: lamp, isLamp: true })
    }
    selectedArtworks.forEach((product, i) => {
      out.push({ key: `${product.id}-${i}`, product, isLamp: false })
    })
    return out
  }, [lamp, lampQuantity, selectedArtworks])

  const summaryLabel = useMemo(() => {
    if (!hasArtworks && stripMode === 'collection') {
      return lampQuantity > 0
        ? 'Choose your artworks — open artwork picker'
        : 'Create your own bundle — open artwork picker'
    }
    const parts: string[] = []
    if (lampQuantity > 0) {
      parts.push(`${lampQuantity} lamp${lampQuantity > 1 ? 's' : ''}`)
    }
    parts.push(`${selectedArtworks.length} artwork${selectedArtworks.length !== 1 ? 's' : ''}`)
    return `Your collection summary: ${parts.join(', ')}`
  }, [lampQuantity, selectedArtworks.length, hasArtworks, stripMode])

  if (!visible) return null

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[52] bg-transparent',
        theme === 'light' ? 'text-neutral-900' : 'text-white'
      )}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      role="region"
      aria-label={summaryLabel}
    >
      <div className="mx-auto max-w-2xl px-4 py-3 md:px-6">
        {showEmptyCollectionCta ? (
          onOpenPicker ? (
            <button
              type="button"
              onClick={onOpenPicker}
              className={cn(lampInCartNeedsArtwork ? chooseArtworksAfterLampClass : createBundleCtaClass, 'w-full')}
              aria-label={lampInCartNeedsArtwork ? 'Choose your artworks' : 'Create your own bundle'}
            >
              <span className="min-w-0 truncate">
                {lampInCartNeedsArtwork ? 'Choose your Artworks' : 'Create your own bundle'}
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 opacity-95" strokeWidth={2.5} aria-hidden />
            </button>
          ) : null
        ) : (
          <div
            className={cn(
              'flex w-full min-w-0 flex-col',
              onOpenPicker || !suppressCartThumbnails ? 'gap-3' : 'gap-0'
            )}
          >
            {onOpenPicker || !suppressCartThumbnails ? (
              <div
                className={cn(
                  'flex w-full min-w-0 items-center gap-3',
                  suppressCartThumbnails && onOpenPicker ? 'justify-end' : ''
                )}
              >
                {!suppressCartThumbnails ? (
                  <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide pt-1">
                    <div className="flex w-max max-w-full min-w-0 items-center gap-1.5 pr-1">
                      {slots.map((slot, index) => {
                        const showLampPreviewEye =
                          !slot.isLamp &&
                          lampPreviewProductIds.length > 0 &&
                          lampPreviewProductIds.includes(slot.product.id)
                        return (
                          <Fragment key={slot.key}>
                            {index > 0 && <PlusSep theme={theme} />}
                            <div className="flex shrink-0 flex-col items-center gap-0.5">
                              <div className="flex h-[15px] w-full shrink-0 items-end justify-center">
                                {showLampPreviewEye ? <LampPreviewEyeBadge theme={theme} /> : null}
                              </div>
                              <StickyThumb
                                product={slot.product}
                                isLamp={slot.isLamp}
                                theme={theme}
                                onSplinePreviewPress={
                                  onSelectThumbnailForSpline
                                    ? () => onSelectThumbnailForSpline(slot.product)
                                    : undefined
                                }
                                isSplinePreviewSelected={
                                  !!previewSelectedProductId &&
                                  previewSelectedProductId === slot.product.id
                                }
                                onDetailPress={
                                  onSelectThumbnailForSpline
                                    ? undefined
                                    : slot.isLamp && onViewLampDetail
                                      ? () => onViewLampDetail(slot.product)
                                      : undefined
                                }
                              />
                            </div>
                          </Fragment>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
                {onOpenPicker ? (
                  <div className="relative z-[3] flex shrink-0 flex-col items-center gap-0">
                    <CollectionArcLabel theme={theme} variant="fab" className="pointer-events-none" />
                    <div className="animate-experience-collection-plus-prize-float">
                      <button
                        type="button"
                        onClick={onOpenPicker}
                        className={openPickerFabClass}
                        aria-label="Add artwork to collection"
                        title="Add artwork"
                      >
                        <Plus className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.25} />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              onClick={openOrderBar}
              className={checkoutPillClass}
              aria-label={`Open your collection, total ${finalTotal.toFixed(2)} dollars`}
            >
              <span className="whitespace-nowrap">
                Your Collection · ${formatPriceCompact(finalTotal)}
              </span>
              <span aria-hidden className="text-base leading-none">
                →
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
