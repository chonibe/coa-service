'use client'

import { useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, SlidersHorizontal } from 'lucide-react'
import { formatPrice, type ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn } from '@/lib/utils'
import { captureFunnelEvent, FunnelEvents, getDeviceType } from '@/lib/posthog'
import { experienceVendorsLooselyEqual } from '@/lib/shop/experience-spotlight-match'

export interface FilterState {
  artists: string[]
  sortBy: 'featured' | 'pairs' | 'price-asc' | 'price-desc' | 'newest' | 'added-to-cart'
}

export const DEFAULT_FILTERS: FilterState = {
  artists: [],
  sortBy: 'featured',
}

/** Optional CTA in the filter sheet: featured artist lamp + 2-print bundle (carousel / spotlight banner). */
export interface FeaturedBundleFilterOffer {
  vendorName: string
  bundleUsd: number
  compareAtUsd: number
  onApply: () => void
  disabled?: boolean
}

/** Street Lamp row in the filter sheet (replaces bundle block above Artist list). */
export interface FilterPanelLampOffer {
  product: ShopifyProduct
  quantity: number
  onAdd: () => void
}

export function hasActiveFilters(f: FilterState): boolean {
  return (
    f.artists.length > 0 ||
    f.sortBy !== 'featured'
  )
}

interface FilterPanelProps {
  products: ShopifyProduct[]
  filters: FilterState
  onChange: (filters: FilterState) => void
  isOpen: boolean
  onClose: () => void
  wishlistCount?: number
  /** Cart order (product IDs) for "In your collection" sort */
  cartOrder?: string[]
  /** When provided, called instead of global open-wishlist event (e.g. to open WishlistSwiperSheet in experience) */
  onOpenWishlist?: () => void
  /** Street Lamp product row with Add — shown above Artist list when set */
  filterPanelLamp?: FilterPanelLampOffer | null
  /**
   * Full-season vendor catalog from `/api/shop/experience/collection-vendors` (paginated server-side).
   * When set, artist checklist uses this instead of deriving from `products` (avoids missing artists when only the first product page is loaded).
   */
  artistCatalog?: [string, number][] | null
}

const SORT_OPTIONS: Array<{ value: FilterState['sortBy']; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'pairs', label: 'Pairs first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'added-to-cart', label: 'In your collection' },
]

function applyFilterAndTrack(
  onChange: (filters: FilterState) => void,
  next: FilterState,
  changeType: string
) {
  captureFunnelEvent(FunnelEvents.experience_filter_applied, {
    filter_type: changeType,
    has_artists: next.artists.length > 0,
    sort_by: next.sortBy,
  })
  onChange(next)
}

export function FilterPanel({
  products,
  filters,
  onChange,
  isOpen,
  onClose,
  wishlistCount = 0,
  cartOrder = [],
  onOpenWishlist,
  filterPanelLamp = null,
  artistCatalog = null,
}: FilterPanelProps) {
  const filterPanelOpenLogged = useRef(false)
  useEffect(() => {
    if (!isOpen) {
      filterPanelOpenLogged.current = false
      return
    }
    if (filterPanelOpenLogged.current) return
    filterPanelOpenLogged.current = true
    captureFunnelEvent(FunnelEvents.experience_filter_interaction, {
      action: 'panel_opened',
      context: 'experience_v2',
      device_type: getDeviceType(),
    })
  }, [isOpen])

  const allArtists = useMemo(() => {
    if (artistCatalog && artistCatalog.length > 0) {
      return artistCatalog
    }
    const map = new Map<string, number>()
    products.forEach((p) => {
      if (p.vendor) map.set(p.vendor, (map.get(p.vendor) || 0) + 1)
    })
    return Array.from(map.entries())
      .sort((a, b) => {
        const aPairs = a[1] >= 2 ? 1 : 0
        const bPairs = b[1] >= 2 ? 1 : 0
        if (bPairs !== aPairs) return bPairs - aPairs
        return a[0].localeCompare(b[0])
      })
  }, [artistCatalog, products])


  const toggleArtist = (artist: string) => {
    const next = filters.artists.includes(artist)
      ? filters.artists.filter((a) => a !== artist)
      : [...filters.artists, artist]
    applyFilterAndTrack(onChange, { ...filters, artists: next }, 'artists')
  }

  const clearAll = () => applyFilterAndTrack(onChange, DEFAULT_FILTERS, 'clear')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[68]"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-[69] w-full max-w-sm bg-popover text-popover-foreground shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-neutral-500 dark:text-[#c4a0a0]" />
                <h3 className="text-sm font-semibold text-[#FFBA94]">Filters</h3>
              </div>
              <div className="flex items-center gap-3">
                {hasActiveFilters(filters) && (
                  <button onClick={clearAll} className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-[#c4a0a0] dark:hover:text-[#e8d4d4] transition-colors">
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-[#201c1c] text-neutral-400 dark:text-[#d4b8b8] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Sort */}
              <section>
                <h4 className="text-xs font-semibold text-neutral-500 dark:text-[#c4a0a0] uppercase tracking-wider mb-2">Sort by</h4>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => applyFilterAndTrack(onChange, { ...filters, sortBy: opt.value }, 'sort')}
                      className={cn(
                        'h-5 px-2.5 flex items-center rounded-lg text-[10px] font-medium leading-none transition-colors',
                        filters.sortBy === opt.value
                          ? 'bg-neutral-900 dark:bg-[#f0e8e8] text-white dark:text-[#171515]'
                          : 'bg-card dark:bg-[#201c1c] border border-neutral-900 dark:border-white/20 text-neutral-900 text-foreground hover:bg-neutral-50 dark:hover:bg-[#262222]'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              {filterPanelLamp ? (
                <section className="rounded-xl border border-neutral-200/90 bg-neutral-50/90 p-3 dark:border-white/15 dark:bg-[#201c1c]/90">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-[#c4a0a0]">
                    Street Lamp
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-200 dark:bg-[#2c2828]">
                      {(() => {
                        const raw =
                          filterPanelLamp.product.featuredImage?.url ??
                          filterPanelLamp.product.images?.edges?.[0]?.node?.url
                        const src = raw ? (getShopifyImageUrl(raw, 200) ?? raw) : null
                        return src ? (
                          <Image
                            src={src}
                            alt={filterPanelLamp.product.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                          />
                        ) : null
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900 text-foreground">
                        {filterPanelLamp.product.title}
                      </p>
                      {filterPanelLamp.product.priceRange?.minVariantPrice ? (
                        <p className="mt-0.5 text-xs tabular-nums text-neutral-600 dark:text-[#b89090]">
                          <span dir="ltr" className="inline-block">
                            {formatPrice(filterPanelLamp.product.priceRange.minVariantPrice)}
                          </span>
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={filterPanelLamp.quantity >= 1}
                      onClick={() => filterPanelLamp.onAdd()}
                      className={cn(
                        'flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                        filterPanelLamp.quantity >= 1
                          ? 'cursor-default bg-neutral-200 text-neutral-500 dark:bg-[#3a3434] dark:text-[#8a8080]'
                          : 'bg-experience-cta text-white hover:bg-experience-cta-hover'
                      )}
                    >
                      {filterPanelLamp.quantity >= 1 ? (
                        'In order'
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                </section>
              ) : null}

              {/* Artists */}
              {allArtists.length > 1 && (
                <section>
                  <h4 className="text-xs font-semibold text-neutral-500 dark:text-[#c4a0a0] uppercase tracking-wider mb-2">Artist</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {allArtists.map(([artist, count]) => (
                      <label key={artist} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.artists.includes(artist)}
                          onChange={() => toggleArtist(artist)}
                          className="w-4 h-4 rounded border-neutral-300 dark:border-[#4a4444] text-neutral-900 text-foreground focus:ring-neutral-500 dark:focus:ring-neutral-400"
                        />
                        <span className="text-sm text-neutral-700 dark:text-[#d4b8b8] group-hover:text-neutral-900 dark:group-hover:text-white transition-colors flex-1">{artist}</span>
                        <span className="text-xs text-neutral-400 dark:text-[#b89090]">{count}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-border">
              <button
                onClick={onClose}
                className="w-full h-10 rounded-lg bg-neutral-900 dark:bg-[#f0e8e8] text-white dark:text-[#171515] text-sm font-semibold hover:bg-neutral-800 dark:hover:bg-[#4a4444] transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function applyFilters(
  products: ShopifyProduct[],
  filters: FilterState,
  searchQuery: string,
  cartOrder: string[] = []
): ShopifyProduct[] {
  let result = [...products]

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.vendor?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    )
  }

  if (filters.artists.length > 0) {
    result = result.filter((p) =>
      filters.artists.some((sel) => experienceVendorsLooselyEqual(sel, p.vendor))
    )
  }

  switch (filters.sortBy) {
    case 'pairs': {
      const byVendor = new Map<string, ShopifyProduct[]>()
      result.forEach((p) => {
        const v = p.vendor || ''
        if (!byVendor.has(v)) byVendor.set(v, [])
        byVendor.get(v)!.push(p)
      })
      const pairVendors = Array.from(byVendor.entries())
        .filter(([, prods]) => prods.length >= 2)
        .sort(([a], [b]) => a.localeCompare(b))
      const singletonVendors = Array.from(byVendor.entries())
        .filter(([, prods]) => prods.length === 1)
        .sort(([a], [b]) => a.localeCompare(b))
      const paired: ShopifyProduct[] = []
      pairVendors.forEach(([, prods]) => paired.push(...prods))
      const singletons: ShopifyProduct[] = []
      singletonVendors.forEach(([, prods]) => singletons.push(...prods))
      result = [...paired, ...singletons]
      break
    }
    case 'price-asc':
      result.sort((a, b) => parseFloat(a.priceRange?.minVariantPrice?.amount || '0') - parseFloat(b.priceRange?.minVariantPrice?.amount || '0'))
      break
    case 'price-desc':
      result.sort((a, b) => parseFloat(b.priceRange?.minVariantPrice?.amount || '0') - parseFloat(a.priceRange?.minVariantPrice?.amount || '0'))
      break
    case 'newest':
      result.reverse()
      break
    case 'added-to-cart': {
      const cartSet = new Set(cartOrder)
      result = result.filter((p) => cartSet.has(p.id))
      const orderMap = new Map(cartOrder.map((id, i) => [id, i]))
      result.sort((a, b) => {
        const vendorA = a.vendor ?? ''
        const vendorB = b.vendor ?? ''
        if (vendorA !== vendorB) return vendorA.localeCompare(vendorB)
        const aIdx = orderMap.get(a.id) ?? Infinity
        const bIdx = orderMap.get(b.id) ?? Infinity
        return aIdx - bIdx
      })
      break
    }
  }

  return result
}
