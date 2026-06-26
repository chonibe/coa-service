'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn, formatPriceCompact } from '@/lib/utils'
import { ExperienceV3LampBundleCard } from './ExperienceV3LampBundleCard'

export type ExperienceV3StickyAddPanelProps = {
  /** Scroll container for IntersectionObserver root (main experience column). */
  scrollRootRef: React.RefObject<HTMLElement | null>
  /** Hero section sentinel — panel shows when this leaves the scroll root. */
  heroSectionRef: React.RefObject<HTMLElement | null>
  previewProduct: ShopifyProduct | null
  lamp: ShopifyProduct
  heroImageUrl: string | null
  previewDisplayTitle: string | null
  previewArtworkUnitUsd: number
  previewLampUnitUsd: number
  listPricePrimary?: string | null
  listPriceCompareAt?: string | null
  showLampBundleCard: boolean
  addButtonLabel: string
  previewInCart: boolean
  isSoldOut: boolean
  onAddWithLamp: () => void
  onArtworkOnly: () => void
  onPrimaryAction: () => void
}

/**
 * Desktop-only sticky slide-out on the right (shop PDP pattern).
 * Appears when the hero section scrolls out of the main column and the
 * preview artwork is not yet in the cart (remove flows stay in the hero).
 */
export function ExperienceV3StickyAddPanel({
  scrollRootRef,
  heroSectionRef,
  previewProduct,
  lamp,
  heroImageUrl,
  previewDisplayTitle,
  previewArtworkUnitUsd,
  previewLampUnitUsd,
  listPricePrimary,
  listPriceCompareAt,
  showLampBundleCard,
  addButtonLabel,
  previewInCart,
  isSoldOut,
  onAddWithLamp,
  onArtworkOnly,
  onPrimaryAction,
}: ExperienceV3StickyAddPanelProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const root = scrollRootRef.current
    const target = heroSectionRef.current
    if (!root || !target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting)
      },
      {
        root,
        threshold: 0,
        rootMargin: '0px 0px -48px 0px',
      }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [scrollRootRef, heroSectionRef])

  const showPanel =
    isVisible &&
    previewProduct &&
    previewProduct.id !== lamp.id &&
    !previewInCart

  const artImg =
    heroImageUrl ??
    getShopifyImageUrl(
      previewProduct?.featuredImage?.url ?? previewProduct?.images?.edges?.[0]?.node?.url,
      560
    ) ??
    previewProduct?.featuredImage?.url ??
    previewProduct?.images?.edges?.[0]?.node?.url ??
    null

  return (
    <div
      className={cn(
        'pointer-events-none fixed bottom-4 right-4 z-40 hidden w-[min(232px,calc(100vw-2rem))] transition-all duration-300 ease-out lg:block',
        showPanel ? 'pointer-events-auto translate-x-0 opacity-100' : 'translate-x-[calc(100%+1rem)] opacity-0'
      )}
      aria-hidden={!showPanel}
    >
      <div
        className={cn(
          'overflow-hidden rounded-xl border border-border/50 bg-card/95 shadow-md',
          'backdrop-blur-sm'
        )}
      >
        {showLampBundleCard && previewProduct ? (
          <div className="p-2">
            <ExperienceV3LampBundleCard
              lamp={lamp}
              artwork={previewProduct}
              artworkUnitUsd={previewArtworkUnitUsd}
              lampUnitUsd={previewLampUnitUsd}
              disabled={isSoldOut}
              onAddWithLamp={onAddWithLamp}
              onArtworkOnly={onArtworkOnly}
            />
          </div>
        ) : (
          <div className="p-2.5">
            {artImg ? (
              <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-md bg-experience-surface-2">
                <Image
                  src={artImg}
                  alt={previewDisplayTitle ?? 'Artwork'}
                  fill
                  className="object-contain"
                  sizes="232px"
                  unoptimized
                />
              </div>
            ) : null}

            <div className="mb-2 space-y-0.5">
              {previewDisplayTitle ? (
                <h3 className="line-clamp-2 text-xs font-medium text-foreground">{previewDisplayTitle}</h3>
              ) : null}
              {(listPricePrimary || previewArtworkUnitUsd > 0) && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {listPricePrimary ?? `$${formatPriceCompact(previewArtworkUnitUsd)}`}
                  </span>
                  {listPriceCompareAt ? (
                    <span className="text-xs tabular-nums text-muted-foreground line-through">
                      {listPriceCompareAt}
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isSoldOut}
              onClick={onPrimaryAction}
              className={cn(
                'flex w-full items-center justify-center rounded-full px-3 py-2 text-xs font-medium transition-colors',
                isSoldOut
                  ? 'cursor-not-allowed bg-muted text-muted-foreground'
                  : 'bg-experience-cta text-white hover:bg-experience-cta-hover dark:text-neutral-900'
              )}
            >
              {isSoldOut ? 'Sold out' : addButtonLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
