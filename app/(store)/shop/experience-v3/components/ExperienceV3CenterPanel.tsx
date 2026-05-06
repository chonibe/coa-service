'use client'

import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn, formatPriceCompact } from '@/lib/utils'
import { useExperienceTheme } from '@/app/(store)/shop/experience-v2/ExperienceThemeContext'
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'
import {
  formatStreetArtworkListPrice,
  formatStreetNextSalesChipText,
} from '@/lib/shop/experience-street-ladder-display'

interface ExperienceV3CenterPanelProps {
  lamp: ShopifyProduct
  heroProduct: ShopifyProduct | null
  streetEdition: StreetEditionStatesRow | null
  lampQuantity: number
  onPrimaryAdd?: () => void
  /** Open detail / specifications */
  onOpenSpecs?: () => void
  primaryDisabled?: boolean
  primaryLabel?: string
}

export function ExperienceV3CenterPanel({
  lamp,
  heroProduct,
  streetEdition,
  lampQuantity,
  onPrimaryAdd,
  onOpenSpecs,
  primaryDisabled,
  primaryLabel,
}: ExperienceV3CenterPanelProps) {
  const { theme } = useExperienceTheme()
  const title = heroProduct?.title ?? 'Choose artwork'
  const artist = heroProduct && heroProduct.id !== lamp.id ? (heroProduct.vendor ?? '') : ''
  const isLampHero = heroProduct?.id === lamp.id

  const footerPrice =
    heroProduct && !isLampHero ? formatStreetArtworkListPrice(heroProduct, streetEdition ?? null, false) : null
  const streetActive = !!(streetEdition && streetEdition.priceUsd != null && streetEdition.priceUsd > 0)
  const nextBumpText =
    heroProduct && streetActive && streetEdition ? formatStreetNextSalesChipText(streetEdition.nextBump) : null

  const remaining =
    heroProduct &&
    heroProduct.id !== lamp.id &&
    typeof heroProduct?.variants?.edges?.[0]?.node?.quantityAvailable === 'number' &&
    heroProduct.variants.edges[0]!.node!.quantityAvailable! >= 0
      ? {
          qty: heroProduct.variants.edges[0]!.node!.quantityAvailable!,
          edition: streetEdition?.totalStockCap ?? streetEdition?.listedQty ?? null,
        }
      : null

  return (
    <div
      className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col justify-center px-4 py-8 md:px-8 lg:max-w-md',
        theme === 'light' ? 'text-neutral-900' : 'text-[#f0e8e8]'
      )}
    >
      {artist ? (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-orange-400/95">{artist} &gt;</p>
      ) : heroProduct?.id === lamp.id ? (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-orange-400/95">Street Lamp</p>
      ) : (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">Street Collector</p>
      )}
      <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl">{title}</h1>

      {!isLampHero && heroProduct ? (
        <div className="mt-5 space-y-2">
          {remaining && remaining.edition != null && remaining.edition > 0 ? (
            <>
              <div className={cn('h-1 w-full rounded-full overflow-hidden', theme === 'light' ? 'bg-neutral-200' : 'bg-white/15')}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                  style={{ width: `${Math.min(100, Math.round((remaining.qty / Math.max(1, remaining.edition)) * 100))}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {remaining.qty} of {remaining.edition} remaining in this edition
              </p>
            </>
          ) : (
            heroProduct.availableForSale === false && (
              <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Sold out</p>
            )
          )}
          {footerPrice && (
            <div className="flex flex-wrap items-baseline gap-2 pt-1">
              <span className="text-sm font-semibold tabular-nums">{footerPrice.primary}</span>
              {footerPrice.compareAt ? (
                <span className="text-xs tabular-nums text-neutral-500 line-through">{footerPrice.compareAt}</span>
              ) : null}
              {nextBumpText ? (
                <>
                  <span className="text-neutral-600 dark:text-neutral-500 select-none text-[11px]" aria-hidden>
                    ✦
                  </span>
                  <span className="text-xs text-neutral-600 dark:text-neutral-300">{nextBumpText}</span>
                </>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        lampQuantity === 0 && (
          <p className={cn('mt-4 max-w-xs text-sm', theme === 'light' ? 'text-neutral-600' : 'text-neutral-400')}>
            Pick a lamp and artworks from your collection tray. Preview without buying by tapping artwork cards — use + to add
            to checkout.
          </p>
        )
      )}

      <div className="mt-8 flex flex-col gap-3">
        {onPrimaryAdd ? (
          <button
            type="button"
            disabled={primaryDisabled ?? !heroProduct}
            onClick={onPrimaryAdd}
            className={cn(
              'w-full rounded-xl px-5 py-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              'bg-[#e8ae90] text-neutral-950 hover:bg-[#e19a75]'
            )}
          >
            {primaryLabel ??
              (!heroProduct
                ? 'Select artwork'
                : heroProduct.id === lamp.id
                  ? `Add Lamp — $${formatPriceCompact(parseFloat(lamp.priceRange?.minVariantPrice?.amount ?? '0'))}`
                  : `Add to Cart ${footerPrice ? ` ${footerPrice.primary}` : ''}`)}
          </button>
        ) : null}
        {onOpenSpecs && heroProduct ? (
          <button
            type="button"
            onClick={onOpenSpecs}
            className={cn(
              'w-full rounded-xl px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em]',
              theme === 'light'
                ? 'border border-neutral-900/15 bg-white text-neutral-800'
                : 'border border-white/15 bg-neutral-950/70 text-neutral-100'
            )}
          >
            Specifications
          </button>
        ) : null}
      </div>
    </div>
  )
}
