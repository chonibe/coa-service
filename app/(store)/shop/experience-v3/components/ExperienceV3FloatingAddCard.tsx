'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { Gem } from 'lucide-react'
import { cn, formatPriceCompact } from '@/lib/utils'
import { getStorePageContent } from '@/lib/content/site-content'
import type { CartEditionHold } from '@/lib/shop/cart-edition-hold-types'
import { resolveCartEditionHoldDisplayNumber } from '@/lib/shop/compute-cart-edition-reserve'
import {
  formatEditionHoldCompactLineParts,
} from '@/lib/shop/format-edition-hold-display'
import { useCartEditionHoldRemainingLive } from '@/lib/shop/use-cart-edition-holds'
import {
  EditionHoldCompactLineText,
} from '../../experience-v2/components/EditionHoldIndicator'
import {
  experienceV3AddCtaClass,
  experienceV3AddCtaDisabledClass,
} from '@/lib/shop/street-collector-cta'
import { EXPERIENCE_PURCHASE_HINTS } from '@/lib/shop/experience-purchase-hints'
import { ExperienceMeaningHint } from '../../experience-v2/components/ExperienceMeaningHint'
import { ExperienceTrustStrip } from './ExperienceTrustStrip'
import { ExperienceV3StickyBarProductMeta } from './ExperienceV3StickyBarProductMeta'
import type { ExperienceV3BundleMode } from './ExperienceV3LampBundleCard'

const experienceV3Content = getStorePageContent('experienceV3')

const bundleToggleTrackClass =
  'flex w-full items-center rounded-full bg-muted/90 p-0.5 ring-1 ring-border/60'
const bundleToggleButtonBaseClass =
  'min-h-0 flex-1 rounded-full px-2 py-0.5 text-[9px] leading-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background'
const bundleToggleButtonSelectedClass =
  'bg-card font-semibold text-foreground shadow-inner ring-1 ring-black/[0.06] dark:bg-background dark:ring-white/10'
const bundleToggleButtonUnselectedClass =
  'font-medium text-muted-foreground hover:text-foreground/80'

export type ExperienceV3AddButtonEditionParts = {
  prefix: string
  editionBadge: string
  suffix: string
}

export type ExperienceV3FloatingAddCardProps = {
  artImg: string | null
  artAlt: string
  title: string | null
  artistName?: string | null
  reserveEditionLabel?: string | null
  /** Active cart hold — desktop chip shows live expiry (e.g. "Edition #4 · 23h 42m reserved"). */
  cartEditionHold?: CartEditionHold | null
  cartEditionHoldFallbackNumber?: number | null
  addButtonLabel: string
  /** When set, renders prefix + edition badge + suffix inside the add CTA (edition reserve flow). */
  addButtonEditionParts?: ExperienceV3AddButtonEditionParts | null
  previewInCart: boolean
  isSoldOut: boolean
  onPrimaryAction: () => void
  showTrustStrip?: boolean
  className?: string
  /** Bundle offer — artwork-only vs lamp+artwork toggle above the add CTA. */
  bundleOffer?: {
    mode: ExperienceV3BundleMode
    onModeChange: (mode: ExperienceV3BundleMode) => void
    artworkUnitUsd: number
    lampUnitUsd: number
    listPriceCompareAt?: string | null
  }
  priceMeta?: {
    primary?: string | null
    compareAt?: string | null
    nextStepChip?: string | null
  }
}

/**
 * Compact floating product card: artwork thumb + title/meta + add CTA in one element.
 */
export function ExperienceV3FloatingAddCard({
  artImg,
  artAlt,
  title,
  artistName,
  reserveEditionLabel,
  cartEditionHold = null,
  cartEditionHoldFallbackNumber = null,
  addButtonLabel,
  addButtonEditionParts = null,
  previewInCart,
  isSoldOut,
  onPrimaryAction,
  showTrustStrip = true,
  className,
  bundleOffer,
  priceMeta,
}: ExperienceV3FloatingAddCardProps) {
  const isBundleMode = bundleOffer?.mode === 'withLamp'
  const bundleProductLabel =
    isBundleMode && !previewInCart ? experienceV3Content.bundleCard.toggleAddLamp : null
  const bundleTotal = bundleOffer ? bundleOffer.artworkUnitUsd + bundleOffer.lampUnitUsd : 0
  const activePrice = bundleOffer
    ? isBundleMode
      ? bundleTotal
      : bundleOffer.artworkUnitUsd
    : 0
  const activeCompareAt = bundleOffer && isBundleMode ? bundleOffer.listPriceCompareAt : null

  const priceSuffix = bundleOffer
    ? isBundleMode
      ? experienceV3Content.bundleCard.priceSuffixBundle
      : experienceV3Content.bundleCard.priceSuffixArtwork
    : null

  const showInlinePrice = !previewInCart && (bundleOffer ? activePrice > 0 : Boolean(priceMeta?.primary))

  const showAddButton = !previewInCart

  const addButtonClassName = cn(
    experienceV3AddCtaClass,
    addButtonEditionParts && 'flex-wrap',
    isSoldOut && experienceV3AddCtaDisabledClass
  )

  const editionCtaBadgeClassName =
    'inline-flex shrink-0 items-center rounded-full border border-experience-highlight/50 bg-experience-highlight/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none sm:px-2 sm:text-[11px]'

  const addButtonContent = (
    <>
      {addButtonEditionParts ? (
        <>
          <span className="whitespace-nowrap">{addButtonEditionParts.prefix}</span>
          <span className={editionCtaBadgeClassName}>{addButtonEditionParts.editionBadge}</span>
          <span className="whitespace-nowrap">{addButtonEditionParts.suffix}</span>
        </>
      ) : (
        <span className="truncate">{addButtonLabel}</span>
      )}
    </>
  )

  const holdRemaining = useCartEditionHoldRemainingLive(cartEditionHold?.expiresAt)

  const reservedEditionLineParts = useMemo(() => {
    if (!previewInCart || !cartEditionHold) return null
    return formatEditionHoldCompactLineParts(
      resolveCartEditionHoldDisplayNumber(cartEditionHold, cartEditionHoldFallbackNumber),
      holdRemaining
    )
  }, [previewInCart, cartEditionHold, cartEditionHoldFallbackNumber, holdRemaining])

  const reservedEditionAriaLabel = reservedEditionLineParts
    ? `${reservedEditionLineParts.editionLabel}${reservedEditionLineParts.timerSuffix}`
    : reserveEditionLabel

  const showInlineEditionBadge =
    previewInCart && Boolean(reservedEditionLineParts || reserveEditionLabel)

  const editionBadge = showInlineEditionBadge ? (
    <div
      className="shrink-0 text-right"
      role="status"
      aria-label={reservedEditionAriaLabel ?? reserveEditionLabel ?? undefined}
    >
      <div className="inline-flex max-w-[min(100%,14rem)] items-center gap-1 rounded-full border border-experience-highlight/35 bg-experience-highlight/10 px-2.5 py-1 shadow-sm sm:max-w-none sm:gap-2 sm:px-3 sm:py-1.5">
        <Gem className="h-3.5 w-3.5 shrink-0 text-experience-highlight sm:h-4 sm:w-4" aria-hidden />
        {reservedEditionLineParts ? (
          <EditionHoldCompactLineText
            parts={reservedEditionLineParts}
            className="min-w-0 text-[11px] leading-tight sm:whitespace-nowrap sm:text-base sm:leading-tight"
            timerClassName="font-normal text-muted-foreground"
          />
        ) : (
          <span className="min-w-0 text-[11px] font-bold tabular-nums leading-tight text-experience-highlight sm:whitespace-nowrap sm:text-base sm:leading-tight">
            {reserveEditionLabel}
          </span>
        )}
      </div>
    </div>
  ) : null

  const nextStepChip =
    !previewInCart && priceMeta?.nextStepChip ? (
      <div className="flex max-w-[6.5rem] flex-col items-end gap-0.5 md:max-w-[8rem]">
        <p
          className="text-right text-[9px] font-semibold leading-tight tabular-nums text-experience-highlight md:text-[10px]"
          title={EXPERIENCE_PURCHASE_HINTS.ladder}
        >
          {priceMeta.nextStepChip}
        </p>
        <ExperienceMeaningHint
          explanation="Prices rise as editions sell."
          alwaysVisible
          className="text-right"
        />
      </div>
    ) : null

  const inlinePriceContent =
    showInlinePrice && (bundleOffer || priceMeta?.primary) ? (
      bundleOffer && activePrice > 0 ? (
        <div className="flex flex-col items-end gap-0.5">
          {activeCompareAt ? (
            <span className="text-[10px] tabular-nums text-muted-foreground line-through">{activeCompareAt}</span>
          ) : null}
          <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
            ${formatPriceCompact(activePrice)}
          </span>
          {priceSuffix ? (
            <span className="max-w-[4.5rem] truncate text-[9px] font-medium leading-tight text-muted-foreground md:max-w-[5.5rem] md:text-[10px]">
              {priceSuffix}
            </span>
          ) : null}
          {nextStepChip}
        </div>
      ) : priceMeta?.primary ? (
        <div className="flex flex-col items-end gap-0.5">
          {priceMeta.compareAt ? (
            <span className="text-[10px] tabular-nums text-muted-foreground line-through">{priceMeta.compareAt}</span>
          ) : null}
          <span className="text-base font-bold tabular-nums tracking-tight text-foreground">{priceMeta.primary}</span>
          {nextStepChip}
        </div>
      ) : null
    ) : null

  const mobileInlinePrice = inlinePriceContent ? (
    <div className="shrink-0 text-right md:hidden">{inlinePriceContent}</div>
  ) : null

  const desktopInlinePrice = inlinePriceContent ? (
    <div className="hidden shrink-0 text-right md:block">{inlinePriceContent}</div>
  ) : null

  const artworkThumb = artImg ? (
    <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-background shadow-sm sm:h-16 sm:w-12">
      <Image
        src={artImg}
        alt={artAlt}
        fill
        className="object-cover"
        sizes="48px"
        unoptimized
      />
    </div>
  ) : null

  const productTitleBlock = (
    <ExperienceV3StickyBarProductMeta
      artistName={artistName}
      title={title}
      bundleLabel={bundleProductLabel}
      align="left"
      className="min-w-0 flex-1"
    />
  )

  const desktopAddButton = showAddButton ? (
    <button
      type="button"
      disabled={isSoldOut}
      onClick={onPrimaryAction}
      className={cn(addButtonClassName, 'hidden shrink-0 md:flex')}
    >
      {addButtonContent}
    </button>
  ) : null

  const mobileAddButton = showAddButton ? (
    <button
      type="button"
      disabled={isSoldOut}
      onClick={onPrimaryAction}
      className={cn(addButtonClassName, 'w-full md:hidden')}
    >
      {addButtonContent}
    </button>
  ) : null

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showTrustStrip ? (
        <ExperienceTrustStrip className="rounded-xl shadow-sm md:hidden" />
      ) : null}
      <div
        className={cn(
          'flex flex-col gap-2.5 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md',
          'sm:gap-3 sm:p-3 md:gap-3 md:p-4'
        )}
      >
        {bundleOffer && !previewInCart ? (
          <div className="space-y-1">
            <div
              aria-label={experienceV3Content.bundleCard.toggleLabel}
              className={bundleToggleTrackClass}
              role="group"
            >
              <button
                type="button"
                aria-pressed={isBundleMode}
                onClick={() => bundleOffer.onModeChange('withLamp')}
                className={cn(
                  bundleToggleButtonBaseClass,
                  'py-1 text-[10px] md:px-3 md:py-1 md:text-[11px]',
                  isBundleMode ? bundleToggleButtonSelectedClass : bundleToggleButtonUnselectedClass
                )}
              >
                <span className="block leading-tight">{experienceV3Content.bundleCard.toggleAddLamp}</span>
                <span className="mt-0.5 block text-[9px] font-bold tabular-nums text-foreground/80 md:hidden">
                  ${formatPriceCompact(bundleTotal)}
                </span>
              </button>
              <button
                type="button"
                aria-pressed={!isBundleMode}
                onClick={() => bundleOffer.onModeChange('artworkOnly')}
                className={cn(
                  bundleToggleButtonBaseClass,
                  'py-1 text-[10px] md:px-3 md:py-1 md:text-[11px]',
                  !isBundleMode ? bundleToggleButtonSelectedClass : bundleToggleButtonUnselectedClass
                )}
              >
                <span className="block leading-tight">{experienceV3Content.bundleCard.artworkOnly}</span>
                <span className="mt-0.5 block text-[9px] font-bold tabular-nums text-foreground/80 md:hidden">
                  ${formatPriceCompact(bundleOffer.artworkUnitUsd)}
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Mobile: stacked row + full-width CTA — unchanged */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3.5 md:hidden">
          {artworkThumb}
          {productTitleBlock}
          {editionBadge}
          {mobileInlinePrice}
        </div>
        {mobileAddButton}

        {/* Desktop: thumb, meta, price, CTA — trust block is a sibling outside this card */}
        <div className="hidden min-w-0 items-center gap-4 md:flex">
          {artworkThumb}
          <ExperienceV3StickyBarProductMeta
            artistName={artistName}
            title={title}
            bundleLabel={bundleProductLabel}
            align="left"
            className="min-w-0 flex-1"
          />
          {desktopInlinePrice}
          {previewInCart ? editionBadge : desktopAddButton}
        </div>
      </div>
    </div>
  )
}
