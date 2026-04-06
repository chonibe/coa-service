'use client'

import Image from 'next/image'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn, formatPriceCompact } from '@/lib/utils'
import { ExperienceOrderLampIcon } from '../../experience-v2/components/ExperienceOrderLampIcon'
import type { FeaturedBundleFilterOffer } from '../../experience-v2/components/FilterPanel'

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

function BundlePortraitThumb({
  product,
  theme,
  isLamp,
  priority,
}: {
  product: ShopifyProduct
  theme: 'light' | 'dark'
  isLamp?: boolean
  priority?: boolean
}) {
  const imageUrl = product.featuredImage?.url || product.images?.edges?.[0]?.node?.url
  const label = (product.title ?? (isLamp ? 'Street Lamp' : 'Artwork')).trim()
  return (
    <div
      className={cn(
        'relative aspect-[14/20] w-14 shrink-0 overflow-hidden rounded-[10px] shadow-md ring-1 ring-inset ring-black/10 dark:ring-white/15',
        'sm:w-24 sm:rounded-[15px]'
      )}
      title={label}
    >
      {imageUrl ? (
        <Image
          src={getShopifyImageUrl(imageUrl, 400) ?? imageUrl}
          alt={label}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 640px) 56px, 96px"
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-neutral-200 dark:bg-neutral-800">
          {isLamp ? (
            <ExperienceOrderLampIcon
              className={cn(
                'h-6 w-6 sm:h-10 sm:w-10',
                theme === 'light' ? 'text-neutral-500' : 'text-[#b89090]'
              )}
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
    </div>
  )
}

export interface FeaturedArtistBundleSectionProps {
  theme: 'light' | 'dark'
  offer: FeaturedBundleFilterOffer
  lamp: ShopifyProduct
  artworks: [ShopifyProduct, ShopifyProduct]
}

/** Featured artist bundle block: thumbnails, pricing, primary Add to cart (under Spline in the reel). */
export function FeaturedArtistBundleSection({
  theme,
  offer,
  lamp,
  artworks,
}: FeaturedArtistBundleSectionProps) {
  const disabled = offer.disabled === true

  return (
    <section
      className="relative z-[2] w-full shrink-0 px-4 pb-5 pt-1 pointer-events-auto md:px-5 md:pb-6 md:pt-2"
      aria-labelledby="experience-featured-bundle-title"
    >
      <div
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
        <div className="flex w-full min-w-0 items-end justify-center gap-1 sm:gap-2 md:gap-3">
          <BundlePortraitThumb product={lamp} theme={theme} isLamp priority />
          <BundlePlusSep theme={theme} />
          <BundlePortraitThumb product={artworks[0]} theme={theme} priority />
          <BundlePlusSep theme={theme} />
          <BundlePortraitThumb product={artworks[1]} theme={theme} priority />
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
