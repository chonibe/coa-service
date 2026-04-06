'use client'

import { Fragment, useMemo } from 'react'
import Image from 'next/image'
import { ChevronRight, Plus } from 'lucide-react'
import { ExperienceOrderLampIcon } from './ExperienceOrderLampIcon'
import { useExperienceOrder } from '../ExperienceOrderContext'
import { useExperienceTheme } from '../ExperienceThemeContext'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn, formatPriceCompact } from '@/lib/utils'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import {
  EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS,
  resolveExperienceNextAction,
} from '@/lib/shop/experience-journey-next-action'
/** Portrait tiles match [`ArtworkCarouselBar`](../../experience/components/ArtworkCarouselBar.tsx) strip (14×20, 15px radius). */
const THUMB_WIDTH_PX = 36
const IMAGE_REQUEST_PX = 280
const MAX_THUMBS = 5

export interface ExperienceCheckoutStickyBarProps {
  lamp: ShopifyProduct
  lampQuantity: number
  /** Artworks in the experience cart (excludes lamp). */
  selectedArtworks: ShopifyProduct[]
  /** Lamp + artworks subtotal before promo (same basis as OrderBar). */
  orderSubtotal: number
  /** Opens the artwork picker; **empty collection** row uses it for “Create your own bundle”; **≥1 artwork** uses centered FAB. */
  onOpenPicker?: () => void
  /** When `collection` and there are no artworks yet, the bar shows the primary CTA (not in watchlist empty state). */
  stripMode?: 'collection' | 'watchlist'
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

function StickyThumb({
  product,
  isLamp,
  theme,
}: {
  product: ShopifyProduct
  isLamp: boolean
  theme: 'light' | 'dark'
}) {
  const raw = firstImageUrl(product)
  const src = raw ? (getShopifyImageUrl(raw, IMAGE_REQUEST_PX) ?? raw) : null
  const label = (product.title ?? (isLamp ? 'Street Lamp' : 'Artwork')).trim()

  const frame = cn(
    'relative shrink-0 overflow-hidden rounded-[15px]',
    /* Same portrait ratio as carousel thumbs; compact width for the sticky row */
    'w-9 aspect-[14/20] sm:w-10'
  )

  return (
    <div className={frame} title={label}>
      {src ? (
        <Image
          src={src}
          alt={label}
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
}

/**
 * Sticky bottom bar: **empty collection** shows “Create your own bundle”; **≥1 artwork** shows thumbnails, checkout, and optional centered add FAB.
 * Featured bundle promo (lamp + two prints) lives in [`ArtworkCarouselBar`](../../experience/components/ArtworkCarouselBar.tsx) when the collection strip is empty.
 * Opens the OrderBar drawer via `openOrderBar` (same as header cart).
 */
export function ExperienceCheckoutStickyBar({
  lamp,
  lampQuantity,
  selectedArtworks,
  orderSubtotal,
  onOpenPicker,
  stripMode = 'collection',
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
    'relative flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-full border border-[#047AFF] bg-[#047AFF] text-white shadow-md transition-all active:scale-95 hover:border-[#0366d6] hover:bg-[#0366d6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047AFF] sm:h-[3.25rem] sm:w-[3.25rem]',
    journeyNext === 'choose_artworks' && EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS
  )

  const checkoutPillClass = cn(
    'relative z-[3] flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold shadow-md transition-transform active:scale-[0.98]',
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

  const { visibleSlots, overflowCount } = useMemo(() => {
    if (slots.length <= MAX_THUMBS) {
      return { visibleSlots: slots, overflowCount: 0 }
    }
    const cap = MAX_THUMBS - 1
    return {
      visibleSlots: slots.slice(0, cap),
      overflowCount: slots.length - cap,
    }
  }, [slots])

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
    return `Checkout summary: ${parts.join(', ')}`
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
          <>
            <div className="flex w-full min-w-0 items-center gap-3">
              {onOpenPicker ? (
                <button
                  type="button"
                  onClick={onOpenPicker}
                  className={cn(openPickerFabClass, 'relative z-[3]')}
                  aria-label="Add artwork to collection"
                  title="Add artwork"
                >
                  <Plus className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.25} />
                </button>
              ) : null}
              {/* Thumbnails hug the checkout button (right). Same slots on all breakpoints — lamp tiles only when lampQuantity > 0. */}
              <div className="flex min-w-0 flex-1 justify-end">
                <div className="flex max-w-full min-w-0 items-center justify-end gap-1.5 overflow-x-auto scrollbar-hide">
                  {visibleSlots.map((slot, index) => (
                    <Fragment key={slot.key}>
                      {index > 0 && <PlusSep theme={theme} />}
                      <StickyThumb product={slot.product} isLamp={slot.isLamp} theme={theme} />
                    </Fragment>
                  ))}
                  {overflowCount > 0 && (
                    <>
                      <PlusSep theme={theme} />
                      <div
                        className={cn(
                          'flex w-9 aspect-[14/20] shrink-0 items-center justify-center rounded-[15px] text-xs font-bold tabular-nums sm:w-10',
                          theme === 'light' ? 'text-neutral-600' : 'text-white/80'
                        )}
                        title={`${overflowCount} more items`}
                      >
                        +{overflowCount}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={openOrderBar}
                className={checkoutPillClass}
                aria-label={`Open checkout, total ${finalTotal.toFixed(2)} dollars`}
              >
                <span className="whitespace-nowrap">
                  Checkout · ${formatPriceCompact(finalTotal)}
                </span>
                <span aria-hidden className="text-base leading-none">
                  →
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
