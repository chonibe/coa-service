'use client'

import * as React from 'react'
import { X, Heart, ShoppingBag, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWishlist, type WishlistItem } from '@/lib/shop/WishlistContext'
import { gsap } from '@/lib/animations'
import { useGSAP } from '@gsap/react'

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'name-az' | 'name-za'

/**
 * WishlistDrawer - Slide-out panel for saved items
 * 
 * Shows all wishlist items with:
 * - Product images and details
 * - Remove from wishlist
 * - Add to cart
 * - Navigate to product
 */

export interface WishlistDrawerProps {
  isOpen: boolean
  onClose: () => void
  onAddToCart?: (productId: string, variantId: string) => void
  className?: string
}

export function WishlistDrawer({
  isOpen,
  onClose,
  onAddToCart,
  className,
}: WishlistDrawerProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null)
  const backdropRef = React.useRef<HTMLDivElement>(null)
  const { items, removeItem, itemCount } = useWishlist()
  const timelineRef = React.useRef<gsap.core.Timeline | null>(null)
  
  // Filter and sort state
  const [sortBy, setSortBy] = React.useState<SortOption>('newest')
  const [showFilters, setShowFilters] = React.useState(false)
  const [artistFilter, setArtistFilter] = React.useState<string>('all')

  const isEmpty = items.length === 0

  // Get unique artists from wishlist
  const uniqueArtists = React.useMemo(() => {
    const artists = new Set(items.map(item => item.artistName).filter(Boolean))
    return Array.from(artists).sort()
  }, [items])

  // Filter and sort items
  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = [...items]

    // Apply artist filter
    if (artistFilter !== 'all') {
      filtered = filtered.filter(item => item.artistName === artistFilter)
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.addedAt - a.addedAt)
        break
      case 'oldest':
        filtered.sort((a, b) => a.addedAt - b.addedAt)
        break
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'name-az':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'name-za':
        filtered.sort((a, b) => b.title.localeCompare(a.title))
        break
    }

    return filtered
  }, [items, sortBy, artistFilter])

  // Smooth drawer animation from LEFT
  useGSAP(() => {
    if (!drawerRef.current || !backdropRef.current) return

    // Set initial closed state - slide from left
    gsap.set(backdropRef.current, { 
      opacity: 0,
      pointerEvents: 'none',
      visibility: 'hidden'
    })
    gsap.set(drawerRef.current, { 
      x: '-100%', // Slide from LEFT
      opacity: 0,
      pointerEvents: 'none',
      visibility: 'hidden'
    })

    // Kill existing timeline if any
    if (timelineRef.current) {
      timelineRef.current.kill()
    }

    // Create reusable timeline
    timelineRef.current = gsap.timeline({ paused: true })

    // Backdrop fade
    timelineRef.current.to(
      backdropRef.current,
      { 
        opacity: 1, 
        pointerEvents: 'auto', 
        visibility: 'visible', 
        duration: 0.3, 
        ease: 'power2.out' 
      },
      0
    )

    // Drawer slide from left
    timelineRef.current.to(
      drawerRef.current,
      { 
        x: '0%',
        opacity: 1,
        pointerEvents: 'auto', 
        visibility: 'visible', 
        duration: 0.4, 
        ease: 'power3.out'
      },
      0.05
    )

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
        timelineRef.current = null
      }
    }
  }, [])

  // Handle open/close state changes
  React.useEffect(() => {
    if (!timelineRef.current) return

    if (isOpen) {
      timelineRef.current.play()
    } else {
      timelineRef.current.reverse()
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed bottom-4 left-4 z-50 h-[calc(100%-2rem)] w-full max-w-md bg-white flex flex-col shadow-2xl',
          className
        )}
        style={{
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 0 2px #390000'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 bg-[#390000] border-b border-[#ffba94]/10"
          style={{ borderRadius: '24px 24px 0 0' }}
        >
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-[#f83a3a]" fill="#f83a3a" />
            <h2 className="text-lg font-semibold text-[#ffba94]">
              My Wishlist
            </h2>
            {itemCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-[#f83a3a] text-white rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="group p-2 text-[#ffba94] hover:text-white transition-colors"
            aria-label="Close wishlist"
          >
            <X size={20} className="group-hover:scale-110 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Filters & Sort - Elegant Design */}
        {!isEmpty && (
          <div className="px-6 py-4 bg-gradient-to-b from-white to-[#f9f9f9]/50">
            {/* Sort Bar */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm text-[#1a1a1a]/60">
                <span className="font-medium">
                  {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none text-sm pl-3 pr-8 py-2 border border-[#1a1a1a]/10 rounded-lg bg-white text-[#1a1a1a] hover:border-[#390000]/30 focus:outline-none focus:ring-2 focus:ring-[#390000]/20 focus:border-[#390000]/30 transition-all cursor-pointer"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="price-low">Price ↑</option>
                    <option value="price-high">Price ↓</option>
                    <option value="name-az">A → Z</option>
                    <option value="name-za">Z → A</option>
                  </select>
                  <ChevronDown 
                    size={14} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1a1a1a]/40 pointer-events-none"
                  />
                </div>

                {/* Filter Toggle Button */}
                {uniqueArtists.length > 0 && (
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      showFilters || artistFilter !== 'all'
                        ? 'bg-[#390000] text-[#ffba94] shadow-sm'
                        : 'bg-white border border-[#1a1a1a]/10 text-[#1a1a1a] hover:border-[#390000]/30'
                    )}
                  >
                    <SlidersHorizontal size={16} />
                    <span>Filter</span>
                    {artistFilter !== 'all' && (
                      <span className="ml-0.5 flex items-center justify-center w-4 h-4 bg-[#ffba94]/20 text-[#ffba94] text-xs rounded-full">
                        1
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Expandable Filter Panel */}
            {showFilters && uniqueArtists.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-[#1a1a1a]/5 animate-in slide-in-from-top-2 duration-200">
                {/* Artist Filter - Button Grid */}
                <div>
                  <label className="text-xs font-semibold text-[#1a1a1a]/70 uppercase tracking-wide mb-2 block">
                    Artist
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setArtistFilter('all')}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                        artistFilter === 'all'
                          ? 'bg-[#390000] text-[#ffba94] shadow-sm'
                          : 'bg-white border border-[#1a1a1a]/10 text-[#1a1a1a] hover:border-[#390000]/30 hover:bg-[#390000]/5'
                      )}
                    >
                      All <span className="ml-1 text-xs opacity-70">({items.length})</span>
                    </button>
                    {uniqueArtists.map(artist => {
                      const count = items.filter(item => item.artistName === artist).length
                      return (
                        <button
                          key={artist}
                          onClick={() => setArtistFilter(artist)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                            artistFilter === artist
                              ? 'bg-[#390000] text-[#ffba94] shadow-sm'
                              : 'bg-white border border-[#1a1a1a]/10 text-[#1a1a1a] hover:border-[#390000]/30 hover:bg-[#390000]/5'
                          )}
                        >
                          {artist} <span className="ml-1 text-xs opacity-70">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Clear All Filters */}
                {artistFilter !== 'all' && (
                  <button
                    onClick={() => setArtistFilter('all')}
                    className="flex items-center gap-1.5 text-xs text-[#390000] hover:text-[#390000]/80 font-medium transition-colors"
                  >
                    <X size={14} />
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Heart size={48} className="text-[#1a1a1a]/20 mb-4" />
              <p className="text-lg font-medium text-[#1a1a1a]">
                Your wishlist is empty
              </p>
              <p className="mt-1 text-sm text-[#1a1a1a]/60">
                Save items you love for later
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 bg-[#390000] text-[#ffba94] hover:bg-[#390000]/90 rounded-lg font-medium transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <SlidersHorizontal size={48} className="text-[#1a1a1a]/20 mb-4" />
              <p className="text-lg font-medium text-[#1a1a1a]">
                No items match your filters
              </p>
              <p className="mt-1 text-sm text-[#1a1a1a]/60">
                Try adjusting your filters
              </p>
              <button
                onClick={() => {
                  setArtistFilter('all')
                  setSortBy('newest')
                }}
                className="mt-6 px-6 py-2.5 bg-[#390000] text-[#ffba94] hover:bg-[#390000]/90 rounded-lg font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedItems.map((item, index) => (
                <WishlistItemCard
                  key={item.productId}
                  item={item}
                  index={index}
                  isOpen={isOpen}
                  onRemove={() => removeItem(item.productId)}
                  onAddToCart={onAddToCart ? () => onAddToCart(item.productId, item.variantId) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="border-t border-[#1a1a1a]/10 px-6 py-4 bg-white">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-[#390000] text-[#ffba94] hover:bg-[#390000]/90 rounded-lg font-semibold transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/**
 * WishlistItemCard - Individual wishlist item
 */
interface WishlistItemCardProps {
  item: WishlistItem
  index: number
  isOpen: boolean
  onRemove: () => void
  onAddToCart?: () => void
}

function WishlistItemCard({ item, index, isOpen, onRemove, onAddToCart }: WishlistItemCardProps) {
  return (
    <div
      className="wishlist-item group relative bg-white border border-[#1a1a1a]/10 rounded-lg p-3 hover:shadow-md transition-all duration-200"
      style={{
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0)' : 'translateY(15px)',
        transition: isOpen 
          ? `opacity 300ms ease-out ${index * 40 + 100}ms, transform 300ms ease-out ${index * 40 + 100}ms` 
          : 'opacity 150ms ease-out, transform 150ms ease-out',
      }}
    >
      <div className="flex gap-3">
        {/* Image */}
        <div 
          className="relative w-20 h-20 flex-shrink-0 bg-[#f5f5f5] rounded-lg overflow-hidden cursor-pointer"
          onClick={() => window.location.href = `/shop/${item.handle}`}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#1a1a1a]/20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 
              className="text-sm font-semibold text-[#1a1a1a] line-clamp-2 mb-1 cursor-pointer hover:text-[#390000] transition-colors"
              onClick={() => window.location.href = `/shop/${item.handle}`}
            >
              {item.title}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              {item.artistName && (
                <p className="text-xs text-[#1a1a1a]/60">{item.artistName}</p>
              )}
              {item.editionCount && (
                <>
                  {item.artistName && <span className="text-xs text-[#1a1a1a]/30">•</span>}
                  <p className="text-xs text-[#1a1a1a]/50 font-medium">
                    Edition {item.editionCount}
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Price and Add to Cart */}
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-[#1a1a1a]">
              ${item.price.toFixed(2)}
            </p>
            
            {/* Add to cart button - center + */}
            {onAddToCart && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('[WishlistDrawer] Add to cart clicked for:', item.title)
                  onAddToCart()
                }}
                className="text-[#f0c417] hover:text-[#f0c417]/80 hover:scale-125 transition-all duration-200"
                aria-label="Add to cart"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Added date and Remove button */}
      <div className="mt-2 pt-2 border-t border-[#1a1a1a]/5 flex items-center justify-between">
        <p className="text-xs text-[#1a1a1a]/40">
          Added {new Date(item.addedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
        
        {/* Remove button - small x */}
        <button
          onClick={onRemove}
          className="text-[#1a1a1a]/40 hover:text-[#f83a3a] transition-colors"
          aria-label="Remove from wishlist"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
