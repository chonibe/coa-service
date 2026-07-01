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
    if (!isVisible) return null

    return (
      <>
        {/* Desktop Floating Card */}
        <div
          ref={ref}
          className={cn(
            'hidden lg:block fixed bottom-6 left-6 z-40',
            'w-80 bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl',
            'border border-border p-6',
            'opacity-100 scale-100 transition-all duration-300 ease-out',
            className
          )}
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          {/* Product Info */}
          {productTitle && (
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-semibold line-clamp-2 text-foreground">
                {productTitle}
              </h3>
              {selectedVariant && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedVariant.title}
                </p>
              )}
              {price && (
                <p className="mt-2 text-lg font-bold text-foreground">
                  {price}
                </p>
              )}
            </div>
          )}

          {/* Quantity Controls */}
          {onQuantityChange && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-muted-foreground">Qty:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || loading}
                  className="flex items-center justify-center w-7 h-7 transition-colors border rounded border-border text-foreground hover:border-foreground/40 disabled:opacity-30"
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
                  className="flex items-center justify-center w-7 h-7 transition-colors border rounded border-border text-foreground hover:border-foreground/40 disabled:opacity-30"
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
            'bg-background/95 backdrop-blur-xl border-t border-border',
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
                  className="flex items-center justify-center w-8 h-8 text-sm transition-colors border rounded border-border text-foreground hover:border-foreground/40 disabled:opacity-30"
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
                  className="flex items-center justify-center w-8 h-8 text-sm transition-colors border rounded border-border text-foreground hover:border-foreground/40 disabled:opacity-30"
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
