'use client'

import { ArrowRight, Sparkles } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { capitalizeFirstLetter, cn, formatPriceCompact } from '@/lib/utils'
import { getStorePageContent } from '@/lib/content/site-content'

const experienceV3Content = getStorePageContent('experienceV3')

const bundleToggleTrackClass =
  'inline-flex w-full items-center rounded-full bg-muted/90 p-0.5 ring-1 ring-border/60 sm:w-auto'
const bundleToggleButtonBaseClass =
  'rounded-full px-2.5 py-1 text-[11px] transition-all md:px-3 md:py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background'
const bundleToggleButtonSelectedClass =
  'bg-card font-semibold text-foreground shadow-inner ring-1 ring-black/[0.06] dark:bg-background dark:ring-white/10'
const bundleToggleButtonUnselectedClass =
  'font-medium text-muted-foreground hover:text-foreground/80'

export type ExperienceV3BundleMode = 'withLamp' | 'artworkOnly'

export type ExperienceV3LampBundleCardProps = {
  lamp: ShopifyProduct
  artwork: ShopifyProduct
  artworkUnitUsd: number
  lampUnitUsd: number
  listPriceCompareAt?: string | null
  disabled?: boolean
  onAddWithLamp: () => void
  onArtworkOnly: () => void
  /** Artist/vendor name for the previewed artwork — personalizes the bundle name/description. */
  artistName: string
  /**
   * Controlled "Artwork only" (default/base) / "Add Street Lamp" (opt-in) toggle — lifted to the
   * parent so it can also drive the live Spline visual it sits beside.
   */
  mode: ExperienceV3BundleMode
  onModeChange: (mode: ExperienceV3BundleMode) => void
  /** Edition ladder chip, e.g. "2 more · then $42" — shown under price (desktop bundle). */
  nextStepChip?: string | null
  /**
   * `responsive` — hero meta lives in the mobile shell header; on small screens only toggle,
   * price, and CTA show. `default` — full panel with tag, bundle name, and description.
   */
  layout?: 'default' | 'responsive'
}

/**
 * Bundle offer copy panel — tag/heading/description, the "Artwork only" / "Add Street Lamp"
 * toggle, price, and CTA. Rendered as the `sideContent` of `ExperienceV3SplineLampSection`, next
 * to the live 3D lamp preview (no static product imagery of its own). Intentionally flat/plain —
 * no card border, gradients, or motion — to sit naturally inside that section alongside the
 * "Your Collection" heading style.
 *
 * The artwork is the default/base state when a lamp is already in the cart; otherwise bundle
 * (lamp + artwork) is the default. The lamp is framed as the opt-in add-on when switching to
 * artwork-only, not a symmetric A/B choice.
 */
export function ExperienceV3LampBundleCard({
  lamp,
  artwork,
  artworkUnitUsd,
  lampUnitUsd,
  listPriceCompareAt = null,
  disabled = false,
  onAddWithLamp,
  onArtworkOnly,
  artistName,
  mode,
  onModeChange,
  nextStepChip = null,
  layout = 'default',
}: ExperienceV3LampBundleCardProps) {
  const isBundleMode = mode === 'withLamp'
  const isResponsive = layout === 'responsive'

  const bundleName = experienceV3Content.bundleCard.bundleName(artistName)
  const lampTitle = capitalizeFirstLetter(lamp.title.trim())
  const artworkTitle = capitalizeFirstLetter(artwork.title.trim())

  const bundleTotal = artworkUnitUsd + lampUnitUsd
  const activePrice = isBundleMode ? bundleTotal : artworkUnitUsd
  const activeCompareAt = isBundleMode ? listPriceCompareAt : null

  const primaryLabel = isBundleMode
    ? experienceV3Content.bundleCard.addBundle
    : experienceV3Content.bundleCard.addArtwork

  const handlePrimaryAction = isBundleMode ? onAddWithLamp : onArtworkOnly
  const modeDescription = isBundleMode
    ? experienceV3Content.bundleCard.descriptionWithLamp(artistName)
    : experienceV3Content.bundleCard.descriptionArtworkOnly
  const modeHint = isBundleMode
    ? experienceV3Content.bundleCard.hintWithLamp
    : experienceV3Content.bundleCard.hintArtworkOnly
  const priceSuffix = isBundleMode
    ? experienceV3Content.bundleCard.priceSuffixBundle
    : experienceV3Content.bundleCard.priceSuffixArtwork

  return (
    <div
      className={cn(
        'flex flex-col justify-center gap-2 text-left md:gap-3',
        !isResponsive && 'text-center md:text-left'
      )}
      aria-label={`${bundleName}: ${lampTitle} and ${artworkTitle}`}
    >
      {isResponsive ? (
        <div className="hidden space-y-1 md:block">
          <span className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-experience-highlight ring-1 ring-border">
            <Sparkles className="h-3 w-3" aria-hidden />
            {experienceV3Content.bundleCard.bundleTag}
          </span>
          <h3 className="font-serif text-base font-semibold leading-snug text-foreground md:text-xl">{bundleName}</h3>
          <p className="text-[12px] leading-snug text-muted-foreground">{modeDescription}</p>
        </div>
      ) : (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 self-center rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-experience-highlight ring-1 ring-border md:self-start">
            <Sparkles className="h-3 w-3" aria-hidden />
            {experienceV3Content.bundleCard.bundleTag}
          </span>
          <h3 className="font-serif text-base font-semibold leading-snug text-foreground md:text-xl">{bundleName}</h3>
          <p className="text-[12px] leading-snug text-muted-foreground">{modeDescription}</p>
        </div>
      )}

      <div className={cn('space-y-1', isResponsive ? 'md:space-y-1.5' : 'md:space-y-1.5')}>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {experienceV3Content.bundleCard.toggleLabel}
        </p>
        <div
          aria-label={experienceV3Content.bundleCard.toggleLabel}
          className={bundleToggleTrackClass}
          role="group"
        >
          <button
            type="button"
            aria-pressed={isBundleMode}
            onClick={() => onModeChange('withLamp')}
            className={cn(
              bundleToggleButtonBaseClass,
              isBundleMode ? bundleToggleButtonSelectedClass : bundleToggleButtonUnselectedClass
            )}
          >
            {experienceV3Content.bundleCard.toggleAddLamp}
          </button>
          <button
            type="button"
            aria-pressed={!isBundleMode}
            onClick={() => onModeChange('artworkOnly')}
            className={cn(
              bundleToggleButtonBaseClass,
              !isBundleMode ? bundleToggleButtonSelectedClass : bundleToggleButtonUnselectedClass
            )}
          >
            {experienceV3Content.bundleCard.artworkOnly}
          </button>
        </div>
        {modeHint ? (
          <p className="hidden text-[11px] leading-snug text-muted-foreground md:block">{modeHint}</p>
        ) : null}
      </div>

      <div className={cn('space-y-1.5', isResponsive ? 'md:space-y-2.5' : 'md:space-y-2.5')}>
        {activePrice > 0 ? (
          <p className="text-[12px] tabular-nums text-muted-foreground">
            {activeCompareAt ? (
              <>
                <span className="line-through">{activeCompareAt}</span>
                <span className="mx-1.5 font-semibold text-foreground">${formatPriceCompact(activePrice)}</span>
              </>
            ) : (
              <span className="font-semibold text-foreground">${formatPriceCompact(activePrice)}</span>
            )}
            <span className="text-muted-foreground">{priceSuffix}</span>
          </p>
        ) : null}
        {nextStepChip ? (
          <p className="text-[10px] font-medium tabular-nums text-muted-foreground">{nextStepChip}</p>
        ) : null}
        <button
          type="button"
          disabled={disabled}
          onClick={handlePrimaryAction}
          className={cn(
            'flex w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors active:scale-[0.98] md:w-auto',
            disabled
              ? 'cursor-not-allowed bg-muted text-muted-foreground'
              : 'bg-experience-cta text-white hover:bg-experience-cta-hover dark:text-neutral-900'
          )}
        >
          <span>{primaryLabel}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </div>
  )
}
