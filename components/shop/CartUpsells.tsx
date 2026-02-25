'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import gsap from 'gsap'

/**
 * Cart Upsells Component — Enhanced (Track B2)
 * 
 * Show personalized product recommendations in the cart drawer.
 * - "Complete the series" suggestions when cart items belong to a series
 * - "You might also like" general recommendations
 * - Frequently bought together (future)
 */

export interface UpsellProduct {
  id: string
  handle: string
  title: string
  price: string
  image?: string
  artistName?: string
  /** If this product is a series completion suggestion */
  seriesName?: string
  seriesId?: string
}

export interface CartUpsellsProps {
  cartItems: Array<{ productId: string; handle: string }>
  onAddToCart?: (product: UpsellProduct) => void
  className?: string
}

export function CartUpsells({ cartItems, onAddToCart, className }: CartUpsellsProps) {
  const [seriesUpsells, setSeriesUpsells] = React.useState<UpsellProduct[]>([])
  const [generalRecommendations, setGeneralRecommendations] = React.useState<UpsellProduct[]>([])
  const [loading, setLoading] = React.useState(true)
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true)
        
        const handles = cartItems.map(item => item.handle)
        
        // Fetch series completion suggestions and general recommendations in parallel
        const [seriesResult, generalResult] = await Promise.all([
          fetchSeriesCompletionSuggestions(handles),
          fetchGeneralRecommendations(handles),
        ])
        
        setSeriesUpsells(seriesResult)
        setGeneralRecommendations(generalResult)
      } catch (error) {
        console.error('Failed to fetch cart recommendations:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (cartItems.length > 0) {
      fetchRecommendations()
    } else {
      setSeriesUpsells([])
      setGeneralRecommendations([])
      setLoading(false)
    }
  }, [cartItems])
  
  React.useEffect(() => {
    const allRecs = [...seriesUpsells, ...generalRecommendations]
    if (!loading && allRecs.length > 0 && containerRef.current) {
      const cards = containerRef.current.querySelectorAll('[data-upsell-card]')
      gsap.from(cards, {
        opacity: 0,
        y: 20,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out',
      })
    }
  }, [loading, seriesUpsells, generalRecommendations])
  
  if (loading || (seriesUpsells.length === 0 && generalRecommendations.length === 0)) {
    return null
  }
  
  return (
    <div ref={containerRef} className={cn('space-y-5', className)}>
      {/* Series Completion Suggestions */}
      {seriesUpsells.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2c4bce" strokeWidth="2" className="flex-shrink-0">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <h3 className="text-sm font-semibold text-[#2c4bce] uppercase tracking-wide">
              Complete the Series
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {seriesUpsells.slice(0, 2).map((product) => (
              <UpsellCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                variant="series"
              />
            ))}
          </div>
        </div>
      )}

      {/* General Recommendations */}
      {generalRecommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide">
            You might also like
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {generalRecommendations.slice(0, 2).map((product) => (
              <UpsellCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                variant="general"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Fetch series completion suggestions based on cart items.
 * If a cart item belongs to a series, suggest other items from the same series
 * that the collector doesn't own yet.
 */
async function fetchSeriesCompletionSuggestions(
  cartHandles: string[]
): Promise<UpsellProduct[]> {
  try {
    const response = await fetch('/api/shop/cart/series-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handles: cartHandles }),
    })
    
    if (!response.ok) return []
    
    const data = await response.json()
    return (data.suggestions || []).map((s: any) => ({
      id: s.id || s.shopify_product_id,
      handle: s.handle,
      title: s.title,
      price: s.price ? `$${parseFloat(s.price).toFixed(2)}` : 'Price TBA',
      image: s.image_url || s.image,
      artistName: s.vendor_name || s.artistName,
      seriesName: s.series_name,
      seriesId: s.series_id,
    }))
  } catch {
    return []
  }
}

/**
 * Fetch general product recommendations
 */
async function fetchGeneralRecommendations(
  cartHandles: string[]
): Promise<UpsellProduct[]> {
  try {
    const response = await fetch(`/api/shop/products?limit=4&exclude=${cartHandles.join(',')}`)
    
    if (!response.ok) return []
    
    const data = await response.json()
    return (data.products || []).map((p: any) => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      price: `$${parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2)}`,
      image: p.featuredImage?.url,
      artistName: p.vendor,
    }))
  } catch {
    return []
  }
}

interface UpsellCardProps {
  product: UpsellProduct
  onAddToCart?: (product: UpsellProduct) => void
  variant?: 'series' | 'general'
}

function UpsellCard({ product, onAddToCart, variant = 'general' }: UpsellCardProps) {
  const [isAdding, setIsAdding] = React.useState(false)
  const cardRef = React.useRef<HTMLDivElement>(null)
  
  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isAdding) return
    
    setIsAdding(true)
    
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
      })
    }
    
    await onAddToCart?.(product)
    
    setTimeout(() => {
      setIsAdding(false)
    }, 500)
  }
  
  return (
    <Link href={`/shop/${product.handle}`}>
      <div
        ref={cardRef}
        data-upsell-card
        className={cn(
          'group relative overflow-hidden rounded-lg bg-[#f5f5f5]',
          'hover:shadow-md transition-shadow duration-200',
          'cursor-pointer',
          variant === 'series' && 'ring-1 ring-[#2c4bce]/20'
        )}
      >
        {/* Series badge */}
        {variant === 'series' && product.seriesName && (
          <div className="absolute top-2 left-2 z-10">
            <span className="text-[10px] font-medium text-white bg-[#2c4bce] px-2 py-0.5 rounded-full">
              {product.seriesName}
            </span>
          </div>
        )}

        {/* Image */}
        <div className="aspect-square overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#f5f5f5]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#1a1a1a]/20">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-2 space-y-1">
          <p className="text-xs text-[#1a1a1a]/60 uppercase tracking-wide">
            {product.artistName}
          </p>
          <h4 className="text-sm font-medium text-[#1a1a1a] line-clamp-1">
            {product.title}
          </h4>
          <p className="text-sm font-semibold text-[#1a1a1a]">
            {product.price}
          </p>
        </div>
        
        {/* Quick add button */}
        {onAddToCart && (
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className={cn(
              'absolute bottom-2 left-2 right-2',
              'py-1.5 px-3 rounded-full',
              'text-xs font-semibold',
              'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-1',
              variant === 'series'
                ? 'bg-[#2c4bce] text-white hover:bg-[#1a3ab0]'
                : 'bg-[#f0c417] text-[#1a1a1a] hover:bg-[#e0b415]'
            )}
          >
            {isAdding ? (
              <>
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              variant === 'series' ? '+ Complete Series' : '+ Add'
            )}
          </button>
        )}
      </div>
    </Link>
  )
}

// Free shipping progress bar
export interface FreeShippingBarProps {
  currentTotal: number
  threshold?: number
  className?: string
}

export function FreeShippingBar({ currentTotal, threshold = 75, className }: FreeShippingBarProps) {
  const remaining = Math.max(0, threshold - currentTotal)
  const progress = Math.min(100, (currentTotal / threshold) * 100)
  const isComplete = currentTotal >= threshold
  
  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress bar */}
      <div className="h-2 bg-[#1a1a1a]/10 rounded-full overflow-hidden">
        <div 
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isComplete
              ? 'bg-gradient-to-r from-[#0a8754] to-[#0f9d61]'
              : 'bg-gradient-to-r from-[#f0c417] to-[#e0b415]'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Message */}
      <div className="flex items-center gap-2 text-sm">
        {isComplete ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#0a8754] flex-shrink-0">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[#0a8754] font-medium">
              You&apos;ve unlocked free shipping!
            </span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#1a1a1a]/60 flex-shrink-0">
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="21" r="1" fill="currentColor" />
              <circle cx="20" cy="21" r="1" fill="currentColor" />
            </svg>
            <span className="text-[#1a1a1a]/60">
              Add <span className="font-semibold text-[#1a1a1a]">${remaining.toFixed(2)}</span> more for free shipping
            </span>
          </>
        )}
      </div>
    </div>
  )
}
