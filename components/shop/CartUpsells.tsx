'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import gsap from 'gsap'

/**
 * Cart Upsells Component
 * 
 * Show personalized product recommendations in the cart drawer.
 * - "Complete your collection" suggestions
 * - Frequently bought together
 * - You might also like
 */

export interface UpsellProduct {
  id: string
  handle: string
  title: string
  price: string
  image?: string
  artistName?: string
}

export interface CartUpsellsProps {
  cartItems: Array<{ productId: string; handle: string }>
  onAddToCart?: (product: UpsellProduct) => void
  className?: string
}

export function CartUpsells({ cartItems, onAddToCart, className }: CartUpsellsProps) {
  const [recommendations, setRecommendations] = React.useState<UpsellProduct[]>([])
  const [loading, setLoading] = React.useState(true)
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    // Fetch recommendations based on cart contents
    async function fetchRecommendations() {
      try {
        setLoading(true)
        
        // In production, this would call an API endpoint that uses ML/AI
        // For now, fetch some random products excluding what's in cart
        const handles = cartItems.map(item => item.handle)
        const response = await fetch(`/api/shop/products?limit=4&exclude=${handles.join(',')}`)
        
        if (response.ok) {
          const data = await response.json()
          const products: UpsellProduct[] = (data.products || []).map((p: any) => ({
            id: p.id,
            handle: p.handle,
            title: p.title,
            price: `$${parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2)}`,
            image: p.featuredImage?.url,
            artistName: p.vendor,
          }))
          setRecommendations(products)
        }
      } catch (error) {
        console.error('Failed to fetch cart recommendations:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (cartItems.length > 0) {
      fetchRecommendations()
    }
  }, [cartItems])
  
  React.useEffect(() => {
    if (!loading && recommendations.length > 0 && containerRef.current) {
      // Animate in recommendations with stagger
      const cards = containerRef.current.querySelectorAll('[data-upsell-card]')
      gsap.from(cards, {
        opacity: 0,
        y: 20,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out',
      })
    }
  }, [loading, recommendations])
  
  if (loading || recommendations.length === 0) {
    return null
  }
  
  return (
    <div ref={containerRef} className={cn('space-y-3', className)}>
      <h3 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide">
        You might also like
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {recommendations.slice(0, 2).map((product) => (
          <UpsellCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  )
}

interface UpsellCardProps {
  product: UpsellProduct
  onAddToCart?: (product: UpsellProduct) => void
}

function UpsellCard({ product, onAddToCart }: UpsellCardProps) {
  const [isAdding, setIsAdding] = React.useState(false)
  const cardRef = React.useRef<HTMLDivElement>(null)
  
  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isAdding) return
    
    setIsAdding(true)
    
    // Animate the card
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
      })
    }
    
    // Call the add to cart handler
    await onAddToCart?.(product)
    
    // Brief delay for feedback
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
          'cursor-pointer'
        )}
      >
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
              'bg-[#f0c417] text-[#1a1a1a] text-xs font-semibold',
              'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0',
              'transition-all duration-200',
              'hover:bg-[#e0b415]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-1'
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
              '+ Add'
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
              You've unlocked free shipping!
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
