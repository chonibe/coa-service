'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

/**
 * Add to Cart Floating Component
 * 
 * Desktop: Floating card on the right side
 * Mobile: Fixed bar at bottom of screen
 */

export interface AddToCartFloatingProps {
  isVisible?: boolean
  productTitle?: string
  price?: string
  selectedVariant?: {
    id: string
    title: string
  }
  quantity?: number
  onQuantityChange?: (quantity: number) => void
  onAddToCart?: () => Promise<void>
  loading?: boolean
  className?: string
}

const AddToCartFloating = React.forwardRef<HTMLDivElement, AddToCartFloatingProps>(
  (
    {
      isVisible = true,
      productTitle,
      price,
      selectedVariant,
      quantity = 1,
      onQuantityChange,
      onAddToCart,
      loading = false,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false)

    if (!isVisible) return null

    return (
      <>
        {/* Desktop Floating Card */}
        <div
          ref={ref}
          className={cn(
            'hidden lg:block fixed bottom-6 right-6 z-40',
            'w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl',
            'border border-[#1a1a1a]/10 p-6',
            'transition-all duration-300 ease-out',
            isOpen ? 'opacity-100 scale-100' : 'opacity-100 scale-100',
            className
          )}
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          {/* Product Info */}
          {productTitle && (
            <div className="mb-4 pb-4 border-b border-[#1a1a1a]/10">
              <h3 className="font-semibold text-[#1a1a1a] line-clamp-2">
                {productTitle}
              </h3>
              {selectedVariant && (
                <p className="text-xs text-[#1a1a1a]/60 mt-1">
                  {selectedVariant.title}
                </p>
              )}
              {price && (
                <p className="text-lg font-bold text-[#1a1a1a] mt-2">
                  {price}
                </p>
              )}
            </div>
          )}

          {/* Quantity Controls */}
          {onQuantityChange && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-[#1a1a1a]/60">Qty:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || loading}
                  className="w-7 h-7 flex items-center justify-center rounded border border-[#1a1a1a]/20 hover:border-[#1a1a1a]/40 disabled:opacity-30 transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onQuantityChange(quantity + 1)}
                  disabled={loading}
                  className="w-7 h-7 flex items-center justify-center rounded border border-[#1a1a1a]/20 hover:border-[#1a1a1a]/40 disabled:opacity-30 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onAddToCart}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Adding...' : 'Add to Cart'}
          </Button>
        </div>

        {/* Mobile Fixed Bar */}
        <div
          className={cn(
            'lg:hidden fixed bottom-0 left-0 right-0 z-40',
            'bg-white/95 backdrop-blur-xl border-t border-[#1a1a1a]/10',
            'px-4 py-4 transition-all duration-300 ease-out'
          )}
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Quantity Controls */}
            {onQuantityChange && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || loading}
                  className="w-8 h-8 flex items-center justify-center rounded border border-[#1a1a1a]/20 hover:border-[#1a1a1a]/40 disabled:opacity-30 transition-colors text-sm"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-medium">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onQuantityChange(quantity + 1)}
                  disabled={loading}
                  className="w-8 h-8 flex items-center justify-center rounded border border-[#1a1a1a]/20 hover:border-[#1a1a1a]/40 disabled:opacity-30 transition-colors text-sm"
                >
                  +
                </button>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              variant="primary"
              onClick={onAddToCart}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </>
    )
  }
)
AddToCartFloating.displayName = 'AddToCartFloating'

export { AddToCartFloating }
