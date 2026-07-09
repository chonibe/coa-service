'use client'

import Image from 'next/image'
import { Gem } from 'lucide-react'
import { cn, formatPriceCompact } from '@/lib/utils'
import { getStorePageContent } from '@/lib/content/site-content'
import { ExperienceTrustStrip } from './ExperienceTrustStrip'
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

/** Compact reserved-edition label for narrow product rows (e.g. "#12/100"). */
function compactReservedEditionLabel(label: string): string {
  const editionMatch = label.match(/^Edition\s+(#\d+(?:\/\d+)?)$/i)
  if (editionMatch) return editionMatch[1]
  const reservingMatch = label.match(/^Reserving\s+(#\d+(?:\/\d+)?)$/i)
  if (reservingMatch) return reservingMatch[1]
  return label
}

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
  /** Context line under toggle or above product row — bundle vs collection messaging. */
  offerHint?: string | null
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
  addButtonLabel,
  addButtonEditionParts = null,
  previewInCart,
  isSoldOut,
  onPrimaryAction,
  showTrustStrip = true,
  className,
  bundleOffer,
  priceMeta,
  offerHint = null,
}: ExperienceV3FloatingAddCardProps) {
  const isBundleMode = bundleOffer?.mode === 'withLamp'
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
    'flex items-center justify-center gap-1 font-semibold transition-colors sm:gap-1.5',
    addButtonEditionParts && 'flex-wrap',
    isSoldOut
      ? 'cursor-not-allowed bg-muted text-muted-foreground'
      : 'bg-experience-cta text-white hover:bg-experience-cta-hover dark:text-neutral-900'
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

  const showInlineEditionBadge = previewInCart && Boolean(reserveEditionLabel)

  const inlineEditionBadge = showInlineEditionBadge ? (
    <div
      className="shrink-0 text-right"
      role="status"
      aria-label={reserveEditionLabel ?? undefined}
    >
      <div className="inline-flex items-center gap-1 rounded-full border border-experience-highlight/35 bg-experience-highlight/10 px-2.5 py-1 shadow-sm sm:gap-2 sm:px-3 sm:py-1.5">
        <Gem className="h-3.5 w-3.5 shrink-0 text-experience-highlight sm:h-4 sm:w-4" aria-hidden />
        <span className="whitespace-nowrap text-sm font-bold tabular-nums leading-none text-foreground sm:text-base sm:leading-tight">
          <span className="sm:hidden">{compactReservedEditionLabel(reserveEditionLabel!)}</span>
          <span className="hidden sm:inline">{reserveEditionLabel}</span>
        </span>
      </div>
    </div>
  ) : null

  const nextStepChip =
    !previewInCart && priceMeta?.nextStepChip ? (
      <p className="max-w-[5.5rem] text-right text-[9px] font-semibold leading-tight tabular-nums text-experience-highlight md:max-w-[6rem] md:text-[10px]">
        {priceMeta.nextStepChip}
      </p>
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

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showTrustStrip ? (
        <ExperienceTrustStrip className="rounded-xl border border-border/50 border-b-border/60 shadow-sm" />
      ) : null}
      <div
        className={cn(
          'flex flex-col gap-2.5 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md',
          'sm:gap-3 sm:p-3'
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
            {offerHint ? (
              <p className="hidden text-[10px] leading-snug text-muted-foreground md:block md:text-[11px]">{offerHint}</p>
            ) : null}
          </div>
        ) : offerHint && !previewInCart ? (
          <p className="hidden text-[10px] leading-snug text-muted-foreground md:block md:text-[11px]">{offerHint}</p>
        ) : null}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3.5">
          {artImg ? (
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
          ) : null}
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="space-y-0.5">
              {artistName ? (
                <p className="truncate text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {artistName}
                </p>
              ) : null}
              {title ? (
                <p className="truncate text-sm font-semibold leading-snug text-foreground">{title}</p>
              ) : null}
            </div>
          </div>
          {inlineEditionBadge}
          {mobileInlinePrice}
          {desktopInlinePrice}
          {showAddButton ? (
            <button
              type="button"
              disabled={isSoldOut}
              onClick={onPrimaryAction}
              className={cn(
                addButtonClassName,
                'hidden shrink-0 rounded-full px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm md:flex'
              )}
            >
              {addButtonContent}
            </button>
          ) : null}
        </div>
        {showAddButton ? (
          <button
            type="button"
            disabled={isSoldOut}
            onClick={onPrimaryAction}
            className={cn(
              addButtonClassName,
              'w-full rounded-full px-4 py-2.5 text-sm md:hidden'
            )}
          >
            {addButtonContent}
          </button>
        ) : null}
      </div>
    </div>
  )
}
