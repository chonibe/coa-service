'use client'

import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import Image from 'next/image'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import {
  ArtistSpotlightBanner,
  type SpotlightData,
} from '../../experience-v2/components/ArtistSpotlightBanner'
import { FilterPanel, hasActiveFilters, type FilterState } from '../../experience-v2/components/FilterPanel'
import { cn } from '@/lib/utils'
import { buildArtworkRowsByArtist } from '@/lib/shop/experience-artwork-rows'
import {
  experienceArtistRowDefaultClass,
  experienceArtistRowMergeClass,
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

const MERGE_CONFETTI_COUNT = 16
const MERGE_CONFETTI_COLORS = ['#047AFF', '#3b82f6', '#60a5fa', '#22c55e', '#4ade80', '#facc15', '#fde047', '#ffffff']

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
  selectionNumber: number | null
  onSelect: (product: ShopifyProduct) => void
  priorityLoad?: boolean
  mergeWithLeft?: boolean
  mergeWithRight?: boolean
  /** True when this card sits in a 2-up artist row with center spine (flush inner corners). */
  spinePairLayout?: boolean
  /** Show "New Drop" chip when product is in spotlight (featured artist) */
  isNewDrop?: boolean
  /** Show "Early access" chip when spotlight is unlisted */
  isEarlyAccess?: boolean
  /** When true, both artworks in this 2-up row are selected — hide per-card ring (row uses shared tint only). */
  suppressSelectionRing?: boolean
  /** Street ladder: price row in footer; title lives in image-top chip; edition chip below title when non-ladder. */
  streetPricing?: StreetEditionStatesRow | null
}

function ArtworkCardV2({
  product,
  isSelected,
  selectionNumber,
  onSelect,
  priorityLoad = false,
  mergeWithLeft = false,
  mergeWithRight = false,
  spinePairLayout = false,
  isNewDrop = false,
  isEarlyAccess = false,
  suppressSelectionRing = false,
  streetPricing = null,
}: ArtworkCardV2Props) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageUrl = product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url
  const isMergedVisual = isSelected && (mergeWithLeft || mergeWithRight)
  const flushToSpine = isMergedVisual || spinePairLayout
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

  return (
    <motion.div
      data-product-id={product.id}
      className={cn(
        'relative box-border overflow-hidden origin-center',
        selectionChrome,
        surfaces.shell,
        roundLeft && roundRight && 'rounded-xl',
        roundLeft && !roundRight && 'rounded-l-xl',
        !roundLeft && roundRight && 'rounded-r-xl'
      )}
    >
      <motion.div
        className={cn(
          'aspect-[4/5.15] relative overflow-hidden cursor-pointer touch-manipulation select-none',
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
              src={getShopifyImageUrl(imageUrl, 420) ?? imageUrl}
              alt={product.title}
              fill
              unoptimized
              className={cn('object-cover transition-opacity duration-200', imageLoaded ? 'opacity-100' : 'opacity-0')}
              sizes="(max-width: 480px) 48vw, (max-width: 768px) 42vw, 220px"
              priority={priorityLoad}
              loading="eager"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className={cn(
            'w-full h-full flex items-center justify-center text-xs',
            isSelected ? 'text-neutral-500' : 'text-neutral-300 dark:text-[#b89090]'
          )}>
            No image
          </div>
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

        <AnimatePresence initial={false}>
          {isSelected && selectionNumber !== null && (
            <motion.div
              key="selection-badge"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.14, ease: [0.25, 0.1, 0.25, 1] }}
              className={cn(
                'absolute top-1.5 z-10 w-3.5 h-3.5 rounded-full flex items-center justify-center pointer-events-none',
                'border border-white/35 bg-blue-600/75 backdrop-blur-md backdrop-saturate-150',
                'shadow-md shadow-black/25',
                (isNewDrop || isEarlyAccess) ? 'right-1.5' : 'left-1.5'
              )}
            >
              <span className="text-[8px] font-bold leading-none text-white tabular-nums">{selectionNumber}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={cn(
            'absolute inset-x-0 top-0 z-[9] pointer-events-none flex flex-col items-center justify-start gap-0.5 px-1.5 pt-1',
            '[&_.picker-title-chip]:pointer-events-auto',
            (isNewDrop || isEarlyAccess) ? 'pt-9' : 'pt-2',
            isSelected &&
              selectionNumber !== null &&
              ((isNewDrop || isEarlyAccess) ? 'pr-7' : 'pl-7')
          )}
        >
          <div className="flex w-full min-w-0 justify-center">
            <div
              className={cn(
                'picker-title-chip flex w-full max-w-full min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-1',
                'border border-white/30 dark:border-white/20',
                'bg-black/40 backdrop-blur-md backdrop-saturate-150 dark:bg-black/50',
                'text-white shadow-sm shadow-black/20'
              )}
            >
              <span
                className={cn(
                  'min-w-0 text-center text-[10px] sm:text-[11px] font-semibold leading-snug tracking-tight',
                  'line-clamp-2 break-words [overflow-wrap:anywhere]',
                  isSelected ? 'max-w-full' : 'max-w-[calc(100%-1.5rem)]'
                )}
                title={product.title}
              >
                {product.title}
              </span>
              {!isSelected && (
                <Plus
                  className="h-3.5 w-3.5 shrink-0 text-white opacity-95"
                  strokeWidth={2.5}
                  aria-hidden
                />
              )}
            </div>
          </div>
          {!streetPricing ? (
            <EditionBadgeForProduct
              product={product}
              chipOnly
              className="w-full shrink-0 [&>span]:pointer-events-auto"
            />
          ) : null}
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
        <div className="w-full min-w-0 flex flex-col gap-0 items-center">
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
                  : (isSelected ? 'text-neutral-800 dark:text-[#d4b8b8]' : 'text-neutral-800 dark:text-[#c4a0a0]')
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
const ROW_HEIGHT_ESTIMATE = 480

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
}

export function ArtworkPickerSheet({
  isOpen,
  onClose,
  products,
  selectedArtworks,
  lampPreviewOrder,
  onToggleSelect,
  onLoadMore,
  hasMore,
  lastAddedProductId = null,
  activeSeason = 'season2',
  onSeasonChange,
  filters,
  onFiltersChange,
  filterOpen = false,
  onFilterOpen,
  onFilterClose,
  spotlightData,
  spotlightProducts = [],
  onSpotlightSelect,
  productsForFilterPanel = [],
  cartOrder = [],
  spotlightBannerExpanded,
  streetEditionByProductId = {},
}: ArtworkPickerSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const prevSeasonRef = useRef(activeSeason)
  const { theme } = useExperienceTheme()

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

  const activeFilterCount = useMemo(() => {
    if (!filters) return 0
    let n = 0
    if (filters.artists.length) n += filters.artists.length
    if (filters.tags.length) n += filters.tags.length
    if (filters.priceRange) n += 1
    if (filters.inStockOnly) n += 1
    if (filters.sortBy !== 'featured') n += 1
    if (filters.minStarRating !== null) n += 1
    return n
  }, [filters])

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

  const getSelectionNumber = useCallback(
    (productId: string): number | null => {
      const idx = selectedArtworks.findIndex((p) => p.id === productId)
      return idx >= 0 ? idx + 1 : null
    },
    [selectedArtworks]
  )

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const rows = useMemo(() => buildArtworkRowsByArtist(products), [products])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 6,
  })

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

          <div className="fixed inset-0 z-[71] flex items-end justify-center pointer-events-none md:px-4 md:pb-5">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'flex w-full flex-col pointer-events-auto shadow-2xl',
                /* Mobile: nearly full viewport sheet */
                'max-w-full h-[calc(100dvh-10px)] max-h-[calc(100dvh-10px)] rounded-t-3xl',
                /* Desktop: wider shell (matches experience top chrome); floated panel with full rounding */
                'md:max-w-[min(92vw,768px)] md:rounded-2xl md:h-auto md:min-h-[65vh] md:max-h-[min(92vh,900px)]',
                theme === 'light' ? 'bg-white' : 'bg-[#171515]'
              )}
            >
            {/* Header: mobile = title + Done; desktop = two-zone bar (title block | tools) */}
            <div className={cn(
              'flex-shrink-0 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 pt-[max(0.75rem,env(safe-area-inset-top,0px))] border-b',
              'md:flex-nowrap md:items-center md:justify-between md:gap-4 md:px-6 md:py-3.5',
              theme === 'light' ? 'border-neutral-200' : 'border-neutral-800'
            )}>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-none md:max-w-[55%]">
                <h2 className={cn(
                  'text-base font-semibold leading-tight',
                  theme === 'light' ? 'text-neutral-900' : 'text-white'
                )}>
                  Start your Collection
                </h2>
                <p
                  className={cn(
                    'text-[11px] sm:text-xs font-normal leading-snug',
                    theme === 'light' ? 'text-neutral-500' : 'text-[#c4a0a0]'
                  )}
                >
                  <span className="md:hidden">Tap to add</span>
                  <span className="hidden md:inline">Click to add</span>
                </p>
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
                          ? 'bg-white text-neutral-900 shadow-sm'
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
                          ? 'bg-white text-neutral-900 shadow-sm'
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
              {onFilterOpen && onFilterClose && filters && onFiltersChange && (
                <button
                  type="button"
                  onClick={onFilterOpen}
                  className={cn(
                    'hidden md:flex relative items-center justify-center w-9 h-9 rounded-lg text-xs font-medium transition-colors border flex-shrink-0',
                    hasActiveFilters(filters)
                      ? 'bg-neutral-900 dark:bg-[#262222] text-white border-neutral-900 dark:border-[#2c2828]'
                      : theme === 'light'
                        ? 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                        : 'bg-[#201c1c] text-[#d4b8b8] border-[#3e3838] hover:border-[#4a4444] hover:bg-[#262222]'
                  )}
                  aria-label="Open filters"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white dark:bg-[#2c2828] text-neutral-900 dark:text-[#f0e8e8] ring-1 ring-neutral-200 dark:ring-[#4a4444] text-[10px] flex items-center justify-center font-bold leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Done"
                className={cn(
                  'flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-semibold -my-2 transition-colors shrink-0',
                  theme === 'light'
                    ? 'text-[#047AFF] hover:text-[#0366d6] hover:bg-neutral-100'
                    : 'text-[#60A5FA] hover:text-[#93C5FD] hover:bg-[#262222]'
                )}
              >
                Done
              </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-1.5 py-3 md:px-5 md:py-4"
            >
              <div className="md:mx-auto md:w-full md:max-w-[min(65vh,520px)]">
              {/* Artist spotlight at top */}
              {spotlightData && onSpotlightSelect && (
                <div className="mb-3">
                  <ArtistSpotlightBanner
                    spotlight={{ ...spotlightData, gifUrl: undefined }}
                    spotlightProducts={spotlightProducts}
                    onSelect={onSpotlightSelect}
                    showBadge
                    expanded={spotlightAccordionExpanded}
                  />
                </div>
              )}

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
                  const shouldMerge = bothSelected && sameVendor
                  const showArtistSpine = row.length === 2
                  const artistLabel = (product1?.vendor || product2?.vendor || 'Artist').trim() || 'Artist'
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
                        showArtistSpine && shouldMerge ? 'py-4 md:py-6' : 'pb-12 md:pb-16'
                      )}
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {showArtistSpine ? (
                        <div
                          className={cn(
                            'relative flex items-stretch rounded-xl overflow-hidden',
                            shouldMerge ? experienceArtistRowMergeClass : experienceArtistRowDefaultClass
                          )}
                        >
                          {shouldMerge && <MergeConfetti active={justMerged} />}
                          {product1 && (
                            <div className={cn('flex-1 min-w-0', shouldMerge && '-mr-px')}>
                              <ArtworkCardV2
                                key={product1.id}
                                product={product1}
                                isSelected={p1Selected}
                                selectionNumber={getSelectionNumber(product1.id)}
                                onSelect={onToggleSelect}
                                priorityLoad={virtualRow.index < 3}
                                mergeWithRight
                                spinePairLayout
                                isNewDrop={isInSpotlight(product1.id) && !spotlightData?.unlisted}
                                isEarlyAccess={isInSpotlight(product1.id) && !!spotlightData?.unlisted}
                                suppressSelectionRing={shouldMerge}
                                streetPricing={streetPricingForProduct(product1)}
                              />
                            </div>
                          )}
                          <div
                            className={cn(
                              'shrink-0 z-[1] self-stretch flex flex-col items-center justify-center bg-transparent',
                              shouldMerge ? 'px-0' : 'px-0.5'
                            )}
                          >
                            <span
                              className={cn(
                                'text-[10px] font-semibold text-neutral-700 dark:text-[#f0e8e8]/90 uppercase whitespace-nowrap [writing-mode:vertical-rl] rotate-180',
                                shouldMerge ? 'py-0.5 tracking-wide' : 'py-1 tracking-widest'
                              )}
                            >
                              {artistLabel}
                            </span>
                          </div>
                          {product2 && (
                            <div className={cn('flex-1 min-w-0', shouldMerge && '-ml-px')}>
                              <ArtworkCardV2
                                key={product2.id}
                                product={product2}
                                isSelected={p2Selected}
                                selectionNumber={getSelectionNumber(product2.id)}
                                onSelect={onToggleSelect}
                                priorityLoad={virtualRow.index < 3}
                                mergeWithLeft
                                spinePairLayout
                                isNewDrop={isInSpotlight(product2.id) && !spotlightData?.unlisted}
                                isEarlyAccess={isInSpotlight(product2.id) && !!spotlightData?.unlisted}
                                suppressSelectionRing={shouldMerge}
                                streetPricing={streetPricingForProduct(product2)}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative flex justify-center">
                          {product1 && (
                            <div className="w-[calc(52.5%-0.125rem)] max-w-[280px]">
                              <ArtworkCardV2
                                key={product1.id}
                                product={product1}
                                isSelected={!!p1Selected}
                                selectionNumber={getSelectionNumber(product1.id)}
                                onSelect={onToggleSelect}
                                priorityLoad={virtualRow.index < 3}
                                isNewDrop={isInSpotlight(product1.id) && !spotlightData?.unlisted}
                                isEarlyAccess={isInSpotlight(product1.id) && !!spotlightData?.unlisted}
                                streetPricing={streetPricingForProduct(product1)}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {spotlightData &&
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
                            ? 'border-amber-200/60 bg-white text-neutral-900 hover:bg-amber-50/80'
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
            {(onSeasonChange || (onFilterOpen && onFilterClose && filters && onFiltersChange)) && (
              <div className={cn(
                'md:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3 border-t pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]',
                theme === 'light' ? 'border-neutral-200 bg-neutral-50/80' : 'border-neutral-800 bg-[#1a1616]/80'
              )}>
                {onSeasonChange && (
                  <div className={cn(
                    'flex rounded-lg border p-0.5 flex-1',
                    theme === 'light'
                      ? 'border-neutral-200 bg-white'
                      : 'border-[#2c2828] bg-[#201c1c]/50'
                  )}>
                    <button
                      type="button"
                      onClick={() => onSeasonChange('season1')}
                      className={cn(
                        'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        activeSeason === 'season1'
                          ? theme === 'light'
                            ? 'bg-white text-neutral-900 shadow-sm'
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
                            ? 'bg-white text-neutral-900 shadow-sm'
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
                {onFilterOpen && onFilterClose && filters && onFiltersChange && (
                  <button
                    type="button"
                    onClick={onFilterOpen}
                    className={cn(
                      'relative flex items-center justify-center w-11 h-11 rounded-lg text-sm font-medium transition-colors border flex-shrink-0',
                      hasActiveFilters(filters)
                        ? 'bg-neutral-900 dark:bg-[#262222] text-white border-neutral-900 dark:border-[#2c2828]'
                        : theme === 'light'
                          ? 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                          : 'bg-[#201c1c] text-[#d4b8b8] border-[#3e3838] hover:border-[#4a4444] hover:bg-[#262222]'
                    )}
                    aria-label="Open filters"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] px-1 rounded-full bg-white dark:bg-[#2c2828] text-neutral-900 dark:text-[#f0e8e8] ring-1 ring-neutral-200 dark:ring-[#4a4444] text-[11px] flex items-center justify-center font-bold leading-none">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
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
              />
            )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
