'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import type { CartItem } from '@/lib/shop/CartContext'

/**
 * NavCart - Cart preview panel with suggestions
 * 
 * Integrated cart view within NavigationModal.
 * Shows cart items, subtotal, and quick suggestions.
 */

export interface NavCartProps {
  items: CartItem[]
  subtotal: number
  total: number
  itemCount: number
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onCheckout: () => void
  onViewCart?: () => void
  loading?: boolean
  className?: string
}

export function NavCart({
  items,
  subtotal,
  total,
  itemCount,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onViewCart,
  loading = false,
  className,
}: NavCartProps) {
  const isEmpty = items.length === 0
  const freeShippingThreshold = 75
  const progressToFreeShipping = Math.min((subtotal / freeShippingThreshold) * 100, 100)
  const remainingForFreeShipping = Math.max(freeShippingThreshold - subtotal, 0)

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="text-[#1a1a1a]" size={20} />
          <h3 className="font-semibold text-lg text-[#1a1a1a]">
            Cart {itemCount > 0 && `(${itemCount})`}
          </h3>
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={onViewCart}
            className="text-sm text-[#2c4bce] hover:underline"
          >
            View Full Cart
          </button>
        )}
      </div>

      {/* Free Shipping Progress */}
      {!isEmpty && remainingForFreeShipping > 0 && (
        <div className="mb-4 p-3 bg-[#f5f5f5] rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#1a1a1a]/60">
              {remainingForFreeShipping > 0
                ? `$${remainingForFreeShipping.toFixed(2)} away from free shipping`
                : '🎉 You qualify for free shipping!'}
            </p>
            <span className="text-xs font-semibold text-[#2c4bce]">
              {Math.round(progressToFreeShipping)}%
            </span>
          </div>
          <div className="w-full h-2 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2c4bce] to-[#4c6bfe] transition-all duration-500"
              style={{ width: `${progressToFreeShipping}%` }}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f5f5f5] rounded-full mb-4">
            <ShoppingBag className="text-[#1a1a1a]/30" size={28} />
          </div>
          <h4 className="font-semibold text-[#1a1a1a] mb-1">Your cart is empty</h4>
          <p className="text-sm text-[#1a1a1a]/60">
            Start adding artworks to your collection
          </p>
        </div>
      )}

      {/* Cart Items */}
      {!isEmpty && (
        <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
          {items.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemoveItem}
            />
          ))}
        </div>
      )}

      {/* Subtotal & Checkout */}
      {!isEmpty && (
        <div className="border-t border-[#1a1a1a]/10 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#1a1a1a]/60">Subtotal</span>
            <span className="font-semibold text-lg text-[#1a1a1a]">
              ${subtotal.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={onCheckout}
            disabled={loading}
            className={cn(
              'w-full flex items-center justify-center gap-2',
              'py-3.5 px-6 rounded-xl',
              'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white',
              'font-semibold text-base',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Checkout
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="text-xs text-center text-[#1a1a1a]/40">
            Taxes and shipping calculated at checkout
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * CartItemCard Component
 */
interface CartItemCardProps {
  item: CartItem
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  return (
    <div className="flex gap-3 p-3 bg-white rounded-xl border border-[#1a1a1a]/5 hover:border-[#1a1a1a]/10 transition-colors">
      {/* Image */}
      <Link
        href={`/shop/${item.handle}`}
        className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-[#f5f5f5]"
      >
        {item.image && (
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/shop/${item.handle}`}
          className="block"
        >
          {item.artistName && (
            <p className="text-xs text-[#1a1a1a]/50 uppercase tracking-wider">
              {item.artistName}
            </p>
          )}
          <h4 className="text-sm font-medium text-[#1a1a1a] line-clamp-1 hover:underline">
            {item.title}
          </h4>
          {item.variantTitle && item.variantTitle !== 'Default Title' && (
            <p className="text-xs text-[#1a1a1a]/50">{item.variantTitle}</p>
          )}
        </Link>

        {/* Quantity & Price */}
        <div className="flex items-center justify-between mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              className="p-1 hover:bg-[#f5f5f5] rounded transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={14} className="text-[#1a1a1a]/60" />
            </button>
            <span className="text-sm font-medium text-[#1a1a1a] min-w-[24px] text-center">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateQuantity(
                  item.id,
                  Math.min(item.maxQuantity || 99, item.quantity + 1)
                )
              }
              disabled={item.maxQuantity ? item.quantity >= item.maxQuantity : false}
              className="p-1 hover:bg-[#f5f5f5] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              <Plus size={14} className="text-[#1a1a1a]/60" />
            </button>
          </div>

          {/* Price & Remove */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#1a1a1a]">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="p-1 hover:bg-red-50 rounded transition-colors"
              aria-label="Remove item"
            >
              <Trash2 size={14} className="text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
