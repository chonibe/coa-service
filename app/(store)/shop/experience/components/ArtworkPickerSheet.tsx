'use client'

import { useRef, useEffect, useCallback, useState, useMemo, type CSSProperties } from 'react'
import { useExperienceOrder } from '../../experience-v2/ExperienceOrderContext'
import { resolveExperienceNextAction } from '@/lib/shop/experience-journey-next-action'
import Image from 'next/image'
import { Check, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import {
  ArtistSpotlightBanner,
  type SpotlightData,
} from '../../experience-v2/components/ArtistSpotlightBanner'
import { LampSelectorPromoBanner } from '../../experience-v2/components/LampSelectorPromoBanner'
import {
  FilterPanel,
  type FeaturedBundleFilterOffer,
  type FilterPanelLampOffer,
  type FilterState,
} from '../../experience-v2/components/FilterPanel'
import { cn } from '@/lib/utils'
import { buildArtworkRowsByArtist } from '@/lib/shop/experience-artwork-rows'
import {
  experienceArtistRowDefaultClass,
  experienceQuickAddFabIconClass,
  getExperienceQuickAddFabClass,
  getPickerArtworkCardSurfaces,
  getPickerCardSelectionChrome,
} from '@/lib/shop/experience-artwork-card-surfaces'
import { EditionBadgeForProduct } from '../../experience-v2/components/EditionBadge'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'
import { experienceVendorsLooselyEqual } from '@/lib/shop/experience-spotlight-match'
import { streetEditionRowFromStorefrontProduct } from '@/lib/shop/street-edition-from-storefront'
import {
  formatStreetArtworkListPrice,
  formatStreetNextSalesChipText,
} from '@/lib/shop/experience-street-ladder-display'

type SeasonTab = 'season1' | 'season2'

/** Collection picker artist spotlight banner + "Explore full collection" CTA. Set true to re-enable. */
const SHOW_ARTIST_SPOTLIGHT_IN_COLLECTION = false

const MERGE_CONFETTI_COUNT = 16
const MERGE_CONFETTI_COLORS = ['#C21350', '#3b82f6', '#60a5fa', '#22c55e', '#4ade80', '#facc15', '#fde047', '#ffffff']

function MergeConfetti({ active }: { active: boolean }) {
  const [sparkle, setSparkle] = useState(false)
  const prevActive = useRef(false)

  useEffect(() => {
    if (active && !prevActive.current) {
      setSparkle(true)
      const t = setTimeout(() => setSparkle(false), 800)
      return () => clearTimeout(t)
    }
    prevActive.current = active
  }, [active])

  return (
    <AnimatePresence>
      {sparkle && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-10">
          <div className="relative w-0 h-0">
            {Array.from({ length: MERGE_CONFETTI_COUNT }).map((_, i) => {
              const angle = (i / MERGE_CONFETTI_COUNT) * 360
              const rad = (angle * Math.PI) / 180
              const dist = 50 + (i % 4) * 12
              const x = Math.cos(rad) * dist
              const y = Math.sin(rad) * dist
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 1, scale: 0.3, x: 0, y: 0 }}
                  animate={{ opacity: 0, scale: 1, x, y }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full"
                  style={{
                    backgroundColor: MERGE_CONFETTI_COLORS[i % MERGE_CONFETTI_COLORS.length],
                    boxShadow: '0 0 6px 1px rgba(4, 122, 255, 0.4)',
                  }}
                />
              )
            })}
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface ArtworkCardV2Props {
  product: ShopifyProduct
  isSelected: boolean
  onSelect: (product: ShopifyProduct) => void
  onQuickAdd?: (product: ShopifyProduct) => void
  priorityLoad?: boolean
  mergeWithLeft?: boolean
  mergeWithRight?: boolean
  /** Show "New Drop" chip when product is in spotlight (featured artist) */
  isNewDrop?: boolean
  /** Show "Early access" chip when spotlight is unlisted */
  isEarlyAccess?: boolean
  /** When true, both artworks in this 2-up row are selected — hide per-card ring (row uses shared tint only). */
  suppressSelectionRing?: boolean
  /** Street ladder: price row in footer; title lives in image-bottom chip; edition chip above title when non-ladder. */
  streetPricing?: StreetEditionStatesRow | null
  /** Journey: subtle tilt + title-chip shine (not full-card) */
  journeyPulseChooseArtworks?: boolean
  /** Stagger animations across virtual rows */
  journeyStaggerIndex?: number
  /** Artist name shown as uppercase subtitle below title chip, above price */
  artistName?: string
}

function ArtworkCardV2({
  product,
  isSelected,
  onSelect,
  onQuickAdd,
  priorityLoad = false,
  mergeWithLeft = false,
  mergeWithRight = false,
  isNewDrop = false,
  isEarlyAccess = false,
  suppressSelectionRing = false,
  streetPricing = null,
  journeyPulseChooseArtworks = false,
  journeyStaggerIndex = 0,
  artistName,
}: ArtworkCardV2Props) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageUrl = product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url
  const isMergedVisual = isSelected && (mergeWithLeft || mergeWithRight)
  const flushToSpine = isMergedVisual
  const roundLeft = !flushToSpine || mergeWithRight
  const roundRight = !flushToSpine || mergeWithLeft
  const footerPrice = formatStreetArtworkListPrice(product, streetPricing, isEarlyAccess)
  const showEarlyAccessCompare = footerPrice.compareAt !== null
  const streetListActive = !!(streetPricing && streetPricing.priceUsd != null && streetPricing.priceUsd > 0)
  const nextSalesChipText =
    streetListActive && streetPricing ? formatStreetNextSalesChipText(streetPricing.nextBump) : null
  const surfaces = getPickerArtworkCardSurfaces(isSelected)
  const selectionChrome = getPickerCardSelectionChrome(isSelected, suppressSelectionRing)
  const handleClick = useCallback(() => {
    onSelect(product)
  }, [product, onSelect])

  const journeyPickerHint =
    journeyPulseChooseArtworks && !isSelected && product.availableForSale
  const artistSubtitle = (artistName ?? product.vendor?.trim() ?? 'Artist').toUpperCase()

  return (
    <motion.div
      data-product-id={product.id}
      className={cn(
        'relative box-border overflow-hidden origin-center',
        selectionChrome,
        surfaces.shell,
        roundLeft && roundRight && 'rounded-xl',
        roundLeft && !roundRight && 'rounded-l-xl',
        !roundLeft && roundRight && 'rounded-r-xl',
        journeyPickerHint && 'experience-journey-artwork-card-tilt'
      )}
      style={
        journeyPickerHint
          ? ({ '--journey-card-tilt-delay': `${journeyStaggerIndex * 1.2}s` } as CSSProperties)
          : undefined
      }
    >
      <motion.div
        className={cn(
          'aspect-[4/5] relative overflow-hidden cursor-pointer touch-manipulation select-none',
          surfaces.imageWell,
          roundLeft && roundRight && 'rounded-t-xl',
          roundLeft && !roundRight && 'rounded-tl-xl',
          !roundLeft && roundRight && 'rounded-tr-xl'
        )}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
        title="Tap to select artwork"
      >
        {imageUrl ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-neutral-200/80 dark:bg-[#262222]/50 animate-pulse" />
            )}
            <Image
              src={getShopifyImageUrl(imageUrl, 500) ?? imageUrl}
              alt={product.title}
              fill
              unoptimized
              className={cn('object-cover transition-opacity duration-200', imageLoaded ? 'opacity-100' : 'opacity-0')}
              sizes="(max-width: 480px) 50vw, (max-width: 768px) 46vw, 280px"
              priority={priorityLoad}
              loading="eager"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-300 dark:text-[#b89090]">
            No image
          </div>
        )}

        {onQuickAdd && product.availableForSale && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (!isSelected) onQuickAdd(product)
            }}
            className={cn('absolute top-2 right-2 z-20', getExperienceQuickAddFabClass(isSelected))}
            aria-label={isSelected ? 'Added to cart' : 'Quick add to cart'}
            aria-pressed={isSelected}
          >
            {isSelected ? (
              <Check className={experienceQuickAddFabIconClass} strokeWidth={2.5} aria-hidden />
            ) : (
              <Plus className={experienceQuickAddFabIconClass} strokeWidth={2.5} aria-hidden />
            )}
          </button>
        )}

        {(isNewDrop || isEarlyAccess) && (
          <span
            className={cn(
              'absolute top-2 left-2 z-10 text-[10px] font-semibold px-2 py-0.5 rounded-lg',
              'backdrop-blur-md backdrop-saturate-150 border shadow-md shadow-black/20',
              isEarlyAccess
                ? 'text-violet-50 border-violet-200/35 bg-violet-950/40 dark:bg-violet-950/50'
                : 'text-amber-50 border-amber-200/30 bg-amber-950/35 dark:bg-amber-950/45'
            )}
          >
            {isEarlyAccess ? 'Early access' : 'Featured Artist'}
          </span>
        )}

        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-[9] pointer-events-none flex flex-col items-center justify-end gap-0.5 px-1.5 pb-1',
            '[&_.picker-title-chip]:pointer-events-auto'
          )}
        >
          {!streetPricing ? (
            <EditionBadgeForProduct
              product={product}
              chipOnly
              className="w-4/5 max-w-[80%] shrink-0 [&>span]:pointer-events-auto"
            />
          ) : null}
          <div className="flex w-full min-w-0 justify-center">
            <div
              className={cn(
                'picker-title-chip flex w-4/5 max-w-[80%] min-w-0 items-center gap-1.5 rounded-lg px-2 py-1',
                'border border-white/30 dark:border-white/20',
                'bg-black/40 backdrop-blur-md backdrop-saturate-150 dark:bg-black/50',
                'text-white shadow-sm shadow-black/20',
                journeyPickerHint && 'experience-journey-artwork-title-chip-hint'
              )}
              style={
                journeyPickerHint
                  ? ({ '--journey-chip-shine-delay': `${journeyStaggerIndex * 0.75}s` } as CSSProperties)
                  : undefined
              }
            >
              <span
                className={cn(
                  'min-w-0 flex-1 text-center text-[10px] sm:text-[11px] font-semibold leading-snug tracking-tight',
                  'line-clamp-2 break-words [overflow-wrap:anywhere]'
                )}
                title={product.title}
              >
                {product.title}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div
        className={cn(
          'px-2 flex flex-col items-center justify-center text-center overflow-hidden cursor-pointer',
          surfaces.meta,
          (mergeWithLeft || mergeWithRight) ? 'pt-0 pb-0.5' : 'pt-0.5 pb-0.5',
          roundLeft && roundRight && 'rounded-b-xl',
          roundLeft && !roundRight && 'rounded-bl-xl',
          !roundLeft && roundRight && 'rounded-br-xl'
        )}
        onClick={handleClick}
      >
        <div className="w-full min-w-0 flex flex-col gap-0.5 items-center">
          <p
            className="w-full min-w-0 truncate px-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-[#a09090]"
            title={artistSubtitle}
          >
            {artistSubtitle}
          </p>
          {streetPricing ? (
            <div className="w-full min-w-0 flex flex-col gap-0 items-center text-center">
              {streetListActive ? (
                <div className="flex w-full min-w-0 flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5">
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums tracking-tight shrink-0',
                      showEarlyAccessCompare
                        ? 'text-violet-700 dark:text-violet-300'
                        : 'text-neutral-900 dark:text-[#f0e8e8]'
                    )}
                  >
                    {footerPrice.primary}
                  </span>
                  {showEarlyAccessCompare && footerPrice.compareAt && (
                    <span className="text-[11px] text-neutral-400 dark:text-[#908080] line-through tabular-nums shrink-0">
                      {footerPrice.compareAt}
                    </span>
                  )}
                  {nextSalesChipText ? (
                    <>
                      <span
                        className="shrink-0 text-[0.85em] leading-none text-neutral-400 dark:text-neutral-500 select-none"
                        aria-hidden
                      >
                        ✦
                      </span>
                      <span className="min-w-0 text-[11px] font-medium tabular-nums leading-snug text-neutral-700 dark:text-neutral-200">
                        {nextSalesChipText}
                      </span>
                    </>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs font-semibold text-neutral-500 dark:text-[#a09090] text-center">
                  {streetPricing.label}
                </p>
              )}
            </div>
          ) : (
            <div className="flex w-full min-w-0 items-baseline justify-center gap-1.5 flex-wrap">
              <p className={cn(
                'text-xs font-medium transition-colors duration-200 ease-out',
                showEarlyAccessCompare
                  ? 'text-violet-700 dark:text-violet-300'
                  : 'text-neutral-800 dark:text-[#c4a0a0]'
              )}>
                {footerPrice.primary}
              </p>
              {showEarlyAccessCompare && footerPrice.compareAt && (
                <span className="text-[10px] text-neutral-400 dark:text-[#a09090] line-through">
                  {footerPrice.compareAt}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/** Virtual row estimate; rows use measureElement (includes row vertical gap). */
const ROW_HEIGHT_ESTIMATE = 500

interface ArtworkPickerSheetProps {
  isOpen: boolean
  onClose: () => void
  products: ShopifyProduct[]
  selectedArtworks: ShopifyProduct[]
  lampPreviewOrder: string[]
  onToggleSelect: (product: ShopifyProduct) => void
  onLoadMore?: () => void
  hasMore?: boolean
  lastAddedProductId?: string | null
  activeSeason?: SeasonTab
  onSeasonChange?: (season: SeasonTab) => void
  filters?: FilterState
  onFiltersChange?: (filters: FilterState) => void
  filterOpen?: boolean
  onFilterOpen?: () => void
  onFilterClose?: () => void
  spotlightData?: SpotlightData | null
  spotlightProducts?: ShopifyProduct[]
  onSpotlightSelect?: (isExpanding: boolean) => void
  productsForFilterPanel?: ShopifyProduct[]
  cartOrder?: string[]
  /** When set, controls spotlight card open/closed UI independently of filter state (avoids mismatched names vs filters). */
  spotlightBannerExpanded?: boolean
  /** Numeric Shopify product id → Street Collector ladder copy */
  streetEditionByProductId?: Record<string, StreetEditionStatesRow>
  /** Featured artist bundle CTA on spotlight banner (not in filter sheet) */
  featuredBundleOffer?: FeaturedBundleFilterOffer | null
  /** Street Lamp row in filter sheet */
  filterPanelLamp?: FilterPanelLampOffer | null
  /** Full vendor list from collection-vendors API (all pages); overrides artist derivation from products */
  artistCatalogForFilters?: [string, number][] | null
  /** When `lampQuantity === 0`, show lamp promo instead of artist spotlight (requires lamp + handlers). */
  pickerLamp?: ShopifyProduct | null
  lampQuantity?: number
  lampPriceUsd?: number
  onPickerAddLamp?: () => void
  lampPickerDetailOpen?: boolean
  onOpenLampPickerDetail?: () => void
  onCloseLampPickerDetail?: () => void
  pickerCardMode?: 'toggleCart' | 'previewAndQuickAdd'
  onPreviewProduct?: (product: ShopifyProduct) => void
  onQuickAddProduct?: (product: ShopifyProduct) => void
  sheetVariant?: 'bottomSheet' | 'rightRail'
  presentation?: 'modal' | 'pushPanel'
  showDoneButton?: boolean
}

export function ArtworkPickerSheet({
  isOpen,
  onClose,
  products,
  selectedArtworks,
  lampPreviewOrder: _lampPreviewOrder,
  onToggleSelect,
  onLoadMore,
  hasMore,
  lastAddedProductId = null,
  activeSeason = 'season2',
  onSeasonChange,
  filters,
  onFiltersChange,
  filterOpen = false,
  onFilterOpen: _onFilterOpen,
  onFilterClose,
  spotlightData,
  spotlightProducts = [],
  onSpotlightSelect,
  productsForFilterPanel = [],
  cartOrder = [],
  spotlightBannerExpanded,
  streetEditionByProductId = {},
  featuredBundleOffer,
  artistCatalogForFilters = null,
  filterPanelLamp,
  pickerLamp = null,
  lampQuantity: pickerLampQuantity,
  lampPriceUsd: pickerLampPriceUsd,
  onPickerAddLamp,
  lampPickerDetailOpen = false,
  onOpenLampPickerDetail,
  onCloseLampPickerDetail,
  pickerCardMode = 'toggleCart',
  onPreviewProduct,
  onQuickAddProduct,
  sheetVariant = 'bottomSheet',
  presentation = 'modal',
  showDoneButton = true,
}: ArtworkPickerSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const prevSeasonRef = useRef(activeSeason)
  const { theme } = useExperienceTheme()
  const { pickerEngaged, orderDrawerOpen } = useExperienceOrder()
  const [isDesktopRail, setIsDesktopRail] = useState(false)

  useEffect(() => {
    const q = window.matchMedia('(min-width: 768px)')
    const sync = () => setIsDesktopRail(q.matches)
    sync()
    q.addEventListener('change', sync)
    return () => q.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (prevSeasonRef.current !== activeSeason && isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
    prevSeasonRef.current = activeSeason
  }, [activeSeason, isOpen])

  const selectedIds = useMemo(() => new Set(selectedArtworks.map((a) => a.id)), [selectedArtworks])

  const spotlightIdSet = useMemo(() => {
    if (!spotlightData?.productIds?.length) return new Set<string>()
    const ids = spotlightData.productIds.map((id) => (id.replace(/^gid:\/\/shopify\/Product\//i, '') || id))
    return new Set(ids)
  }, [spotlightData?.productIds])

  const isInSpotlight = useCallback((id: string) => {
    if (spotlightIdSet.size === 0) return false
    const norm = id.replace(/^gid:\/\/shopify\/Product\//i, '') || id
    return spotlightIdSet.has(norm) || spotlightIdSet.has(id)
  }, [spotlightIdSet])

  const seasonBandsFallback: 1 | 2 = activeSeason === 'season2' ? 2 : 1

  const streetPricingForProduct = useCallback(
    (product: ShopifyProduct) => {
      const k = normalizeShopifyProductId(product.id)
      if (k) {
        const fromApi = streetEditionByProductId[k]
        if (fromApi) return fromApi
      }
      return streetEditionRowFromStorefrontProduct(product, { seasonBandsFallback })
    },
    [streetEditionByProductId, seasonBandsFallback]
  )

  /** Parent passes `spotlightBannerExpanded` so “filtered” UI tracks accordion, not API vs Shopify vendor strings. */
  const spotlightAccordionExpanded =
    spotlightBannerExpanded !== undefined
      ? spotlightBannerExpanded
      : !!(
          spotlightData &&
          filters?.artists?.some((a) => experienceVendorsLooselyEqual(a, spotlightData.vendorName))
        )

  const showLampPromoInPicker =
    pickerLampQuantity === 0 &&
    !!pickerLamp &&
    !!onPickerAddLamp &&
    !!onOpenLampPickerDetail &&
    !!onCloseLampPickerDetail

  const pickerJourneyNext = useMemo(() => {
    const qty = pickerLampQuantity ?? 0
    return resolveExperienceNextAction({
      lampQuantity: qty,
      artworkCount: selectedArtworks.length,
      pickerEngaged,
      orderDrawerOpen,
      hasAddress: false,
      hasPaymentSelection: false,
      paymentSectionExpanded: false,
      paymentStripeUnlocked: false,
    })
  }, [pickerLampQuantity, selectedArtworks.length, pickerEngaged, orderDrawerOpen])

  const pickerLampUnitPrice =
    typeof pickerLampPriceUsd === 'number'
      ? pickerLampPriceUsd
      : pickerLamp
        ? parseFloat(pickerLamp.priceRange?.minVariantPrice?.amount ?? '0')
        : 0

  useEffect(() => {
    if (!isOpen || !onLoadMore || !hasMore) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onLoadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isOpen, onLoadMore, hasMore])

  const rows = useMemo(() => buildArtworkRowsByArtist(products), [products])

  const cardSelectHandler = useCallback(
    (product: ShopifyProduct) => {
      if (pickerCardMode === 'previewAndQuickAdd' && onPreviewProduct) {
        onPreviewProduct(product)
        return
      }
      onToggleSelect(product)
    },
    [pickerCardMode, onPreviewProduct, onToggleSelect]
  )

  const quickAddHandler =
    pickerCardMode === 'previewAndQuickAdd' && onQuickAddProduct ? onQuickAddProduct : undefined

  const isPreviewPickerMode = pickerCardMode === 'previewAndQuickAdd'

  const isRightRailDesktop = sheetVariant === 'rightRail' && isDesktopRail

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 6,
  })

  const docked = presentation === 'pushPanel' && isDesktopRail

  const renderPickerPanelBody = () => (
    <>
            {/* Header: mobile = title + Done; desktop = two-zone bar (title block | tools) */}
            <div className={cn(
              'flex-shrink-0 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 pt-[max(0.75rem,env(safe-area-inset-top,0px))] border-b',
              'md:flex-nowrap md:items-center md:justify-between md:gap-4 md:px-6 md:py-3.5',
              theme === 'light' ? 'border-neutral-200' : 'border-neutral-800'
            )}>
              <div className="flex min-w-0 flex-1 flex-col md:flex-none md:max-w-[55%]">
                <h2 className={cn(
                  'text-base font-semibold leading-tight',
                  theme === 'light' ? 'text-neutral-900' : 'text-foreground'
                )}>
                  Choose your Art
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0 md:gap-3">
              {onSeasonChange && (
                <div className={cn(
                  'hidden md:flex rounded-lg border p-0.5 flex-shrink-0',
                  theme === 'light'
                    ? 'border-neutral-200 bg-neutral-50'
                    : 'border-[#2c2828] bg-[#201c1c]/50'
                )}>
                  <button
                    type="button"
                    onClick={() => onSeasonChange('season1')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                      activeSeason === 'season1'
                        ? theme === 'light'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'bg-[#262222] text-[#f0e8e8] shadow-sm'
                        : theme === 'light'
                          ? 'text-neutral-500 hover:text-neutral-700'
                          : 'text-[#c4a0a0] hover:text-[#e8d4d4]'
                    )}
                  >
                    Season 1
                  </button>
                  <button
                    type="button"
                    onClick={() => onSeasonChange('season2')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                      activeSeason === 'season2'
                        ? theme === 'light'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'bg-[#262222] text-[#f0e8e8] shadow-sm'
                        : theme === 'light'
                          ? 'text-neutral-500 hover:text-neutral-700'
                          : 'text-[#c4a0a0] hover:text-[#e8d4d4]'
                    )}
                  >
                    Season 2
                  </button>
                </div>
              )}
              {showDoneButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Done"
                className={cn(
                  'flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-semibold -my-2 transition-colors shrink-0',
                  theme === 'light'
                    ? 'text-experience-highlight hover:text-experience-highlight-muted hover:bg-neutral-100'
                    : 'text-[#60A5FA] hover:text-[#93C5FD] hover:bg-[#262222]'
                )}
              >
                Done
              </button>
              )}
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-1.5 py-3 md:px-5 md:py-4"
            >
              <div className="md:mx-auto md:w-full md:max-w-[min(65vh,520px)]">
              {/* Lamp promo when cart has no lamp; otherwise artist spotlight */}
              {showLampPromoInPicker && pickerLamp ? (
                <div className="mb-3">
                  <LampSelectorPromoBanner
                    lamp={pickerLamp}
                    priceUsd={pickerLampUnitPrice}
                    detailOpen={lampPickerDetailOpen}
                    onOpenDetail={onOpenLampPickerDetail}
                    onCloseDetail={onCloseLampPickerDetail}
                    onAddLamp={onPickerAddLamp}
                    showBadge
                    highlightAddCta={showLampPromoInPicker && pickerJourneyNext === 'add_lamp'}
                  />
                </div>
              ) : SHOW_ARTIST_SPOTLIGHT_IN_COLLECTION && spotlightData && onSpotlightSelect ? (
                <div className="mb-3">
                  <ArtistSpotlightBanner
                    spotlight={{ ...spotlightData, gifUrl: undefined }}
                    spotlightProducts={spotlightProducts}
                    onSelect={onSpotlightSelect}
                    showBadge
                    expanded={spotlightAccordionExpanded}
                    featuredBundleOffer={featuredBundleOffer ?? undefined}
                  />
                </div>
              ) : null}

              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  const product1 = row[0]
                  const product2 = row[1]
                  const p1Selected = product1 && selectedIds.has(product1.id)
                  const p2Selected = product2 && selectedIds.has(product2.id)
                  const bothSelected = !!(p1Selected && p2Selected)
                  const sameVendor = !!(product1 && product2 && product1.vendor === product2.vendor)
                  const shouldMerge = !isPreviewPickerMode && bothSelected && sameVendor
                  const isPairRow = row.length === 2
                  const justMerged = shouldMerge && (
                    (product1?.id === lastAddedProductId) || (product2?.id === lastAddedProductId)
                  )
                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      className={cn(
                        'absolute top-0 left-0 w-full',
                        isPairRow && shouldMerge ? 'py-4 md:py-6' : 'pb-10 md:pb-14'
                      )}
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {isPairRow ? (
                        <div
                          className={cn(
                            'relative flex items-stretch rounded-xl overflow-hidden',
                            experienceArtistRowDefaultClass,
                            !shouldMerge && 'gap-1.5 md:gap-2'
                          )}
                        >
                          {shouldMerge && <MergeConfetti active={justMerged} />}
                          {product1 && (
                            <div className={cn('flex-1 min-w-0', shouldMerge && '-mr-px')}>
                              <ArtworkCardV2
                                key={product1.id}
                                product={product1}
                                isSelected={p1Selected}
                                onSelect={cardSelectHandler}
                                onQuickAdd={quickAddHandler}
                                priorityLoad={virtualRow.index < 3}
                                mergeWithRight={!isPreviewPickerMode && shouldMerge}
                                isNewDrop={isInSpotlight(product1.id) && !spotlightData?.unlisted}
                                isEarlyAccess={isInSpotlight(product1.id) && !!spotlightData?.unlisted}
                                suppressSelectionRing={shouldMerge}
                                streetPricing={streetPricingForProduct(product1)}
                                journeyPulseChooseArtworks={
                                  pickerJourneyNext === 'choose_artworks' &&
                                  !p1Selected &&
                                  product1.availableForSale
                                }
                                journeyStaggerIndex={virtualRow.index}
                              />
                            </div>
                          )}
                          {product2 && (
                            <div className={cn('flex-1 min-w-0', shouldMerge && '-ml-px')}>
                              <ArtworkCardV2
                                key={product2.id}
                                product={product2}
                                isSelected={p2Selected}
                                onSelect={cardSelectHandler}
                                onQuickAdd={quickAddHandler}
                                priorityLoad={virtualRow.index < 3}
                                mergeWithLeft={!isPreviewPickerMode && shouldMerge}
                                isNewDrop={isInSpotlight(product2.id) && !spotlightData?.unlisted}
                                isEarlyAccess={isInSpotlight(product2.id) && !!spotlightData?.unlisted}
                                suppressSelectionRing={shouldMerge}
                                streetPricing={streetPricingForProduct(product2)}
                                journeyPulseChooseArtworks={
                                  pickerJourneyNext === 'choose_artworks' &&
                                  !p2Selected &&
                                  product2.availableForSale
                                }
                                journeyStaggerIndex={virtualRow.index}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative flex justify-center">
                          {product1 && (
                            <div className="w-1/2 max-w-[300px]">
                              <ArtworkCardV2
                                key={product1.id}
                                product={product1}
                                isSelected={!!p1Selected}
                                onSelect={cardSelectHandler}
                                onQuickAdd={quickAddHandler}
                                priorityLoad={virtualRow.index < 3}
                                isNewDrop={isInSpotlight(product1.id) && !spotlightData?.unlisted}
                                isEarlyAccess={isInSpotlight(product1.id) && !!spotlightData?.unlisted}
                                streetPricing={streetPricingForProduct(product1)}
                                journeyPulseChooseArtworks={
                                  pickerJourneyNext === 'choose_artworks' &&
                                  !p1Selected &&
                                  product1.availableForSale
                                }
                                journeyStaggerIndex={virtualRow.index}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {SHOW_ARTIST_SPOTLIGHT_IN_COLLECTION &&
                !showLampPromoInPicker &&
                spotlightData &&
                onSpotlightSelect &&
                spotlightAccordionExpanded &&
                products.length > 0 && (
                  <div className="flex flex-col items-center pt-2 pb-1 px-2">
                    <button
                      type="button"
                      onClick={() => onSpotlightSelect(false)}
                      className={cn(
                        'w-full max-w-sm rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors border shadow-sm',
                        spotlightData.unlisted
                          ? 'border-violet-400/40 bg-violet-950/15 text-violet-100 hover:bg-violet-950/30 dark:border-violet-500/35'
                          : theme === 'light'
                            ? 'border-amber-200/60 bg-card text-foreground hover:bg-amber-50/80'
                            : 'border-[#FFBA94]/35 bg-[#262222] text-[#FFBA94] hover:bg-[#2c2828]'
                      )}
                    >
                      Explore full collection
                    </button>
                  </div>
                )}

              {hasMore && <div ref={sentinelRef} className="h-20" />}
              </div>
            </div>

            {/* Mobile bottom bar: Season 1/2 + Filter */}
            {onSeasonChange && (
              <div className={cn(
                'md:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3 border-t border-border bg-experience-surface/80 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]'
              )}>
                {onSeasonChange && (
                  <div className={cn(
                    'flex rounded-lg border p-0.5 flex-1',
                    theme === 'light'
                      ? 'border-border bg-card'
                      : 'border-[#2c2828] bg-[#201c1c]/50'
                  )}>
                    <button
                      type="button"
                      onClick={() => onSeasonChange('season1')}
                      className={cn(
                        'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        activeSeason === 'season1'
                          ? theme === 'light'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'bg-[#262222] text-[#f0e8e8] shadow-sm'
                          : theme === 'light'
                            ? 'text-neutral-500 hover:text-neutral-700'
                            : 'text-[#c4a0a0] hover:text-[#e8d4d4]'
                      )}
                    >
                      Season 1
                    </button>
                    <button
                      type="button"
                      onClick={() => onSeasonChange('season2')}
                      className={cn(
                        'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        activeSeason === 'season2'
                          ? theme === 'light'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'bg-[#262222] text-[#f0e8e8] shadow-sm'
                          : theme === 'light'
                            ? 'text-neutral-500 hover:text-neutral-700'
                            : 'text-[#c4a0a0] hover:text-[#e8d4d4]'
                      )}
                    >
                      Season 2
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Filter panel overlay */}
            {filterOpen && onFilterClose && filters && onFiltersChange && (
              <FilterPanel
                products={productsForFilterPanel}
                filters={filters}
                onChange={onFiltersChange}
                isOpen={filterOpen}
                onClose={onFilterClose}
                cartOrder={cartOrder}
                filterPanelLamp={filterPanelLamp ?? undefined}
                artistCatalog={artistCatalogForFilters}
              />
            )}
    </>
  )

  if (docked) {
    if (!isOpen) return null
    return (
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex h-full min-h-0 w-full flex-col overflow-hidden border-l border-border bg-popover text-popover-foreground shadow-2xl',
          'lg:w-[min(440px,42vw)] lg:max-w-[min(440px,42vw)]'
        )}
      >
        {renderPickerPanelBody()}
      </motion.div>
    )
  }


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <div
            className={cn(
              'fixed inset-0 z-[71] flex pointer-events-none',
              'items-end justify-center md:px-4 md:pb-5',
              sheetVariant === 'rightRail' && 'md:items-stretch md:justify-end md:p-0'
            )}
          >
            <motion.div
              initial={isRightRailDesktop ? { x: '100%' } : { y: '100%' }}
              animate={isRightRailDesktop ? { x: 0 } : { y: 0 }}
              exit={isRightRailDesktop ? { x: '100%' } : { y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'flex w-full flex-col pointer-events-auto shadow-2xl bg-popover text-popover-foreground',
                'max-w-full h-[calc(100dvh-10px)] max-h-[calc(100dvh-10px)] rounded-t-3xl',
                !isRightRailDesktop &&
                  'md:max-w-[min(92vw,768px)] md:rounded-2xl md:h-auto md:min-h-[65vh] md:max-h-[min(92vh,900px)]',
                isRightRailDesktop &&
                  'md:h-full md:max-h-none md:max-w-[min(440px,42vw)] md:rounded-none md:rounded-l-3xl'
              )}
            >
            {renderPickerPanelBody()}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
