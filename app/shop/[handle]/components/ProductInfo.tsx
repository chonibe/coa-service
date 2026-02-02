'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/impact'

/**
 * Product Info Component
 * 
 * Features:
 * - Vendor link
 * - Product title (Fraunces font)
 * - Price with "Sale price" label
 * - Star rating with review count
 * - Edition number (for artworks)
 * - Quantity selector
 * - Add to Cart button (yellow)
 * - Buy with Shop Pay button (purple)
 * - More payment options link
 */

export interface ProductInfoProps {
  vendor?: string
  vendorHandle?: string
  title: string
  price: string
  compareAtPrice?: string
  rating?: number
  reviewCount?: number
  editionNumber?: number
  editionTotal?: number
  onAddToCart: (quantity: number) => void
  onBuyWithShopPay?: () => void
  isAddingToCart?: boolean
  className?: string
}

export function ProductInfo({
  vendor,
  vendorHandle,
  title,
  price,
  compareAtPrice,
  rating,
  reviewCount,
  editionNumber,
  editionTotal,
  onAddToCart,
  onBuyWithShopPay,
  isAddingToCart = false,
  className,
}: ProductInfoProps) {
  const [quantity, setQuantity] = React.useState(1)
  
  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(q => q - 1)
  }
  
  const incrementQuantity = () => {
    setQuantity(q => q + 1)
  }
  
  const handleAddToCart = () => {
    onAddToCart(quantity)
  }
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Vendor */}
      {vendor && (
        vendorHandle ? (
          <Link 
            href={`/shop?collection=${vendorHandle}`}
            className="text-sm text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors"
          >
            {vendor}
          </Link>
        ) : (
          <p className="text-sm text-[#1a1a1a]/60">{vendor}</p>
        )
      )}
      
      {/* Title */}
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">
        {title}
      </h1>
      
      {/* Price */}
      <div className="space-y-1">
        <p className="text-sm text-[#1a1a1a]/60">Sale price</p>
        <div className="flex items-center gap-3">
          <span className={cn(
            'text-2xl font-semibold',
            compareAtPrice ? 'text-[#f83a3a]' : 'text-[#1a1a1a]'
          )}>
            {price}
          </span>
          {compareAtPrice && (
            <span className="text-lg text-[#1a1a1a]/50 line-through">
              {compareAtPrice}
            </span>
          )}
        </div>
      </div>
      
      {/* Rating */}
      {rating !== undefined && reviewCount !== undefined && reviewCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={star <= Math.round(rating) ? '#1a1a1a' : 'none'}
                stroke="#1a1a1a"
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-[#1a1a1a]/60">
            {reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
          </span>
        </div>
      )}
      
      {/* Edition Number */}
      {editionNumber && editionTotal && (
        <p className="text-sm text-[#1a1a1a]/60">
          Edition #{editionNumber} of {editionTotal}
        </p>
      )}
      
      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="text-sm text-[#1a1a1a]/60">Quantity:</label>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-[#1a1a1a]/20 rounded-lg overflow-hidden">
            <button
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center text-[#1a1a1a] hover:bg-[#1a1a1a]/5 disabled:opacity-30 transition-colors"
              aria-label="Decrease quantity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <button
              onClick={incrementQuantity}
              className="w-10 h-10 flex items-center justify-center text-[#1a1a1a] hover:bg-[#1a1a1a]/5 transition-colors"
              aria-label="Increase quantity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className={cn(
            'w-full py-4 px-6',
            'bg-[#f0c417] text-[#1a1a1a]',
            'font-semibold text-base',
            'rounded-full',
            'hover:bg-[#e0b415] transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isAddingToCart ? 'Adding...' : 'Add to cart'}
        </button>
        
        {/* Buy with Shop Pay */}
        {onBuyWithShopPay && (
          <button
            onClick={onBuyWithShopPay}
            className={cn(
              'w-full py-4 px-6',
              'bg-[#5a31f4] text-white',
              'font-semibold text-base',
              'rounded-full',
              'hover:bg-[#4a21e4] transition-colors',
              'flex items-center justify-center gap-2'
            )}
          >
            Buy with{' '}
            <span className="font-bold italic">Shop</span>
            <span className="text-xs align-super">Pay</span>
          </button>
        )}
        
        {/* More payment options */}
        <button
          className="w-full text-center text-sm text-[#1a1a1a]/60 underline hover:text-[#1a1a1a] transition-colors"
        >
          More payment options
        </button>
      </div>
    </div>
  )
}

export default ProductInfo
