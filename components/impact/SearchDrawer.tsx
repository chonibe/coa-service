'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Input } from './Input'
import Link from 'next/link'

/**
 * Impact Theme Search Drawer
 * 
 * Predictive search drawer with real-time results from Shopify Storefront API.
 */

export interface SearchResult {
  id: string
  handle: string
  title: string
  type: 'product' | 'collection'
  image?: {
    url: string
    altText?: string
  }
  price?: string
  vendor?: string
}

export interface SearchDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (query: string) => Promise<{ products: SearchResult[]; collections: SearchResult[] }>
  placeholder?: string
  className?: string
}

const RECENT_SEARCHES_KEY = 'street-collector-recent-searches'
const MAX_RECENT_SEARCHES = 5

const SearchDrawer = React.forwardRef<HTMLDivElement, SearchDrawerProps>(
  (
    {
      isOpen,
      onClose,
      onSearch,
      placeholder = 'Search artworks, artists, collections...',
      className,
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [query, setQuery] = React.useState('')
    const [results, setResults] = React.useState<{
      products: SearchResult[]
      collections: SearchResult[]
    }>({ products: [], collections: [] })
    const [loading, setLoading] = React.useState(false)
    const [hasSearched, setHasSearched] = React.useState(false)
    const [recentSearches, setRecentSearches] = React.useState<string[]>([])

    // Load recent searches on mount
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
        setRecentSearches(prev => {
          // Remove if already exists
          const filtered = prev.filter(s => s.toLowerCase() !== searchQuery.toLowerCase())
          // Add to front
          const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES)
          // Persist
          localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
          return updated
        })
      } catch (error) {
        console.warn('Failed to save recent search:', error)
      }
    }, [])

    // Clear recent searches
    const clearRecentSearches = React.useCallback(() => {
      try {
        localStorage.removeItem(RECENT_SEARCHES_KEY)
        setRecentSearches([])
      } catch (error) {
        console.warn('Failed to clear recent searches:', error)
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
          // Save to recent searches when user actually searches
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
    }, [query, onSearch])

    // Focus input when opened
    React.useEffect(() => {
      if (isOpen && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }, [isOpen])

    // Close on escape
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose()
        }
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    // Prevent scroll when open
    React.useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
        setQuery('')
        setResults({ products: [], collections: [] })
        setHasSearched(false)
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [isOpen])

    const hasResults = results.products.length > 0 || results.collections.length > 0

    return (
      <>
        {/* Backdrop */}
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer - Card Style */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          className={cn(
            'fixed top-4 left-4 right-4 z-50 max-h-[calc(100%-2rem)] w-[calc(100%-2rem)]',
            'bg-white shadow-2xl rounded-2xl',
            'overflow-hidden flex flex-col',
            className
          )}
        >
          {/* Search input */}
          <div className="flex items-center gap-4 p-4 border-b border-[#1a1a1a]/10">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className={cn(
                  'w-full h-12 pl-12 pr-4',
                  'font-body text-base text-[#1a1a1a]',
                  'bg-[#f5f5f5]',
                  'border-0 rounded-[60px]',
                  'placeholder:text-[#1a1a1a]/50',
                  'focus:outline-none focus:ring-2 focus:ring-[#2c4bce]'
                )}
              />
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="2"
                className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M16 16l4 4" />
              </svg>
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-[#2c4bce]/20 border-t-[#2c4bce] rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors"
              aria-label="Close search"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {hasSearched && !hasResults && !loading && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1a1a1a]/5 rounded-full mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <h3 className="font-heading text-lg font-semibold text-[#1a1a1a] mb-2">
                  No results found
                </h3>
                <p className="text-sm text-[#1a1a1a]/60">
                  No results for "{query}"
                </p>
                <p className="text-sm text-[#1a1a1a]/50 mt-1">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {hasResults && (
              <div className="p-4">
                {/* Results count */}
                <div className="mb-4 text-sm text-[#1a1a1a]/60">
                  {results.products.length + results.collections.length === 1
                    ? `1 result for "${query}"`
                    : `${results.products.length + results.collections.length} results for "${query}"`}
                </div>
                
                {/* Collections */}
                {results.collections.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-[#1a1a1a]/50 mb-3">
                      Collections ({results.collections.length})
                    </h3>
                    <div className="space-y-2">
                      {results.collections.map((collection) => (
                        <Link
                          key={collection.id}
                          href={`/shop?collection=${collection.handle}`}
                          onClick={onClose}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f5f5f5] transition-colors"
                        >
                          {collection.image && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#f5f5f5]">
                              <img
                                src={collection.image.url}
                                alt={collection.image.altText || collection.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <span className="font-medium text-[#1a1a1a]">
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
                    <h3 className="text-xs font-medium uppercase tracking-wider text-[#1a1a1a]/50 mb-3">
                      Artworks ({results.products.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {results.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/shop/${product.handle}`}
                          onClick={onClose}
                          className="group"
                        >
                          <div className="aspect-square rounded-[16px] overflow-hidden bg-[#f5f5f5] mb-2">
                            {product.image && (
                              <img
                                src={product.image.url}
                                alt={product.image.altText || product.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            )}
                          </div>
                          {product.vendor && (
                            <p className="text-xs text-[#1a1a1a]/50 uppercase tracking-wider">
                              {product.vendor}
                            </p>
                          )}
                          <h4 className="text-sm font-medium text-[#1a1a1a] line-clamp-2">
                            {product.title}
                          </h4>
                          {product.price && (
                            <p className="text-sm font-semibold text-[#1a1a1a] mt-1">
                              {product.price}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* View all results */}
                {query && (
                  <div className="mt-6 text-center">
                    <Link
                      href={`/shop?q=${encodeURIComponent(query)}`}
                      onClick={onClose}
                    >
                      <Button variant="outline" size="sm">
                        View all results for "{query}"
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Recent & Quick links when no search */}
            {!hasSearched && !loading && (
              <div className="p-4 space-y-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-[#1a1a1a]/50">
                        Recent Searches
                      </h3>
                      <button
                        type="button"
                        onClick={clearRecentSearches}
                        className="text-xs text-[#1a1a1a]/50 hover:text-[#f83a3a] transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="space-y-2">
                      {recentSearches.map((term, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setQuery(term)}
                          className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-[#f5f5f5] rounded-lg transition-colors group"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#1a1a1a]/30 group-hover:text-[#1a1a1a]/50">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          <span className="text-sm text-[#1a1a1a]">{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-[#1a1a1a]/50 mb-3">
                    Popular Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['New Releases', 'Best Sellers', 'Street Lamp', 'Abstract', 'Portraits'].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQuery(term)}
                        className="px-4 py-2 text-sm bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded-full transition-colors"
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
      </>
    )
  }
)
SearchDrawer.displayName = 'SearchDrawer'

export { SearchDrawer }
