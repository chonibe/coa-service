'use client'

import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import Image from 'next/image'
import { SlidersHorizontal, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import { ArtistSpotlightBanner, type SpotlightData } from '../../experience-v2/components/ArtistSpotlightBanner'
import { FilterPanel, hasActiveFilters, type FilterState } from '../../experience-v2/components/FilterPanel'
import { cn } from '@/lib/utils'

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

function formatPrice(product: ShopifyProduct): string {
  const price = parseFloat(product.priceRange?.minVariantPrice?.amount ?? '0')
  return price > 0 ? `$${price.toFixed(2)}` : 'Free'
}

interface ArtworkCardV2Props {
  product: ShopifyProduct
  isSelected: boolean
  selectionNumber: number | null
  onSelect: (product: ShopifyProduct) => void
  priorityLoad?: boolean
  mergeWithLeft?: boolean
  mergeWithRight?: boolean
  /** Show "New Drop" chip when product is in spotlight (featured artist) */
  isNewDrop?: boolean
  /** Show "Early access" chip when spotlight is unlisted */
  isEarlyAccess?: boolean
}

function ArtworkCardV2({
  product,
  isSelected,
  selectionNumber,
  onSelect,
  priorityLoad = false,
  mergeWithLeft = false,
  mergeWithRight = false,
  isNewDrop = false,
  isEarlyAccess = false,
}: ArtworkCardV2Props) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const { theme } = useExperienceTheme()
  const imageUrl = product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url
  const isMerged = isSelected && (mergeWithLeft || mergeWithRight)
  const roundLeft = !isMerged || mergeWithRight
  const roundRight = !isMerged || mergeWithLeft

  const handleClick = useCallback(() => {
    onSelect(product)
  }, [product, onSelect])

  return (
    <motion.div
      data-product-id={product.id}
      className={cn(
        'relative transition-all duration-200 origin-center overflow-hidden',
        roundLeft && roundRight && 'rounded-xl',
        roundLeft && !roundRight && 'rounded-l-xl',
        !roundLeft && roundRight && 'rounded-r-xl',
        isSelected && 'bg-[#e8f4ff] dark:bg-[#1a1616]',
        isSelected && !isMerged && 'scale-[0.95] ring-1 ring-[#FFBA94]/60',
      )}
    >
      <motion.div
        className={cn(
          'aspect-[4/5] relative overflow-hidden cursor-pointer touch-manipulation select-none',
          roundLeft && roundRight && 'rounded-t-xl',
          roundLeft && !roundRight && 'rounded-tl-xl',
          !roundLeft && roundRight && 'rounded-tr-xl',
          isSelected ? 'bg-[#e8f4ff] dark:bg-[#171515]' : 'bg-neutral-100 dark:bg-[#201c1c]'
        )}
        whileTap={{ scale: 0.95 }}
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
              src={getShopifyImageUrl(imageUrl, 400) ?? imageUrl}
              alt={product.title}
              fill
              className={cn('object-cover transition-opacity duration-200', imageLoaded ? 'opacity-100' : 'opacity-0')}
              sizes="(max-width: 480px) 45vw, (max-width: 768px) 40vw, 200px"
              priority={priorityLoad}
              loading={priorityLoad ? 'eager' : 'lazy'}
              onLoad={() => setImageLoaded(true)}
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
          <span className={cn(
            'absolute top-2 left-2 z-10 text-[10px] font-semibold px-1.5 py-0.5 rounded',
            isEarlyAccess
              ? 'text-violet-800 dark:text-violet-200 bg-violet-100/95 dark:bg-violet-900/50'
              : 'text-amber-800 dark:text-amber-200 bg-amber-100/95 dark:bg-amber-900/50'
          )}>
            {isEarlyAccess ? 'Early access' : 'Featured Artist'}
          </span>
        )}

        {isSelected && selectionNumber !== null && (
          <div className={cn(
            'absolute top-2 z-10 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center',
            (isNewDrop || isEarlyAccess) ? 'right-2' : 'left-2'
          )}>
            <span className="text-xs font-bold text-white">{selectionNumber}</span>
          </div>
        )}
      </motion.div>

      <div
        className={cn(
          'px-2 flex items-center justify-between gap-2 border-t transition-colors overflow-hidden cursor-pointer',
          (mergeWithLeft || mergeWithRight) ? 'py-1' : 'py-1.5',
          roundLeft && roundRight && 'rounded-b-xl',
          roundLeft && !roundRight && 'rounded-bl-xl',
          !roundLeft && roundRight && 'rounded-br-xl',
          isSelected
            ? 'border-blue-200/60 dark:border-white/20 bg-[#e8f4ff]/95 dark:bg-[#1a1616]/80 backdrop-blur-xl backdrop-saturate-150'
            : 'border-white/40 dark:border-white/10 bg-white/60 dark:bg-[#201c1c]/80 backdrop-blur-xl backdrop-saturate-150'
        )}
        style={{ backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
        onClick={handleClick}
      >
        <div className="flex-1 min-w-0">
          {product.vendor && (
            <p className={cn(
              'text-[10px] truncate',
              isSelected ? 'text-neutral-700 dark:text-[#d4b8b8]' : 'text-neutral-600 dark:text-[#c4a0a0]'
            )}>{product.vendor}</p>
          )}
          <p className={cn(
            'text-xs font-medium truncate',
            isSelected ? 'text-black dark:text-[#f0e8e8]' : 'text-black dark:text-[#f0e8e8]'
          )}>{product.title}</p>
        </div>
        <p className={cn(
          'text-xs flex-shrink-0 font-medium',
          isSelected ? 'text-neutral-800 dark:text-[#d4b8b8]' : 'text-neutral-800 dark:text-[#c4a0a0]'
        )}>{formatPrice(product)}</p>
      </div>
    </motion.div>
  )
}

const ROW_HEIGHT_ESTIMATE = 280

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
}: ArtworkPickerSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { theme } = useExperienceTheme()

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

  const rows = useMemo(() => {
    const result: ShopifyProduct[][] = []
    for (let i = 0; i < products.length; i += 2) {
      result.push(products.slice(i, i + 2))
    }
    return result
  }, [products])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 3,
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

          <div className="fixed inset-0 z-[71] flex items-end justify-center pointer-events-none">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'w-full max-w-2xl min-h-[60vh] max-h-[85vh] md:min-h-[70vh] md:max-h-[96vh] flex flex-col pointer-events-auto rounded-t-3xl md:rounded-t-2xl md:shadow-2xl',
                theme === 'light' ? 'bg-white' : 'bg-[#171515]'
              )}
            >
            {/* Header: Title + Close (mobile: title + close only; desktop: title + seasons + filter + close) */}
            <div className={cn(
              'flex-shrink-0 flex items-center gap-3 px-4 py-2.5 pt-[max(0.75rem,env(safe-area-inset-top,0px))] border-b',
              theme === 'light' ? 'border-neutral-200' : 'border-neutral-800'
            )}>
              <h2 className={cn(
                'text-base font-semibold flex-shrink-0',
                theme === 'light' ? 'text-neutral-900' : 'text-white'
              )}>
                Start your Collection
              </h2>
              {/* Desktop: Season + Filter in header */}
              {onSeasonChange && (
                <div className={cn(
                  'hidden md:flex rounded-lg border p-0.5 flex-shrink-0 ml-auto',
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
                aria-label="Close"
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-lg -m-2 ml-auto transition-colors',
                  theme === 'light'
                    ? 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                    : 'text-[#c4a0a0] hover:text-white hover:bg-[#262222]'
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overscroll-contain px-2 py-3"
            >
              {/* Artist spotlight at top */}
              {spotlightData && spotlightProducts.length > 0 && onSpotlightSelect && (
                <div className="mb-3">
                  <ArtistSpotlightBanner
                    spotlight={spotlightData}
                    spotlightProducts={spotlightProducts}
                    onSelect={onSpotlightSelect}
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
                  const justMerged = shouldMerge && (
                    (product1?.id === lastAddedProductId) || (product2?.id === lastAddedProductId)
                  )
                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div
                        className={cn(
                          'relative',
                          shouldMerge ? 'py-1 mx-1 my-0.5' : 'pb-2',
                          shouldMerge
                            ? 'flex rounded-xl border-2 border-[#FFBA94] overflow-hidden bg-[#e8f4ff] dark:bg-[#1a1616]'
                            : 'grid grid-cols-2 gap-2'
                        )}
                      >
                        {shouldMerge && <MergeConfetti active={justMerged} />}
                        {product1 && (
                          <div className={shouldMerge ? 'flex-1 min-w-0' : undefined}>
                            <ArtworkCardV2
                              key={product1.id}
                              product={product1}
                              isSelected={p1Selected}
                              selectionNumber={getSelectionNumber(product1.id)}
                              onSelect={onToggleSelect}
                              priorityLoad={virtualRow.index < 3}
                              mergeWithRight={shouldMerge}
                              isNewDrop={isInSpotlight(product1.id) && !spotlightData?.unlisted}
                              isEarlyAccess={isInSpotlight(product1.id) && !!spotlightData?.unlisted}
                            />
                          </div>
                        )}
                        {shouldMerge && product1 && (
                          <div className="shrink-0 flex flex-col items-center justify-center bg-[#e8f4ff] dark:bg-[#1a1616] px-1 border-l border-r border-[#FFBA94]/30 dark:border-[#FFBA94]/20">
                            <span className="text-[10px] font-semibold text-neutral-700 dark:text-[#f0e8e8]/90 uppercase tracking-widest whitespace-nowrap [writing-mode:vertical-rl] rotate-180 py-1">
                              {product1.vendor}
                            </span>
                          </div>
                        )}
                        {product2 && (
                          <div className={shouldMerge ? 'flex-1 min-w-0' : undefined}>
                            <ArtworkCardV2
                              key={product2.id}
                              product={product2}
                              isSelected={p2Selected}
                              selectionNumber={getSelectionNumber(product2.id)}
                              onSelect={onToggleSelect}
                              priorityLoad={virtualRow.index < 3}
                              mergeWithLeft={shouldMerge}
                              isNewDrop={isInSpotlight(product2.id) && !spotlightData?.unlisted}
                              isEarlyAccess={isInSpotlight(product2.id) && !!spotlightData?.unlisted}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {hasMore && <div ref={sentinelRef} className="h-20" />}

              {!hasMore && products.length > 0 && (
                <p className={cn(
                  'text-center text-sm py-6',
                  theme === 'light' ? 'text-neutral-500' : 'text-neutral-500'
                )}>
                  You&apos;ve seen all artworks
                </p>
              )}
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
