'use client'

import { useEffect, useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import type { CartEditionHold } from '@/lib/shop/cart-edition-hold-types'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn } from '@/lib/utils'
import { getStorePageContent } from '@/lib/content/site-content'
import { ExperienceV3FloatingAddCard, type ExperienceV3AddButtonEditionParts } from './ExperienceV3FloatingAddCard'
import { ExperienceTrustStrip } from './ExperienceTrustStrip'
import type { ExperienceV3BundleMode } from './ExperienceV3LampBundleCard'

const experienceV3Content = getStorePageContent('experienceV3')

export type ExperienceV3StickyAddPanelProps = {
  scrollRootRef: React.RefObject<HTMLElement | null>
  previewProduct: ShopifyProduct | null
  lamp: ShopifyProduct
  heroImageUrl: string | null
  previewDisplayTitle: string | null
  artistName?: string | null
  reserveEditionLabel?: string | null
  cartEditionHold?: CartEditionHold | null
  cartEditionHoldFallbackNumber?: number | null
  addButtonLabel: string
  addButtonEditionParts?: ExperienceV3AddButtonEditionParts | null
  previewInCart: boolean
  isSoldOut: boolean
  onPrimaryAction: () => void
  /** When true, offset above the mobile collection bar. */
  mobileCollectionBarVisible?: boolean
  /** Opens / toggles the artwork collection picker (same as top-bar “The Collection”). */
  onOpenCollection?: () => void
  /** Whether the mobile artwork picker sheet is open (for aria / active ring). */
  collectionPickerOpen?: boolean
  /** Mobile bundle offer toggle — shown inside the floating card when the bundle is available. */
  bundleOffer?: {
    mode: ExperienceV3BundleMode
    onModeChange: (mode: ExperienceV3BundleMode) => void
    artworkUnitUsd: number
    lampUnitUsd: number
    listPriceCompareAt?: string | null
  }
  /** Price + edition-step chip — shown in the bar instead of the hero. */
  priceMeta?: {
    primary?: string | null
    compareAt?: string | null
    nextStepChip?: string | null
  }
}

/**
 * Always-visible floating bottom product card for add-to-collection.
 */
export function ExperienceV3StickyAddPanel({
  scrollRootRef,
  previewProduct,
  lamp,
  heroImageUrl,
  previewDisplayTitle,
  artistName = null,
  reserveEditionLabel = null,
  cartEditionHold = null,
  cartEditionHoldFallbackNumber = null,
  addButtonLabel,
  addButtonEditionParts = null,
  previewInCart,
  isSoldOut,
  onPrimaryAction,
  mobileCollectionBarVisible = false,
  onOpenCollection,
  collectionPickerOpen = false,
  bundleOffer,
  priceMeta,
}: ExperienceV3StickyAddPanelProps) {
  const [columnFrame, setColumnFrame] = useState<{ left: number; width: number } | null>(null)

  useEffect(() => {
    const root = scrollRootRef.current
    if (!root || typeof window === 'undefined') return

    const updateFrame = () => {
      const rect = root.getBoundingClientRect()
      setColumnFrame({
        left: rect.left,
        width: rect.width,
      })
    }

    updateFrame()

    const resizeObserver = new ResizeObserver(() => updateFrame())
    resizeObserver.observe(root)
    window.addEventListener('resize', updateFrame)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateFrame)
    }
  }, [scrollRootRef])

  const showPanel = previewProduct && previewProduct.id !== lamp.id

  const artImg =
    getShopifyImageUrl(
      previewProduct?.featuredImage?.url ?? previewProduct?.images?.edges?.[0]?.node?.url,
      560
    ) ??
    previewProduct?.featuredImage?.url ??
    previewProduct?.images?.edges?.[0]?.node?.url ??
    heroImageUrl ??
    null

  const productMetaTitle = previewDisplayTitle ?? previewProduct?.title ?? null

  if (!showPanel) return null

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-40 top-auto',
        'max-lg:inset-x-0 max-lg:px-2',
        mobileCollectionBarVisible
          ? [
              'max-lg:bottom-[max(4.5rem,calc(env(safe-area-inset-bottom)+3.75rem))]',
              'lg:bottom-[max(4.75rem,calc(env(safe-area-inset-bottom)+4.25rem))]',
            ]
          : ['max-lg:bottom-0', 'lg:bottom-[max(0.75rem,env(safe-area-inset-bottom))]']
      )}
      style={
        columnFrame && typeof window !== 'undefined' && window.innerWidth >= 1024
          ? {
              left: `${columnFrame.left}px`,
              width: `${columnFrame.width}px`,
            }
          : undefined
      }
    >
      <div
        className={cn(
          'pointer-events-auto w-full max-lg:max-w-none',
          'max-lg:pb-[max(0.25rem,env(safe-area-inset-bottom))]',
          'lg:mx-auto lg:px-6 lg:pb-1'
        )}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-center md:gap-3">
          <div className="flex min-w-0 w-full flex-col gap-2 md:max-w-3xl">
            <ExperienceV3FloatingAddCard
              artImg={artImg}
              artAlt={productMetaTitle ?? experienceV3Content.stickyAddPanel.artworkFallback}
              title={productMetaTitle}
              artistName={artistName}
              reserveEditionLabel={reserveEditionLabel}
              cartEditionHold={cartEditionHold}
              cartEditionHoldFallbackNumber={cartEditionHoldFallbackNumber}
              addButtonLabel={addButtonLabel}
              addButtonEditionParts={addButtonEditionParts}
              previewInCart={previewInCart}
              isSoldOut={isSoldOut}
              onPrimaryAction={onPrimaryAction}
              bundleOffer={bundleOffer}
              priceMeta={priceMeta}
            />
            {onOpenCollection ? (
              <button
                type="button"
                onClick={onOpenCollection}
                className={cn(
                  'flex w-full shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-full border px-3.5 py-2.5 text-xs font-semibold transition-colors active:scale-95 outline-none sm:gap-2 sm:px-4 sm:text-sm',
                  'focus-visible:ring-2 focus-visible:ring-offset-2',
                  'border-experience-cta/50 bg-card/95 text-experience-cta shadow-sm backdrop-blur-md hover:border-experience-cta/75 hover:bg-experience-cta/[0.08]',
                  'focus-visible:ring-experience-cta focus-visible:ring-offset-background',
                  'lg:hidden',
                  collectionPickerOpen && 'ring-2 ring-experience-cta/70'
                )}
                aria-label={
                  collectionPickerOpen
                    ? 'Close the collection picker'
                    : 'Open the collection picker'
                }
                aria-expanded={collectionPickerOpen}
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.25} aria-hidden />
                {experienceV3Content.stickyAddPanel.openCollection}
              </button>
            ) : null}
          </div>
          <ExperienceTrustStrip variant="stacked" className="hidden shrink-0 md:block" />
        </div>
      </div>
    </div>
  )
}
