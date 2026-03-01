'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Tag, Home, CreditCard, Heart, ChevronRight, ExternalLink } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import { useExperienceOpenOrder } from '../ExperienceOrderContext'
import { CheckoutProvider, useCheckout } from '@/lib/shop/CheckoutContext'
import { storeCheckoutItems } from '@/lib/checkout/session-storage'
import { AddressModal } from '@/components/shop/checkout/AddressModal'
import { PromoCodeModal } from '@/components/shop/checkout/PromoCodeModal'
import { PaymentMethodsModal } from '@/components/shop/checkout/PaymentMethodsModal'
import { CheckoutButton } from '@/components/shop/checkout/CheckoutButton'

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
  isGift,
}, ref) {
  const [error, setError] = useState<string | null>(null)
  const [giftNote, setGiftNote] = useState('')
  const [showGiftNote, setShowGiftNote] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [promoModalOpen, setPromoModalOpen] = useState(false)
  const [promoApplied, setPromoApplied] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const checkout = useCheckout()

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

  const handleAddressSave = (addr: typeof checkout.address) => {
    checkout.setAddress(addr)
    setAddressModalOpen(false)
  }

  const handlePaymentSuccess = (redirectUrl: string) => {
    window.location.href = redirectUrl
  }

  const handleClose = () => {
    setDrawerOpen(false)
  }

  const hasAddress = checkout.isAddressComplete()
  const [paymentModalHasBeenOpened, setPaymentModalHasBeenOpened] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('google_pay')

  /* Auto-apply WELCOME10 for first-time users */
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const key = 'sc_welcome10_applied'
    if (!localStorage.getItem(key) && drawerOpen && !promoApplied) {
      setPromoApplied('WELCOME10')
      localStorage.setItem(key, '1')
    }
  }, [drawerOpen, promoApplied])

  const handlePaymentModalOpenChange = (open: boolean) => {
    if (open) setPaymentModalHasBeenOpened(true)
    setPaymentModalOpen(open)
  }

  const handlePlaceOrderClick = () => {
    if (!hasAddress) {
      setAddressModalOpen(true)
      return
    }
    if (!paymentModalHasBeenOpened) {
      setPaymentModalHasBeenOpened(true)
      setPaymentModalOpen(true)
      return
    }
    ;(document.getElementById('checkout-payment-form') as HTMLFormElement | null)?.requestSubmit()
  }

  /* ─── Summary rows (Address, Payment, Promo) ─── */
  const addressRow = (
    <button
      type="button"
      onClick={() => setAddressModalOpen(true)}
      data-testid="add-address-button"
      className="flex w-full items-center justify-between gap-2 py-2 text-left"
    >
      <span className="flex items-center gap-2 text-sm">
        <Home className={cn('w-4 h-4 shrink-0', !hasAddress ? 'text-pink-500' : 'text-neutral-500')} />
        <span data-testid="add-address-button-text" className={hasAddress ? 'text-neutral-900' : 'text-pink-600 font-medium'}>
          {hasAddress ? `${checkout.address!.fullName}, ${checkout.address!.city}, ${checkout.address!.country}` : 'Add Address'}
        </span>
      </span>
      {hasAddress && (
        <span className="text-xs text-neutral-500 hover:text-neutral-700">Change</span>
      )}
    </button>
  )

  const paymentRow = hasAddress && (
    <button
      type="button"
      onClick={() => setPaymentModalOpen(true)}
      data-testid="add-payment-method-button"
      className="flex w-full items-center justify-between gap-2 py-2 text-left"
    >
      <span className="flex items-center gap-2 text-sm">
        <CreditCard className="w-4 h-4 shrink-0 text-neutral-500" />
        <span data-testid="add-payment-method-button-text" className="text-sm font-medium text-neutral-900">
          Payment
        </span>
      </span>
      <ChevronRight className="w-4 h-4 text-neutral-400" />
    </button>
  )

  const promoRow = (
    <button
      type="button"
      onClick={() => setPromoModalOpen(true)}
      className="flex w-full items-center justify-between gap-2 py-2 text-left"
    >
      <span className="flex items-center gap-2 text-sm">
        <Tag className="w-4 h-4 shrink-0 text-neutral-500" />
        <span className="text-neutral-900">
          {promoApplied ? `Promo: ${promoApplied}` : 'Add promo code'}
        </span>
      </span>
      <span className="text-xs text-neutral-500 hover:text-neutral-700">
        {promoApplied ? 'Change' : ''}
      </span>
    </button>
  )

  /* ─── Order summary & cart ─── */
  const orderSummary = (
    <div className="order-summary-container border-t border-neutral-200 pt-4 space-y-2">
      {/* Compact cart lines */}
      <div className="space-y-1.5 max-h-[18vh] overflow-y-auto">
        {lampQuantity > 0 && (
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <input
                type="number"
                min={0}
                max={99}
                value={lampQuantity}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  if (!Number.isNaN(n)) onLampQuantityChange(Math.max(0, Math.min(99, n)))
                }}
                className="w-10 h-7 text-center text-sm rounded border border-neutral-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-neutral-900 truncate">× {lamp.title}</span>
            </div>
            <span className="text-neutral-700 tabular-nums shrink-0">
              {lampTotal === 0 ? 'FREE' : `$${lampTotal.toFixed(2)}`}
            </span>
          </div>
        )}
        {selectedArtworks.slice(0, 6).map((art) => (
          <div key={art.id} className="flex items-center justify-between gap-2 text-sm">
            <span className={cn('truncate flex-1 min-w-0', !art.availableForSale && 'line-through text-neutral-500')}>
              {art.title}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-neutral-700 tabular-nums">${parsePrice(art).toFixed(2)}</span>
              <button
                type="button"
                onClick={() => onRemoveArtwork(art.id)}
                className="w-5 h-5 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-700"
                aria-label="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {selectedArtworks.length > 6 && (
          <div className="text-xs text-neutral-500">+{selectedArtworks.length - 6} more</div>
        )}
        {isGift && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowGiftNote(!showGiftNote)}
              className="text-xs text-neutral-600 hover:text-neutral-900"
            >
              {showGiftNote ? 'Hide gift note' : 'Add gift note'}
            </button>
            {showGiftNote && (
              <textarea
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value.slice(0, 500))}
                placeholder="Write a message..."
                rows={2}
                className="mt-1 w-full px-2 py-1.5 text-xs border border-neutral-200 rounded resize-none focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            )}
          </div>
        )}
        {lampQuantity === 0 && (
          <button
            type="button"
            onClick={() => onLampQuantityChange(1)}
            className="text-sm text-pink-600 font-medium hover:text-pink-700"
          >
            + Add lamp
          </button>
        )}
      </div>
      {lampQuantity > 0 && lampSavings > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-pink-600">
          <Heart className="w-4 h-4 shrink-0 fill-current" />
          <span>7.5% per artwork · You&apos;re saving ${lampSavings.toFixed(2)}</span>
        </div>
      )}
      <div className="space-y-1.5 text-sm pt-1">
        {lampSavings > 0 && (
          <div className="flex justify-between">
            <span className="text-neutral-600">Discount</span>
            <span className="font-medium text-green-700">-${lampSavings.toFixed(2)}</span>
          </div>
        )}
        <div data-testid="delivery-summary-item" className="flex justify-between">
          <span className="text-neutral-600">Shipping</span>
          <span className="font-medium text-neutral-950">Free</span>
        </div>
        <div data-testid="total-summary-item" className="flex justify-between pt-1.5 border-t border-neutral-100">
          <span className="font-semibold text-neutral-950">Total</span>
          <span className="text-lg font-bold text-neutral-950">
            <AnimatedPrice value={total} />
          </span>
        </div>
      </div>
    </div>
  )

  const getCheckoutButtonVariant = (): 'google_pay' | 'paypal' | 'default' => {
    if (selectedPaymentMethod === 'google_pay') return 'google_pay'
    if (selectedPaymentMethod === 'paypal' || selectedPaymentMethod === 'external_paypal')
      return 'paypal'
    return 'default'
  }

  const placeOrderButton = (
    <CheckoutButton
      variant={getCheckoutButtonVariant()}
      amount={total}
      disabled={itemCount === 0 || !allAvailable}
      onClick={handlePlaceOrderClick}
    />
  )

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
        <div className="checkout-title flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <h3 className="text-base font-semibold text-neutral-950">Checkout</h3>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Single checkout screen - summary rows, order summary, Place Order */}
        <div className="checkout-content right-drawer flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 pt-4 pb-6">
            {addressRow}
            {paymentRow}
            {promoRow}
            {orderSummary}
            {error && <p className="mt-2 text-center text-xs text-red-500">{error}</p>}
            {placeOrderButton}
            <Link
              href="/shop/checkout"
              onClick={() => storeCheckoutItems(buildLineItems())}
              className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Checkout on full page
            </Link>
          </div>
        </div>
      </motion.div>

      <AddressModal
        open={addressModalOpen}
        onOpenChange={setAddressModalOpen}
        initialAddress={checkout.address}
        onSave={handleAddressSave}
      />

      <PromoCodeModal
        open={promoModalOpen}
        onOpenChange={setPromoModalOpen}
        appliedCode={promoApplied}
        appliedDiscount={promoDiscount}
        onApply={(code) => { setPromoApplied(code); setPromoDiscount(0) }}
        onRemove={() => { setPromoApplied(''); setPromoDiscount(0) }}
        volumeDiscountLabel={lampSavings > 0 ? 'Volume Discount Applied' : undefined}
        volumeDiscountDescription={lampSavings > 0 ? '7.5% per artwork' : undefined}
      />

      {hasAddress && itemCount > 0 && allAvailable && checkout.address && (
        <PaymentMethodsModal
          open={paymentModalOpen}
          onOpenChange={handlePaymentModalOpenChange}
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
          onSuccess={handlePaymentSuccess}
          onError={(msg) => setError(msg)}
          onPaymentMethodChange={(type) => setSelectedPaymentMethod(type)}
        />
      )}
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
