'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/shopify/storefront-client'

/**
 * Sticky Buy Bar
 * 
 * Fixed bottom bar that appears when the main add-to-cart button scrolls out of view.
 * Shows product image, title, price, quantity, and add-to-cart button.
 */

interface StickyBuyBarProps {
  productTitle: string
  price: string
  compareAtPrice?: string
  image: string
  quantity: number
  onQuantityChange: (qty: number) => void
  onAddToCart: () => void
  disabled: boolean
  loading?: boolean
  targetElementId: string
}

export function StickyBuyBar({
  productTitle,
  price,
  compareAtPrice,
  image,
  quantity,
  onQuantityChange,
  onAddToCart,
  disabled,
  loading = false,
  targetElementId,
}: StickyBuyBarProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const targetElement = document.getElementById(targetElementId)
    if (!targetElement) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when main button is NOT in view
        setIsVisible(!entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '0px 0px -80px 0px', // Account for bottom padding
      }
    )

    observer.observe(targetElement)

    return () => observer.disconnect()
  }, [targetElementId])

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-white border-t border-[#1a1a1a]/10 shadow-xl',
        'transition-transform duration-300 ease-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-3 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Product Image - Mobile: 48px, Desktop: 60px */}
          <div className="w-12 h-12 sm:w-15 sm:h-15 flex-shrink-0 rounded-lg overflow-hidden bg-transparent">
            <img
              src={image}
              alt={productTitle}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[#1a1a1a] text-sm sm:text-base truncate">
              {productTitle}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                'text-sm sm:text-base font-semibold',
                compareAtPrice ? 'text-[#f83a3a]' : 'text-[#1a1a1a]'
              )}>
                {price}
              </span>
              {compareAtPrice && (
                <span className="text-xs sm:text-sm text-[#1a1a1a]/50 line-through">
                  {compareAtPrice}
                </span>
              )}
            </div>
          </div>

          {/* Quantity Selector - Hidden on very small mobile */}
          <div className="hidden xs:flex items-center border border-[#1a1a1a]/20 rounded-lg overflow-hidden flex-shrink-0">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-[#1a1a1a]/5 transition-colors touch-target"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span className="w-8 sm:w-10 text-center font-medium text-sm">{quantity}</span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-[#1a1a1a]/5 transition-colors touch-target"
              aria-label="Increase quantity"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 8H12M8 4V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Add to Cart Button - Touch-friendly 44px+ height */}
          <button
            onClick={onAddToCart}
            disabled={disabled || loading}
            className={cn(
              'px-4 sm:px-6 py-2.5 sm:py-3',
              'bg-[#f0c417] text-[#1a1a1a]',
              'font-semibold text-sm sm:text-base',
              'rounded-full',
              'hover:bg-[#e0b415] transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'whitespace-nowrap',
              'min-h-[44px]', // Ensures min 44px touch target
              'flex-shrink-0'
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="hidden sm:inline">Adding...</span>
              </span>
            ) : disabled ? (
              'Sold Out'
            ) : (
              <>
                <span className="hidden sm:inline">Add to cart</span>
                <span className="sm:hidden">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
