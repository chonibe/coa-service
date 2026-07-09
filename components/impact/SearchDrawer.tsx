'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import Link from 'next/link'
import { useSmoothDrawer } from '@/lib/animations/navigation-animations'

/**
 * Impact Theme Search Drawer
 * 
 * Predictive search drawer with real-time results from Shopify Storefront API.
 * Smooth GSAP animations with card-style layout.
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
    const drawerRef = React.useRef<HTMLDivElement>(null)
    const backdropRef = React.useRef<HTMLDivElement>(null)
    const [query, setQuery] = React.useState('')
    const [results, setResults] = React.useState<{
      products: SearchResult[]
      collections: SearchResult[]
    }>({ products: [], collections: [] })
    const [loading, setLoading] = React.useState(false)
    const [hasSearched, setHasSearched] = React.useState(false)
    const [recentSearches, setRecentSearches] = React.useState<string[]>([])

    // GSAP smooth drawer animations
    const { openDrawer, closeDrawer } = useSmoothDrawer(drawerRef, backdropRef)

    // Trigger GSAP animation when open state changes
    React.useEffect(() => {
      if (isOpen) {
        openDrawer()
      } else {
        closeDrawer()
      }
    }, [isOpen, openDrawer, closeDrawer])

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
    }, [query, onSearch, saveToRecentSearches])

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

    React.useEffect(() => {
      if (!isOpen) {
        setQuery('')
        setResults({ products: [], collections: [] })
        setHasSearched(false)
      }
    }, [isOpen])

    const hasResults = results.products.length > 0 || results.collections.length > 0

    return (
      <>
        {/* Backdrop */}
        <div
          ref={backdropRef}
          className="fixed inset-0 z-40 bg-black/50 opacity-0 invisible pointer-events-none"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer - Card Style */}
        <div
          ref={(node) => {
            drawerRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          className={cn(
            'fixed top-4 left-4 right-4 z-50 max-h-[calc(100%-2rem)] w-[calc(100%-2rem)]',
            'bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-border',
            'overflow-hidden flex flex-col',
            'invisible pointer-events-none -translate-x-full',
            className
          )}
          style={{
            willChange: 'transform, opacity'
          }}
        >
          {/* Search input */}
          <div className="flex items-center gap-4 p-4 border-b border-border">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className={cn(
                  'w-full h-12 pl-12 pr-4',
                  'font-body text-base text-foreground',
                  'bg-muted',
                  'border-0 rounded-[60px]',
                  'placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-[#047AFF]'
                )}
              />
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M16 16l4 4" />
              </svg>
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-[#047AFF]/20 border-t-[#047AFF] rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 transition-colors text-muted-foreground hover:text-foreground"
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
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">
                  No results found
                </h3>
                <p className="text-sm text-muted-foreground">
                  No results for {'"'}{query}{'"'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {hasResults && (
              <div className="p-4">
                {/* Results count */}
                <div className="mb-4 text-sm text-muted-foreground">
                  {results.products.length + results.collections.length === 1
                    ? `1 result for "${query}"`
                    : `${results.products.length + results.collections.length} results for "${query}"`}
                </div>
                
                {/* Collections */}
                {results.collections.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Collections ({results.collections.length})
                    </h3>
                    <div className="space-y-2">
                      {results.collections.map((collection) => (
                        <Link
                          key={collection.id}
                          href={`/shop?collection=${collection.handle}`}
                          onClick={onClose}
                          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                        >
                          {collection.image && (
                            <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                              <img
                                src={collection.image.url}
                                alt={collection.image.altText || collection.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <span className="font-medium text-foreground">
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
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                          <div className="mb-2 aspect-square overflow-hidden rounded-[16px] bg-muted">
                            {product.image && (
                              <img
                                src={product.image.url}
                                alt={product.image.altText || product.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            )}
                          </div>
                          {product.vendor && (
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                              {product.vendor}
                            </p>
                          )}
                          <h4 className="text-sm font-medium text-foreground line-clamp-2">
                            {product.title}
                          </h4>
                          {product.price && (
                            <p className="mt-1 text-sm font-semibold text-foreground">
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
                        View all results for {'"'}{query}{'"'}
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
                      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Recent Searches
                      </h3>
                      <button
                        type="button"
                        onClick={clearRecentSearches}
                        className="text-xs text-muted-foreground transition-colors hover:text-[#f83a3a]"
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
                          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/60 group-hover:text-muted-foreground">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          <span className="text-sm text-foreground">{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div>
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Popular Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['New Releases', 'Best Sellers', 'Street Lamp', 'Abstract', 'Portraits'].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQuery(term)}
                        className="rounded-full bg-muted px-4 py-2 text-sm transition-colors hover:bg-accent"
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
