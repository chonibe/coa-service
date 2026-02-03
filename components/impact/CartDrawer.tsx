'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { formatPrice, type Cart, type CartLine } from '@/lib/shopify/storefront-client'
import { gsap, durations, customEases } from '@/lib/animations'
import { useGSAP } from '@gsap/react'

/**
 * Impact Theme Cart Drawer
 * 
 * Slide-out cart drawer with GSAP-powered animations:
 * - Orchestrated timeline: backdrop fade → drawer slide → items stagger
 * - Smooth spring physics for natural feel
 * - 60fps performance
 */

export interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart: Cart | null
  onUpdateQuantity: (lineId: string, quantity: number) => Promise<void>
  onRemoveItem: (lineId: string) => Promise<void>
  onCheckout: () => void
  loading?: boolean
  orderNotes?: string
  onOrderNotesChange?: (notes: string) => void
  promoCode?: string
  onPromoCodeChange?: (code: string) => void
  onApplyPromo?: () => void
  promoError?: string
}

const CartDrawer = React.forwardRef<HTMLDivElement, CartDrawerProps>(
  (
    {
      isOpen,
      onClose,
      cart,
      onUpdateQuantity,
      onRemoveItem,
      onCheckout,
      loading = false,
      orderNotes = '',
      onOrderNotesChange,
      promoCode = '',
      onPromoCodeChange,
      onApplyPromo,
      promoError,
    },
    ref
  ) => {
    const [updatingItems, setUpdatingItems] = React.useState<Set<string>>(new Set())
    const drawerRef = React.useRef<HTMLDivElement>(null)
    const backdropRef = React.useRef<HTMLDivElement>(null)
    const itemsRef = React.useRef<HTMLDivElement>(null)
    const timelineRef = React.useRef<gsap.core.Timeline | null>(null)

    // GSAP animation timeline
    useGSAP(() => {
      if (!drawerRef.current || !backdropRef.current) return

      const drawer = drawerRef.current
      const backdrop = backdropRef.current

      // Create the animation timeline
      timelineRef.current = gsap.timeline({ paused: true })
        // Backdrop fade in
        .fromTo(
          backdrop,
          { opacity: 0 },
          { opacity: 1, duration: 0.2, ease: 'power2.out' },
          0
        )
        // Drawer slide in
        .fromTo(
          drawer,
          { x: '100%' },
          { x: '0%', duration: durations.drawerOpen, ease: customEases.drawerSlide },
          0
        )

      // Set initial state
      gsap.set(drawer, { x: '100%' })
      gsap.set(backdrop, { opacity: 0 })

    }, { dependencies: [] })

    // Play/reverse timeline based on isOpen
    React.useEffect(() => {
      if (!timelineRef.current) return

      if (isOpen) {
        timelineRef.current.play()
        
        // Stagger animate cart items after drawer opens
        if (itemsRef.current) {
          const items = itemsRef.current.children
          gsap.fromTo(
            items,
            { opacity: 0, x: 20 },
            {
              opacity: 1,
              x: 0,
              duration: 0.3,
              ease: customEases.staggerReveal,
              stagger: durations.stagger,
              delay: durations.drawerOpen * 0.5,
            }
          )
        }
      } else {
        timelineRef.current.reverse()
      }
    }, [isOpen])

    // Handle quantity update
    const handleUpdateQuantity = async (lineId: string, quantity: number) => {
      setUpdatingItems((prev) => new Set(prev).add(lineId))
      try {
        await onUpdateQuantity(lineId, quantity)
      } finally {
        setUpdatingItems((prev) => {
          const next = new Set(prev)
          next.delete(lineId)
          return next
        })
      }
    }

    // Handle remove item
    const handleRemoveItem = async (lineId: string) => {
      setUpdatingItems((prev) => new Set(prev).add(lineId))
      try {
        await onRemoveItem(lineId)
      } finally {
        setUpdatingItems((prev) => {
          const next = new Set(prev)
          next.delete(lineId)
          return next
        })
      }
    }

    // Close on escape key
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
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [isOpen])

    const lines = cart?.lines.edges.map((edge) => edge.node) || []
    const isEmpty = lines.length === 0

    return (
      <>
        {/* Backdrop */}
        <div
          ref={backdropRef}
          className={cn(
            'fixed inset-0 z-40 bg-black/50',
            !isOpen && 'pointer-events-none'
          )}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer - Enhanced with GSAP animations and frosted glass */}
        <div
          ref={(node) => {
            drawerRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
          className={cn(
            'fixed top-0 right-0 z-50 h-full w-full max-w-md',
            'bg-white/95 backdrop-blur-xl shadow-2xl',
            'border-l border-[#1a1a1a]/10',
            'will-change-transform',
            !isOpen && 'pointer-events-none'
          )}
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]/10">
              <h2 className="font-heading text-xl font-semibold text-[#1a1a1a]">
                Your Cart
                {cart && cart.totalQuantity > 0 && (
                  <span className="ml-2 text-sm font-normal text-[#1a1a1a]/60">
                    ({cart.totalQuantity} {cart.totalQuantity === 1 ? 'item' : 'items'})
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors"
                aria-label="Close cart"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6L18 18M6 18L18 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-20 h-20 bg-[#f5f5f5] rounded-[12px]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[#f5f5f5] rounded w-3/4" />
                        <div className="h-4 bg-[#f5f5f5] rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isEmpty ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-[#1a1a1a]/20 mb-4"
                  >
                    <path
                      d="M5.5 10L3 21H21L18.5 10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 10V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <p className="text-lg font-medium text-[#1a1a1a]">
                    Your cart is empty
                  </p>
                  <p className="mt-1 text-sm text-[#1a1a1a]/60">
                    Add some artworks to get started
                  </p>
                  <Button
                    variant="primary"
                    className="mt-6"
                    onClick={onClose}
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div ref={itemsRef} className="space-y-4">
                  {lines.map((line) => (
                    <div key={line.id}>
                      <CartLineItem
                        line={line}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveItem}
                        updating={updatingItems.has(line.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!isEmpty && (
              <div className="border-t border-[#1a1a1a]/10 px-6 py-4 space-y-4">
                {/* Order Notes */}
                {onOrderNotesChange && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1a1a1a]">
                      Order notes (optional)
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => onOrderNotesChange(e.target.value)}
                      placeholder="Special instructions for your order..."
                      className="w-full px-3 py-2 text-sm border border-[#1a1a1a]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c4bce] resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-[#1a1a1a]/50 text-right">
                      {orderNotes.length}/500
                    </p>
                  </div>
                )}
                
                {/* Promo Code */}
                {onPromoCodeChange && onApplyPromo && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1a1a1a]">
                      Promo code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => onPromoCodeChange(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 text-sm border border-[#1a1a1a]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c4bce] focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={onApplyPromo}
                        className="px-4 py-2 text-sm font-medium text-[#2c4bce] border border-[#2c4bce]/30 hover:bg-[#2c4bce]/5 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Apply
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-xs text-[#f83a3a]">{promoError}</p>
                    )}
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-[#1a1a1a]/60">Subtotal</span>
                  <span className="text-lg font-semibold text-[#1a1a1a]">
                    {cart ? formatPrice(cart.cost.subtotalAmount) : '-'}
                  </span>
                </div>

                {/* Shipping note */}
                <p className="text-xs text-[#1a1a1a]/50">
                  Shipping and taxes calculated at checkout
                </p>

                {/* Checkout button */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={onCheckout}
                  disabled={loading}
                >
                  Checkout
                </Button>

                {/* Continue shopping */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full text-center text-sm text-[#2c4bce] hover:underline"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }
)
CartDrawer.displayName = 'CartDrawer'

/**
 * Cart Line Item Component
 */
interface CartLineItemProps {
  line: CartLine
  onUpdateQuantity: (lineId: string, quantity: number) => Promise<void>
  onRemove: (lineId: string) => Promise<void>
  updating?: boolean
}

function CartLineItem({ line, onUpdateQuantity, onRemove, updating }: CartLineItemProps) {
  const { merchandise, quantity } = line
  
  return (
    <div className={cn('flex gap-4', updating && 'opacity-50')}>
      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-[12px] bg-[#f5f5f5]">
        {merchandise.image ? (
          <img
            src={merchandise.image.url}
            alt={merchandise.image.altText || merchandise.product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#1a1a1a]/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[#1a1a1a] line-clamp-2">
          {merchandise.product.title}
        </h3>
        {merchandise.title !== 'Default Title' && (
          <p className="text-sm text-[#1a1a1a]/60 mt-0.5">
            {merchandise.title}
          </p>
        )}
        <p className="text-sm font-semibold text-[#1a1a1a] mt-1">
          {formatPrice(merchandise.price)}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => onUpdateQuantity(line.id, Math.max(0, quantity - 1))}
            disabled={updating || quantity <= 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#1a1a1a]/20 hover:border-[#1a1a1a]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrease quantity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 6H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(line.id, quantity + 1)}
            disabled={updating}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#1a1a1a]/20 hover:border-[#1a1a1a]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Increase quantity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 6H9M6 3V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(line.id)}
            disabled={updating}
            className="ml-auto p-1.5 text-[#1a1a1a]/40 hover:text-[#f83a3a] disabled:opacity-30 transition-colors"
            aria-label="Remove item"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4H14M5.333 4V2.667C5.333 2.298 5.632 2 6 2H10C10.368 2 10.667 2.298 10.667 2.667V4M12.667 4V13.333C12.667 13.702 12.368 14 12 14H4C3.632 14 3.333 13.702 3.333 13.333V4H12.667Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Mini Cart (for header)
 */
export interface MiniCartProps {
  count: number
  onClick: () => void
}

const MiniCart = React.forwardRef<HTMLButtonElement, MiniCartProps>(
  ({ count, onClick }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className="relative p-2 text-[#1a1a1a] hover:text-[#2c4bce] transition-colors"
        aria-label={`Cart with ${count} items`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5.5 10L3 21H21L18.5 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 10V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-[#f0c417] text-[#1a1a1a] rounded-full">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    )
  }
)
MiniCart.displayName = 'MiniCart'

export { CartDrawer, MiniCart }
