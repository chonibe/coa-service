'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Search, Clock, X } from 'lucide-react'
import type { SearchResult } from '@/components/impact/SearchDrawer'

/**
 * NavSearch - Integrated predictive search component
 * 
 * Used within NavigationModal for inline search experience.
 * Features real-time predictive search with recent searches.
 */

export interface NavSearchProps {
  onSearch: (query: string) => Promise<{ products: SearchResult[]; collections: SearchResult[] }>
  placeholder?: string
  onResultClick?: () => void
  className?: string
}

const RECENT_SEARCHES_KEY = 'street-collector-recent-searches'
const MAX_RECENT_SEARCHES = 5

export function NavSearch({
  onSearch,
  placeholder = 'Search artworks, artists...',
  onResultClick,
  className,
}: NavSearchProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<{
    products: SearchResult[]
    collections: SearchResult[]
  }>({ products: [], collections: [] })
  const [loading, setLoading] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])

  // Load recent searches
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error)
    }
  }, [])

  // Save to recent searches
  const saveToRecentSearches = React.useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return

    try {
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.toLowerCase() !== searchQuery.toLowerCase())
        const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES)
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
        return updated
      })
    } catch (error) {
      console.warn('Failed to save recent search:', error)
    }
  }, [])

  // Debounced search
  React.useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], collections: [] })
      setHasSearched(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const searchResults = await onSearch(query)
        setResults(searchResults)
        setHasSearched(true)
        if (query.trim()) {
          saveToRecentSearches(query.trim())
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, onSearch, saveToRecentSearches])

  const hasResults = results.products.length > 0 || results.collections.length > 0

  const handleClear = () => {
    setQuery('')
    setResults({ products: [], collections: [] })
    setHasSearched(false)
    inputRef.current?.focus()
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full h-14 pl-14 pr-12',
            'bg-[#ffba94]/10 border border-[#ffba94]/20',
            'rounded-2xl',
            'text-[#ffba94] placeholder:text-[#ffba94]/40',
            'focus:outline-none focus:ring-2 focus:ring-[#ffba94]/30',
            'transition-all duration-200'
          )}
        />
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ffba94]/40"
          size={20}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[#ffba94]/40 hover:text-[#ffba94] transition-colors"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-[#ffba94]/20 border-t-[#ffba94] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mt-4 max-h-[400px] overflow-y-auto">
        {/* No Results */}
        {hasSearched && !hasResults && !loading && (
          <div className="text-center py-8">
            <p className="text-sm text-[#ffba94]/60">
              No results for "{query}"
            </p>
            <p className="text-xs text-[#ffba94]/40 mt-1">
              Try different keywords
            </p>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div className="space-y-4">
            {/* Collections */}
            {results.collections.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ffba94]/50 mb-2 px-2">
                  Collections
                </h3>
                <div className="space-y-1">
                  {results.collections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/shop?collection=${collection.handle}`}
                      onClick={onResultClick}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#ffba94]/10 transition-colors"
                    >
                      {collection.image && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#ffba94]/10 flex-shrink-0">
                          <img
                            src={collection.image.url}
                            alt={collection.image.altText || collection.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <span className="text-sm font-medium text-[#ffba94]">
                        {collection.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {results.products.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ffba94]/50 mb-2 px-2">
                  Artworks ({results.products.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {results.products.slice(0, 6).map((product) => (
                    <Link
                      key={product.id}
                      href={`/shop/${product.handle}`}
                      onClick={onResultClick}
                      className="group"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-[#ffba94]/10 mb-2 border border-[#ffba94]/10">
                        {product.image && (
                          <img
                            src={product.image.url}
                            alt={product.image.altText || product.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                      </div>
                      {product.vendor && (
                        <p className="text-xs text-[#ffba94]/40 uppercase tracking-wider">
                          {product.vendor}
                        </p>
                      )}
                      <h4 className="text-sm font-medium text-[#ffba94] line-clamp-1">
                        {product.title}
                      </h4>
                      {product.price && (
                        <p className="text-sm font-semibold text-[#ffba94] mt-0.5">
                          {product.price}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent & Popular when no search */}
        {!hasSearched && !loading && (
          <div className="space-y-4">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ffba94]/50 mb-2 px-2">
                  Recent
                </h3>
                <div className="space-y-1">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-[#ffba94]/10 rounded-lg transition-colors"
                    >
                      <Clock className="text-[#ffba94]/30" size={16} />
                      <span className="text-sm text-[#ffba94]">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ffba94]/50 mb-2 px-2">
                Popular
              </h3>
              <div className="flex flex-wrap gap-2 px-2">
                {['New Releases', 'Best Sellers', 'Street Lamp', 'Abstract'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 text-sm bg-[#ffba94]/10 hover:bg-[#ffba94]/15 rounded-full transition-colors text-[#ffba94] border border-[#ffba94]/20"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
