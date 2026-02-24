'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, SlidersHorizontal } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'

export interface FilterState {
  artists: string[]
  tags: string[]
  priceRange: [number, number] | null
  inStockOnly: boolean
  inCartOnly: boolean
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'newest'
}

export const DEFAULT_FILTERS: FilterState = {
  artists: [],
  tags: [],
  priceRange: null,
  inStockOnly: false,
  inCartOnly: false,
  sortBy: 'featured',
}

export function hasActiveFilters(f: FilterState): boolean {
  return (
    f.artists.length > 0 ||
    f.tags.length > 0 ||
    f.priceRange !== null ||
    f.inStockOnly ||
    f.inCartOnly ||
    f.sortBy !== 'featured'
  )
}

interface FilterPanelProps {
  products: ShopifyProduct[]
  filters: FilterState
  onChange: (filters: FilterState) => void
  isOpen: boolean
  onClose: () => void
}

const PRICE_PRESETS: Array<{ label: string; range: [number, number] }> = [
  { label: 'Under $50', range: [0, 50] },
  { label: '$50 – $100', range: [50, 100] },
  { label: '$100 – $200', range: [100, 200] },
  { label: '$200+', range: [200, Infinity] },
]

const SORT_OPTIONS: Array<{ value: FilterState['sortBy']; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
]

export function FilterPanel({ products, filters, onChange, isOpen, onClose }: FilterPanelProps) {
  const allArtists = useMemo(() => {
    const map = new Map<string, number>()
    products.forEach((p) => {
      if (p.vendor) map.set(p.vendor, (map.get(p.vendor) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [products])

  const allTags = useMemo(() => {
    const map = new Map<string, number>()
    products.forEach((p) => {
      p.tags?.forEach((t) => {
        const tag = t.trim().toLowerCase()
        if (tag) map.set(tag, (map.get(tag) || 0) + 1)
      })
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
  }, [products])

  const toggleArtist = (artist: string) => {
    const next = filters.artists.includes(artist)
      ? filters.artists.filter((a) => a !== artist)
      : [...filters.artists, artist]
    onChange({ ...filters, artists: next })
  }

  const toggleTag = (tag: string) => {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag]
    onChange({ ...filters, tags: next })
  }

  const setPriceRange = (range: [number, number] | null) => {
    const isSame =
      filters.priceRange &&
      range &&
      filters.priceRange[0] === range[0] &&
      filters.priceRange[1] === range[1]
    onChange({ ...filters, priceRange: isSame ? null : range })
  }

  const clearAll = () => onChange(DEFAULT_FILTERS)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[68] md:hidden"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[69] w-full max-w-sm bg-white shadow-xl flex flex-col
                       md:relative md:max-w-none md:shadow-none md:border-l md:border-neutral-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-neutral-500" />
                <h3 className="text-sm font-semibold text-neutral-900">Filters</h3>
              </div>
              <div className="flex items-center gap-3">
                {hasActiveFilters(filters) && (
                  <button onClick={clearAll} className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors">
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Sort */}
              <section>
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Sort by</h4>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onChange({ ...filters, sortBy: opt.value })}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                        filters.sortBy === opt.value
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Artists */}
              {allArtists.length > 1 && (
                <section>
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Artist</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {allArtists.map(([artist, count]) => (
                      <label key={artist} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.artists.includes(artist)}
                          onChange={() => toggleArtist(artist)}
                          className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                        />
                        <span className="text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors flex-1">{artist}</span>
                        <span className="text-xs text-neutral-400">{count}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {/* Tags — hidden for now */}
              {false && allTags.length > 0 && (
                <section>
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(([tag, count]) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                          filters.tags.includes(tag)
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        )}
                      >
                        {tag} ({count})
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Price range */}
              <section>
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Price</h4>
                <div className="flex flex-wrap gap-2">
                  {PRICE_PRESETS.map((preset) => {
                    const isActive =
                      filters.priceRange?.[0] === preset.range[0] &&
                      filters.priceRange?.[1] === preset.range[1]
                    return (
                      <button
                        key={preset.label}
                        onClick={() => setPriceRange(preset.range)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        )}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Availability */}
              <section>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.inStockOnly}
                    onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
                    className="sr-only"
                  />
                  <span className={cn(
                    'relative inline-block w-10 h-5 flex-shrink-0 rounded-full border transition-colors duration-200',
                    filters.inStockOnly ? 'bg-neutral-900 border-neutral-900' : 'bg-neutral-200 border-neutral-200'
                  )}>
                    <span className={cn(
                      'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                      filters.inStockOnly ? 'translate-x-5' : 'translate-x-0'
                    )} />
                  </span>
                  <span className="text-sm text-neutral-700">In stock only</span>
                </label>
              </section>

              {/* Added to cart */}
              <section>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.inCartOnly}
                    onChange={(e) => onChange({ ...filters, inCartOnly: e.target.checked })}
                    className="sr-only"
                  />
                  <span className={cn(
                    'relative inline-block w-10 h-5 flex-shrink-0 rounded-full border transition-colors duration-200',
                    filters.inCartOnly ? 'bg-green-500 border-green-500' : 'bg-neutral-200 border-neutral-200'
                  )}>
                    <span className={cn(
                      'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                      filters.inCartOnly ? 'translate-x-5' : 'translate-x-0'
                    )} />
                  </span>
                  <span className="text-sm text-neutral-700">Added to cart only</span>
                </label>
              </section>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-neutral-100">
              <button
                onClick={onClose}
                className="w-full h-10 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
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
  searchQuery: string
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
    result = result.filter((p) => filters.artists.includes(p.vendor))
  }

  if (filters.tags.length > 0) {
    result = result.filter((p) =>
      filters.tags.some((t) => p.tags?.map((pt) => pt.toLowerCase()).includes(t))
    )
  }

  if (filters.priceRange) {
    const [min, max] = filters.priceRange
    result = result.filter((p) => {
      const price = parseFloat(p.priceRange?.minVariantPrice?.amount || '0')
      return price >= min && price <= max
    })
  }

  if (filters.inStockOnly) {
    result = result.filter((p) => p.availableForSale)
  }

  switch (filters.sortBy) {
    case 'price-asc':
      result.sort((a, b) => parseFloat(a.priceRange?.minVariantPrice?.amount || '0') - parseFloat(b.priceRange?.minVariantPrice?.amount || '0'))
      break
    case 'price-desc':
      result.sort((a, b) => parseFloat(b.priceRange?.minVariantPrice?.amount || '0') - parseFloat(a.priceRange?.minVariantPrice?.amount || '0'))
      break
    case 'newest':
      result.reverse()
      break
  }

  return result
}
