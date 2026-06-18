'use client'

import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { capitalizeFirstLetter, cn, formatPriceCompact } from '@/lib/utils'

const BUNDLE_NAME = 'Street Lamp Display Bundle'

export type ExperienceV3LampBundleCardProps = {
  lamp: ShopifyProduct
  artwork: ShopifyProduct
  artworkUnitUsd: number
  lampUnitUsd: number
  disabled?: boolean
  onAddWithLamp: () => void
  onArtworkOnly: () => void
}

export function ExperienceV3LampBundleCard({
  lamp,
  artwork,
  artworkUnitUsd,
  lampUnitUsd,
  disabled = false,
  onAddWithLamp,
  onArtworkOnly,
}: ExperienceV3LampBundleCardProps) {
  const lampImg =
    getShopifyImageUrl(lamp.featuredImage?.url ?? lamp.images?.edges?.[0]?.node?.url, 400) ??
    lamp.featuredImage?.url ??
    lamp.images?.edges?.[0]?.node?.url ??
    null

  const artImg =
    getShopifyImageUrl(artwork.featuredImage?.url ?? artwork.images?.edges?.[0]?.node?.url, 400) ??
    artwork.featuredImage?.url ??
    artwork.images?.edges?.[0]?.node?.url ??
    null

  const artworkTitle = capitalizeFirstLetter(artwork.title.trim())
  const artworkLabel =
    artworkTitle.length > 26
      ? `${artworkTitle.slice(0, 25)}…`
      : artworkTitle || 'Your print'

  const bundleTotal = artworkUnitUsd + lampUnitUsd

  return (
    <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#141212]/80 p-3.5">
      <div className="space-y-1 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFBA94]/12 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#FFBA94]">
            <Sparkles className="h-2.5 w-2.5" aria-hidden />
            Bundle
          </span>
        </div>
        <h3 className="text-[14px] font-semibold leading-snug text-white">{BUNDLE_NAME}</h3>
        <p className="text-[11px] leading-snug text-white/50">
          Street Lamp + your selected print — everything to display this artwork at home.
        </p>
      </div>

      <div
        className="flex items-end justify-center gap-3 py-0.5"
        aria-label={`${BUNDLE_NAME}: Street Lamp and ${artworkTitle}`}
      >
        <div className="flex w-[4.5rem] flex-col items-center gap-1.5">
          <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-[#1c1919] ring-1 ring-white/[0.06]">
            {lampImg ? (
              <Image src={lampImg} alt="" fill className="object-cover" sizes="36px" unoptimized />
            ) : null}
          </div>
          <span className="max-w-full truncate text-center text-[9px] font-medium uppercase tracking-wide text-white/45">
            Street Lamp
          </span>
        </div>
        <span className="mb-5 text-sm font-light text-white/30" aria-hidden>
          +
        </span>
        <div className="flex w-[4.5rem] flex-col items-center gap-1.5">
          <div className="relative aspect-[14/20] h-12 w-9 shrink-0 overflow-hidden rounded-md bg-[#1c1919] ring-1 ring-white/[0.06]">
            {artImg ? (
              <Image src={artImg} alt="" fill className="object-cover" sizes="36px" unoptimized />
            ) : null}
          </div>
          <span
            className="max-w-full truncate text-center text-[9px] font-medium text-white/45"
            title={artworkTitle}
          >
            {artworkLabel}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={onAddWithLamp}
          className={cn(
            'flex w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors',
            disabled
              ? 'cursor-not-allowed bg-white/10 text-white/40'
              : 'bg-[#FFBA94] text-neutral-900 hover:bg-[#ffc9a8]'
          )}
        >
          <span>Add {BUNDLE_NAME}</span>
          {bundleTotal > 0 ? (
            <>
              <span className="opacity-60" aria-hidden>
                ·
              </span>
              <span className="font-medium">${formatPriceCompact(bundleTotal)}</span>
            </>
          ) : null}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onArtworkOnly}
          className="w-full py-1 text-center text-[11px] font-medium text-white/45 underline-offset-4 transition-colors hover:text-white/70 hover:underline disabled:opacity-40"
        >
          Artwork only
        </button>
      </div>
    </div>
  )
}
