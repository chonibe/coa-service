'use client'

import { useEffect, useState } from 'react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn } from '@/lib/utils'
import { getStorePageContent } from '@/lib/content/site-content'
import { ExperienceV3FloatingAddCard, type ExperienceV3AddButtonEditionParts } from './ExperienceV3FloatingAddCard'
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
  addButtonLabel: string
  addButtonEditionParts?: ExperienceV3AddButtonEditionParts | null
  previewInCart: boolean
  isSoldOut: boolean
  onPrimaryAction: () => void
  /** When true, offset above the mobile collection bar. */
  mobileCollectionBarVisible?: boolean
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
  offerHint?: string | null
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
  addButtonLabel,
  addButtonEditionParts = null,
  previewInCart,
  isSoldOut,
  onPrimaryAction,
  mobileCollectionBarVisible = false,
  bundleOffer,
  priceMeta,
  offerHint = null,
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
        'pointer-events-none fixed z-40',
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
          'lg:mx-auto lg:max-w-lg lg:px-4 lg:pb-1'
        )}
      >
        <ExperienceV3FloatingAddCard
          artImg={artImg}
          artAlt={productMetaTitle ?? experienceV3Content.stickyAddPanel.artworkFallback}
          title={productMetaTitle}
          artistName={artistName}
          reserveEditionLabel={reserveEditionLabel}
          addButtonLabel={addButtonLabel}
          addButtonEditionParts={addButtonEditionParts}
          previewInCart={previewInCart}
          isSoldOut={isSoldOut}
          onPrimaryAction={onPrimaryAction}
          bundleOffer={bundleOffer}
          priceMeta={priceMeta}
          offerHint={offerHint}
        />
      </div>
    </div>
  )
}
