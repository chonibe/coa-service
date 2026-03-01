'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, ChevronUp, ChevronLeft, Tag } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import { useExperienceOpenOrder } from '../ExperienceOrderContext'
import { CheckoutProvider, useCheckout, type CheckoutStep } from '@/lib/shop/CheckoutContext'
import { InlineAddressForm } from '@/components/shop/checkout/InlineAddressForm'
import { PaymentStep } from '@/components/shop/checkout/PaymentStep'

interface OrderBarProps {
  lamp: ShopifyProduct
  selectedArtworks: ShopifyProduct[]
  lampQuantity: number
  onLampQuantityChange: (qty: number) => void
  onRemoveArtwork: (id: string) => void
  onSelectArtwork?: (product: ShopifyProduct) => void
  onViewLampDetail?: (product: ShopifyProduct) => void
  isGift: boolean
}

export interface OrderBarRef {
  testZeroOrder: () => Promise<void>
}

function parsePrice(product: ShopifyProduct): number {
  const amount = product.priceRange?.minVariantPrice?.amount
  return amount ? parseFloat(amount) : 0
}

function getVariantId(product: ShopifyProduct): string {
  const gid = product.variants?.edges?.[0]?.node?.id ?? ''
  return gid.replace('gid://shopify/ProductVariant/', '')
}

const STEP_LABELS: Record<CheckoutStep, string> = {
  cart: 'Cart',
  shipping: 'Shipping',
  payment: 'Payment',
}

const STEPS: CheckoutStep[] = ['cart', 'shipping', 'payment']

function StepIndicator({ current }: { current: CheckoutStep }) {
  const currentIdx = STEPS.indexOf(current)
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          <div
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === currentIdx ? 'w-6 bg-neutral-900' : i < currentIdx ? 'w-1.5 bg-neutral-400' : 'w-1.5 bg-neutral-200'
            )}
          />
        </div>
      ))}
    </div>
  )
}

function AnimatedPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const from = prev.current
    const to = value
    prev.current = value
    if (from === to) return

    const duration = 300
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])

  return <span className="tabular-nums">${display.toFixed(2)}</span>
}

const ARTWORKS_PER_FREE_LAMP = 14
const DISCOUNT_PER_ARTWORK = 7.5

const OrderBarInner = forwardRef<OrderBarRef, OrderBarProps>(function OrderBarInner({
  lamp,
  selectedArtworks,
  lampQuantity,
  onLampQuantityChange,
  onRemoveArtwork,
  onSelectArtwork,
  _onViewLampDetail,
  isGift,
}, ref) {
  const [error, setError] = useState<string | null>(null)
  const [giftNote, setGiftNote] = useState('')
  const [showGiftNote, setShowGiftNote] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const checkout = useCheckout()
  const step = checkout.step

  useExperienceOpenOrder(() => {
    setDrawerOpen(true)
  })

  const lampPrice = parsePrice(lamp)
  const artworkCount = selectedArtworks.length
  const includeLamp = lampQuantity > 0

  const lampPrices = React.useMemo(() => {
    const prices: number[] = []
    for (let k = 1; k <= lampQuantity; k++) {
      const start = (k - 1) * ARTWORKS_PER_FREE_LAMP
      const end = k * ARTWORKS_PER_FREE_LAMP
      const allocated = Math.max(0, Math.min(artworkCount, end) - start)
      const discountPct = Math.min(allocated * DISCOUNT_PER_ARTWORK, 100)
      prices.push(lampPrice * Math.max(0, 1 - discountPct / 100))
    }
    return prices
  }, [lampQuantity, artworkCount, lampPrice])

  const lampTotal = lampPrices.reduce((a, b) => a + b, 0)
  const lampSavings = lampQuantity > 0 ? lampQuantity * lampPrice - lampTotal : 0
  const artworksTotal = selectedArtworks.reduce((sum, p) => sum + parsePrice(p), 0)
  const total = lampTotal + artworksTotal
  const allAvailable = selectedArtworks.every((p) => p.availableForSale)
  const itemCount = selectedArtworks.length + lampQuantity

  const buildLineItems = useCallback(() => {
    const items: Array<{
      productId: string
      variantId: string
      variantGid: string
      handle: string
      title: string
      price: number
      quantity: number
      image?: string
    }> = []

    if (lampQuantity > 0) {
      for (const price of lampPrices) {
        items.push({
          productId: lamp.id.replace('gid://shopify/Product/', ''),
          variantId: getVariantId(lamp),
          variantGid: lamp.variants?.edges?.[0]?.node?.id ?? '',
          handle: lamp.handle,
          title: lamp.title,
          price,
          quantity: 1,
          image: lamp.featuredImage?.url ?? undefined,
        })
      }
    }

    for (const art of selectedArtworks) {
      if (!art.availableForSale) continue
      items.push({
        productId: art.id.replace('gid://shopify/Product/', ''),
        variantId: getVariantId(art),
        variantGid: art.variants?.edges?.[0]?.node?.id ?? '',
        handle: art.handle,
        title: art.title,
        price: parsePrice(art),
        quantity: 1,
        image: art.featuredImage?.url ?? undefined,
      })
    }
    return items
  }, [lamp, lampQuantity, lampPrices, selectedArtworks])

  const handleTestZeroOrder = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            productId: lamp.id.replace('gid://shopify/Product/', ''),
            variantId: getVariantId(lamp),
            variantGid: lamp.variants?.edges?.[0]?.node?.id ?? '',
            handle: lamp.handle,
            title: `${lamp.title} (Test $0)`,
            price: 0,
            quantity: 1,
            image: lamp.featuredImage?.url ?? undefined,
          }],
          cancelUrl: typeof window !== 'undefined' ? `${window.location.origin}/shop/experience` : undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout')
      if (data.type === 'zero_dollar' || data.type === 'credit_only') {
        window.location.href = data.completeUrl
        return
      }
      if (data.url) window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }, [lamp])

  useImperativeHandle(ref, () => ({ testZeroOrder: handleTestZeroOrder }), [handleTestZeroOrder])

  const handleContinueToShipping = () => {
    if (itemCount === 0 || !allAvailable) return
    checkout.goToShipping()
  }

  const handleAddressDone = (addr: typeof checkout.address) => {
    checkout.setAddress(addr)
    checkout.goToPayment()
  }

  const handlePaymentSuccess = (redirectUrl: string) => {
    window.location.href = redirectUrl
  }

  const handleClose = () => {
    setDrawerOpen(false)
    setTimeout(() => checkout.goToCart(), 350)
  }

  const stepTitle = STEP_LABELS[step]

  const cartStepContent = (
    <div className="space-y-0 min-w-0 overflow-x-hidden">
      {/* Lamp row */}
      <div className="min-w-0 pb-3 transition-opacity duration-200">
        <div className="flex items-center gap-3 min-h-[44px]">
          <div className={cn('flex items-center gap-3 flex-1 min-w-0', lampQuantity === 0 && 'opacity-50')}>
            <span className="flex-1 min-w-0 text-sm font-medium text-neutral-950 truncate">{lamp.title}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {lampQuantity > 0 && lampSavings > 0 && (
                <span className="text-xs text-neutral-500 line-through tabular-nums">${(lampQuantity * lampPrice).toFixed(2)}</span>
              )}
              <span className={cn(
                'text-sm tabular-nums',
                lampQuantity === 0 && 'text-neutral-500',
                lampQuantity > 0 && lampSavings > 0 && 'text-green-700 font-medium'
              )}>
                {lampQuantity > 0
                  ? lampTotal === 0
                    ? 'FREE'
                    : `$${lampTotal.toFixed(2)}${lampQuantity > 1 ? ' total' : ''}`
                  : `$${lampPrice.toFixed(2)}`}
              </span>
            </div>
          </div>
          {lampQuantity === 0 ? (
            <button
              type="button"
              onClick={() => onLampQuantityChange(1)}
              className="w-6 h-5 text-center text-[10px] font-medium rounded bg-neutral-900 text-white hover:bg-neutral-800 transition-colors flex-shrink-0"
              aria-label="Add lamp"
            >
              Add
            </button>
          ) : (
            <div
              className="w-10 h-8 rounded border border-white/40 bg-white/60 backdrop-blur-xl backdrop-saturate-150 flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              style={{ backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
            >
              <input
                type="number"
                min={0}
                max={99}
                value={lampQuantity}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') { onLampQuantityChange(0); return }
                  const n = parseInt(v, 10)
                  if (!Number.isNaN(n)) onLampQuantityChange(Math.max(0, Math.min(99, n)))
                }}
                onBlur={(e) => {
                  const v = e.target.value
                  if (v === '' || Number.isNaN(parseInt(v, 10))) onLampQuantityChange(0)
                }}
                className="w-full h-full text-center text-sm font-medium tabular-nums bg-transparent text-neutral-900 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="Lamp quantity"
              />
            </div>
          )}
        </div>
        {includeLamp && artworkCount > 0 && lampSavings > 0 && (
          <div className="mt-0.5 flex items-center gap-2 rounded-lg border border-green-200/80 bg-green-50/50 px-3 py-2">
            <Tag className="w-4 h-4 shrink-0 text-green-700" />
            <span className="text-sm font-medium text-green-800">
              7.5% per artwork ({artworkCount} {artworkCount === 1 ? 'artwork' : 'artworks'}) · -${lampSavings.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Artwork rows */}
      <div className="max-h-[30vh] overflow-y-auto overflow-x-hidden space-y-1">
        <AnimatePresence>
          {selectedArtworks.map((art) => {
            const artPrice = parsePrice(art)
            const artImage = art.featuredImage?.url
            const isSoldOut = !art.availableForSale
            return (
              <motion.div
                key={art.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 44 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => onSelectArtwork?.(art)}
                className={cn(
                  'summary-item flex items-center gap-3 min-w-0 overflow-hidden py-1.5',
                  onSelectArtwork && 'cursor-pointer hover:bg-neutral-50 transition-colors -mx-2 px-2 rounded'
                )}
              >
                <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-neutral-200/80 ring-1 ring-neutral-200/80">
                  {artImage ? (
                    <Image src={artImage} alt={art.title} width={24} height={24} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-200" />
                  )}
                </div>
                <span className={cn('flex-1 min-w-0 text-sm font-medium text-neutral-950 truncate', isSoldOut && 'line-through text-neutral-500')}>
                  {art.title}
                </span>
                <span className="text-sm font-medium tabular-nums text-neutral-950">${artPrice.toFixed(2)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveArtwork(art.id) }}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors flex-shrink-0"
                  aria-label="Remove artwork"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Gift note */}
      {isGift && (
        <div className="mt-3">
          <button
            onClick={() => setShowGiftNote(!showGiftNote)}
            className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Add a gift note
            {showGiftNote ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {showGiftNote && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <textarea
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value.slice(0, 500))}
                  placeholder="Write a personal message..."
                  rows={3}
                  className="w-full mt-2 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400 resize-none"
                />
                <p className="text-[10px] text-neutral-600 text-right mt-0.5">{giftNote.length}/500</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Cart summary + continue */}
      <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4">
        {lampSavings > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Lamp discount</span>
            <span className="font-medium text-green-700">-${lampSavings.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Shipping</span>
          <span className="font-medium text-neutral-950">Free</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="font-semibold text-neutral-950">
            Total ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="text-lg font-bold text-neutral-950">
            <AnimatedPrice value={total} />
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-center text-xs text-red-500">{error}</p>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={handleContinueToShipping}
        disabled={itemCount === 0 || !allAvailable}
        className={cn(
          'mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors',
          itemCount === 0 || !allAvailable
            ? 'cursor-not-allowed bg-neutral-200 text-neutral-500'
            : 'bg-neutral-950 text-white hover:bg-neutral-800'
        )}
      >
        Continue to Shipping
      </motion.button>
    </div>
  )

  const shippingStepContent = (
    <div>
      <InlineAddressForm
        initialAddress={checkout.address}
        onSubmit={handleAddressDone}
        onBack={() => checkout.goToCart()}
      />
    </div>
  )

  const paymentStepContent = checkout.address ? (
    <PaymentStep
      items={buildLineItems()}
      subtotal={lampTotal + artworksTotal}
      discount={lampSavings}
      shipping={0}
      total={total}
      itemCount={itemCount}
      customerEmail={checkout.address.email}
      shippingAddress={{
        email: checkout.address.email,
        fullName: checkout.address.fullName,
        country: checkout.address.country,
        addressLine1: checkout.address.addressLine1,
        addressLine2: checkout.address.addressLine2,
        city: checkout.address.city,
        postalCode: checkout.address.postalCode,
        phoneNumber: checkout.address.phoneNumber,
      }}
      onBack={() => checkout.goToShipping()}
      onSuccess={handlePaymentSuccess}
      onError={(msg) => setError(msg)}
      renderTotal={(v) => <AnimatedPrice value={v} />}
    />
  ) : null

  return (
    <div className="fixed inset-0 pointer-events-none z-[90]" aria-hidden={!drawerOpen}>
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 pointer-events-auto z-[91] bg-black/30"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      <motion.div
        data-wizard-order-bar
        initial={false}
        animate={{ x: drawerOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="checkout-sheet right-drawer fixed top-0 right-0 bottom-0 z-[92] w-full max-w-sm bg-white shadow-2xl flex flex-col pointer-events-auto pr-[env(safe-area-inset-right,0px)]"
        style={{ width: 'min(calc(100vw - 2rem), 400px)' }}
      >
        {/* Header */}
        <div className="checkout-title flex-shrink-0 relative flex items-center px-4 py-3">
          {step !== 'cart' && (
            <button
              type="button"
              onClick={() => step === 'shipping' ? checkout.goToCart() : checkout.goToShipping()}
              className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors mr-1"
              aria-label="Go back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-neutral-950">{stepTitle}</h3>
            <StepIndicator current={step} />
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="CloseButton dark w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors ml-2"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content with step transitions */}
        <div className="checkout-content right-drawer flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 pt-2 pb-6">
            <AnimatePresence mode="wait">
              {step === 'cart' && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {cartStepContent}
                </motion.div>
              )}
              {step === 'shipping' && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {shippingStepContent}
                </motion.div>
              )}
              {step === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {paymentStepContent}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
})

export const OrderBar = forwardRef<OrderBarRef, OrderBarProps>(function OrderBar(props, ref) {
  return (
    <CheckoutProvider>
      <OrderBarInner {...props} ref={ref} />
    </CheckoutProvider>
  )
})
