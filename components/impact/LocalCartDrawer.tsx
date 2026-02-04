'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { useSmoothDrawer } from '@/lib/animations/navigation-animations'
import type { CartItem } from '@/lib/shop/CartContext'

/**
 * Local Cart Drawer
 * 
 * Works with CartContext for local cart state (not Shopify API).
 * Smooth GSAP animations with card-style layout.
 */

export interface LocalCartDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onCheckout: () => void
  subtotal: number
  total: number
  className?: string
}

const LocalCartDrawer = React.forwardRef<HTMLDivElement, LocalCartDrawerProps>(
  (
    {
      isOpen,
      onClose,
      items,
      onUpdateQuantity,
      onRemoveItem,
      onCheckout,
      subtotal,
      total,
      className,
    },
    ref
  ) => {
    const [isClient, setIsClient] = React.useState(false)
    const [shouldRender, setShouldRender] = React.useState(false)
    const drawerRef = React.useRef<HTMLDivElement>(null)
    const backdropRef = React.useRef<HTMLDivElement>(null)

    // GSAP smooth drawer animations
    const { openDrawer, closeDrawer } = useSmoothDrawer(drawerRef, backdropRef)

    // Client-side only flag
    React.useEffect(() => {
      setIsClient(true)
    }, [])

    // Control rendering
    React.useEffect(() => {
      if (isOpen) {
        setShouldRender(true)
      } else {
        const timer = setTimeout(() => setShouldRender(false), 300)
        return () => clearTimeout(timer)
      }
    }, [isOpen])

    // Trigger GSAP animation
    React.useEffect(() => {
      if (!isClient) return
      if (isOpen) {
        openDrawer()
      } else {
        closeDrawer()
      }
    }, [isOpen, isClient, openDrawer, closeDrawer])

    // Close on escape key
    React.useEffect(() => {
      if (!isClient) return
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose()
        }
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isClient, isOpen, onClose])

    // Prevent scroll when open
    React.useEffect(() => {
      if (!isClient) return
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [isClient, isOpen])

    const isEmpty = items.length === 0

    if (!isClient || !shouldRender) {
      return null
    }

    return (
      <>
        {/* Backdrop */}
        <div
          ref={backdropRef}
          className={cn(
            'fixed inset-0 z-40 bg-black/50',
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={onClose}
          aria-hidden="true"
          style={{
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
        />

        {/* Drawer - GSAP-powered card animations */}
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
            'fixed bottom-4 right-4 z-50 h-[calc(100%-2rem)] w-full max-w-md',
            'bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl',
            'border border-[#1a1a1a]/10',
            className
          )}
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            transform: isOpen ? 'translateX(0)' : 'translateX(calc(100% + 1rem))',
          }}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]/10">
              <h2 className="font-heading text-xl font-semibold text-[#1a1a1a]">
                Your Cart
                {items.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-[#1a1a1a]/60">
                    ({items.length} {items.length === 1 ? 'item' : 'items'})
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
              {isEmpty ? (
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
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        opacity: isOpen ? 1 : 0,
                        transition: isOpen ? `opacity 200ms ease-out ${index * 30}ms` : 'opacity 150ms ease-out',
                      }}
                    >
                      <CartLineItem
                        item={item}
                        onUpdateQuantity={onUpdateQuantity}
                        onRemove={onRemoveItem}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!isEmpty && (
              <div className="border-t border-[#1a1a1a]/10 px-6 py-4 space-y-4">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-[#1a1a1a]/60">Subtotal</span>
                  <span className="text-lg font-semibold text-[#1a1a1a]">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-[#1a1a1a]/10 pt-4">
                  <span className="text-lg font-semibold text-[#1a1a1a]">Total</span>
                  <span className="text-lg font-bold text-[#1a1a1a]">
                    ${total.toFixed(2)}
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
LocalCartDrawer.displayName = 'LocalCartDrawer'

/**
 * Cart Line Item Component
 */
interface CartLineItemProps {
  item: CartItem
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

function CartLineItem({ item, onUpdateQuantity, onRemove }: CartLineItemProps) {
  return (
    <div className="flex gap-4">
      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-[12px] bg-[#f5f5f5]">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
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
          {item.title}
        </h3>
        {item.variantTitle && (
          <p className="text-sm text-[#1a1a1a]/60 mt-0.5">
            {item.variantTitle}
          </p>
        )}
        <p className="text-sm font-semibold text-[#1a1a1a] mt-1">
          ${item.price.toFixed(2)}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
            disabled={item.quantity <= 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#1a1a1a]/20 hover:border-[#1a1a1a]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrease quantity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 6H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#1a1a1a]/20 hover:border-[#1a1a1a]/40 transition-colors"
            aria-label="Increase quantity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 6H9M6 3V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="ml-auto p-1.5 text-[#1a1a1a]/40 hover:text-[#f83a3a] transition-colors"
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

export { LocalCartDrawer }
