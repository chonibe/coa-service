'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { HomeIcon, CreditCardIcon, XMarkIcon, TagIcon, TicketIcon } from '@heroicons/react/24/solid'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import { useExperienceOpenOrder } from '../ExperienceOrderContext'
import { CheckoutProvider, useCheckout } from '@/lib/shop/CheckoutContext'
import { CheckoutPiiPrefill } from '@/components/shop/checkout/CheckoutPiiPrefill'
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [preloadedClientSecret, setPreloadedClientSecret] = useState<string | null>(null)
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

  /* Preload checkout session when cart drawer opens – payment dialog loads instantly */
  const preloadKeyRef = React.useRef<string>('')
  React.useEffect(() => {
    const key = JSON.stringify({
      items: buildLineItems().map((i) => i.variantId + ':' + i.quantity),
      address: checkout.address
        ? `${checkout.address.country}|${checkout.address.postalCode}|${checkout.address.addressLine1}`
        : '',
    })
    if (preloadKeyRef.current && preloadKeyRef.current !== key) {
      setPreloadedClientSecret(null)
    }
    preloadKeyRef.current = key
  })
  React.useEffect(() => {
    if (!drawerOpen || itemCount === 0 || !allAvailable) return
    const items = buildLineItems()
    if (items.length === 0) return

    const shippingAddress = checkout.address
      ? {
          email: checkout.address.email,
          fullName: checkout.address.fullName,
          country: checkout.address.country,
          addressLine1: checkout.address.addressLine1,
          addressLine2: checkout.address.addressLine2,
          city: checkout.address.city,
          state: checkout.address.state,
          postalCode: checkout.address.postalCode,
          phoneNumber: checkout.address.phoneNumber,
        }
      : {
          email: '',
          fullName: '',
          country: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          phoneNumber: '',
        }

    let cancelled = false
    fetch('/api/checkout/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        customerEmail: checkout.address?.email,
        shippingAddress,
      }),
    })
      .then(async (r) => {
        if (cancelled) return
        const data = await r.json()
        if (!r.ok) return
        if (data.clientSecret) setPreloadedClientSecret(data.clientSecret)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [drawerOpen, itemCount, allAvailable, buildLineItems, checkout.address])

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
      className="flex w-full items-center justify-between gap-2 py-2.5 text-left"
    >
      <span className="flex items-center gap-3">
        <HomeIcon className={cn('w-5 h-5 shrink-0', !hasAddress ? 'text-pink-500' : 'text-neutral-500')} />
        <span data-testid="add-address-button-text" className={hasAddress ? 'text-neutral-900' : 'text-pink-600 font-medium'}>
          {hasAddress ? `${checkout.address!.fullName}, ${checkout.address!.city}, ${checkout.address!.country}` : 'Add Address'}
        </span>
      </span>
      {hasAddress && (
        <span className="text-neutral-500 hover:text-neutral-700">Change</span>
      )}
    </button>
  )

  const paymentMethodLabel = React.useMemo(() => {
    switch (selectedPaymentMethod) {
      case 'google_pay':
        return 'Google Pay'
      case 'paypal':
      case 'external_paypal':
        return 'PayPal'
      case 'link':
        return 'Link'
      case 'card':
        return 'Card'
      default:
        return selectedPaymentMethod ? selectedPaymentMethod.replace(/_/g, ' ') : 'Payment'
    }
  }, [selectedPaymentMethod])

  const hasPaymentSelection = paymentModalHasBeenOpened
  const paymentRow = (
    <button
      type="button"
      onClick={() => setPaymentModalOpen(true)}
      data-testid="add-payment-method-button"
      className="flex w-full items-center justify-between gap-2 py-2.5 text-left"
    >
      <span className="flex items-center gap-3">
        <CreditCardIcon className={cn('w-5 h-5 shrink-0', !hasPaymentSelection ? 'text-pink-500' : 'text-neutral-500')} />
        <span
          data-testid="add-payment-method-button-text"
          className={cn(
            'font-medium',
            !hasPaymentSelection ? 'text-pink-600' : 'text-neutral-900'
          )}
        >
          {hasPaymentSelection ? paymentMethodLabel : 'Add payment method'}
        </span>
      </span>
      {hasPaymentSelection && (
        <span className="text-neutral-400 hover:text-neutral-600 transition-colors">Change</span>
      )}
    </button>
  )

  const promoRow = (
    <button
      type="button"
      onClick={() => setPromoModalOpen(true)}
      className="flex w-full items-center justify-between gap-2 py-2.5 text-left"
    >
      <span className="flex items-center gap-2 text-neutral-900">
        <TicketIcon className="w-5 h-5 text-neutral-600 shrink-0" />
        Promo: {promoApplied || 'WELCOME10'}
      </span>
      <span className="text-neutral-500 hover:text-neutral-700">Change</span>
    </button>
  )

  /* ─── Order summary & cart ─── */
  const lampOriginalTotal = lampQuantity * lampPrice
  const orderSummary = (
    <div className="order-summary-container space-y-3">
      {/* Compact cart lines */}
      <div className="pt-2 space-y-2 max-h-[18vh] overflow-y-auto">
        {lampQuantity > 0 && (
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-7 h-7 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 306 400" fill="currentColor" className="w-4 h-5 text-neutral-700 shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
                  </svg>
                </div>
                <span className="text-sm text-neutral-900 truncate">{lampQuantity} × Street {lampQuantity > 1 ? 'Lamps' : 'Lamp'}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 tabular-nums text-sm">
                {lampSavings > 0 ? (
                  <>
                    <span className="text-sm line-through text-neutral-500">${lampOriginalTotal.toFixed(2)}</span>
                    <span className={cn('text-sm font-medium', lampTotal === 0 ? 'text-green-600' : 'text-green-700')}>
                      {lampTotal === 0 ? 'FREE' : `$${lampTotal.toFixed(2)}`}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-neutral-700">
                    {lampTotal === 0 ? 'FREE' : `$${lampTotal.toFixed(2)}`}
                  </span>
                )}
              </div>
            </div>
            {lampSavings > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-7 shrink-0" aria-hidden />
                <TagIcon className="w-4 h-4 shrink-0 text-green-600" />
                <span className="text-sm text-green-600">
                  Volume discount : you&apos;re saving ${lampSavings.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
        {selectedArtworks.map((art) => (
          <div key={art.id} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 shrink-0 rounded overflow-hidden bg-neutral-100">
                {art.featuredImage?.url ? (
                  <Image
                    src={art.featuredImage.url}
                    alt={art.title}
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                    —
                  </div>
                )}
              </div>
              <span className={cn('truncate min-w-0 text-sm', !art.availableForSale && 'line-through text-neutral-500')}>
                {art.title}
              </span>
            </div>
            <span className="text-sm text-neutral-700 tabular-nums shrink-0">${parsePrice(art).toFixed(2)}</span>
            <button
              type="button"
              onClick={() => onRemoveArtwork(art.id)}
              aria-label={`Remove ${art.title} from cart`}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        ))}
        {lampQuantity === 0 && (
          <button
            type="button"
            onClick={() => onLampQuantityChange(1)}
            className="flex items-center gap-2 text-sm text-pink-600 font-medium hover:text-pink-700"
          >
            <svg viewBox="0 0 306 400" fill="currentColor" className="w-4 h-5 text-neutral-600 shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
            </svg>
            <span>+ Add lamp</span>
          </button>
        )}
      </div>
      <div className="space-y-2 text-sm pt-3">
        <div data-testid="delivery-summary-item" className="flex justify-between text-sm">
          <span className="text-neutral-600">Shipping</span>
          <span className="font-medium text-neutral-950">Free</span>
        </div>
        <div data-testid="total-summary-item" className="flex justify-between pt-2 text-sm">
          <span className="font-semibold text-neutral-950">Total</span>
          <span className="font-bold text-neutral-950 tabular-nums">
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
      className="text-sm"
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
        className="checkout-sheet right-drawer fixed top-0 right-0 bottom-0 z-[92] w-full max-w-md sm:max-w-sm bg-white shadow-2xl flex flex-col pointer-events-auto pr-[env(safe-area-inset-right,0px)]"
        style={{ width: 'min(calc(100vw - 0.5rem), 420px)' }}
      >
        {/* Header - close button only */}
        <div className="checkout-title flex-shrink-0 flex items-center justify-end px-6 pt-4 pb-1">
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Single checkout screen - Top (compressed), divider, Items section */}
        <div className="checkout-content right-drawer flex-1 overflow-y-auto overflow-x-hidden text-sm font-normal">
          <div className="px-6 pb-6">
            {/* Top: Checkout title, Address, Payment — compressed */}
            <div className="pb-3">
              <h3 className="text-sm font-semibold text-neutral-950 mb-3">Checkout</h3>
              {addressRow}
              {paymentRow}
            </div>
            {/* Divider + Items section: Promo, order summary */}
            <div className="border-t border-neutral-200 pt-5">
              <div className="border-b border-neutral-200 pb-5 mb-4">
                {promoRow}
              </div>
              {orderSummary}
            </div>
            {error && <p className="mt-2 text-center text-red-500">{error}</p>}
            {placeOrderButton}
          </div>
        </div>
      </motion.div>

      <AddressModal
        open={addressModalOpen}
        onOpenChange={setAddressModalOpen}
        initialAddress={checkout.address}
        onSave={handleAddressSave}
        billingAddress={!checkout.sameAsShipping ? checkout.billingAddress : null}
      />

      <PromoCodeModal
        open={promoModalOpen}
        onOpenChange={setPromoModalOpen}
        appliedCode={promoApplied}
        appliedDiscount={promoDiscount}
        onApply={(code) => { setPromoApplied(code); setPromoDiscount(0) }}
        onRemove={() => { setPromoApplied(''); setPromoDiscount(0) }}
        volumeDiscountLabel={lampSavings > 0 ? 'Volume Discount Applied' : undefined}
        volumeDiscountDescription={lampSavings > 0 ? 'Volume discount : you\'re saving' : undefined}
      />

      {itemCount > 0 && allAvailable && (
        <PaymentMethodsModal
          open={paymentModalOpen}
          onOpenChange={handlePaymentModalOpenChange}
          items={buildLineItems()}
          subtotal={lampTotal + artworksTotal}
          discount={lampSavings}
          shipping={0}
          total={total}
          itemCount={itemCount}
          customerEmail={checkout.address?.email}
          shippingAddress={
            checkout.address
              ? {
                  email: checkout.address.email,
                  fullName: checkout.address.fullName,
                  country: checkout.address.country,
                  addressLine1: checkout.address.addressLine1,
                  addressLine2: checkout.address.addressLine2,
                  city: checkout.address.city,
                  state: checkout.address.state,
                  postalCode: checkout.address.postalCode,
                  phoneNumber: checkout.address.phoneNumber,
                }
              : {
                  email: '',
                  fullName: '',
                  country: '',
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  state: '',
                  postalCode: '',
                  phoneNumber: '',
                }
          }
          onSuccess={handlePaymentSuccess}
          onError={(msg) => setError(msg)}
          onPaymentMethodChange={(type) => setSelectedPaymentMethod(type)}
          billingAddress={checkout.sameAsShipping ? null : checkout.billingAddress}
          sameAsShipping={checkout.sameAsShipping}
          onSameAsShippingChange={(v) => {
            checkout.setSameAsShipping(v)
            if (v) checkout.setBillingAddress(null)
          }}
          onBillingAddressSave={(addr) => checkout.setBillingAddress(addr)}
          preloadedClientSecret={preloadedClientSecret}
        />
      )}
    </div>
  )
})

export const OrderBar = forwardRef<OrderBarRef, OrderBarProps>(function OrderBar(props, ref) {
  return (
    <CheckoutProvider>
      <CheckoutPiiPrefill />
      <OrderBarInner {...props} ref={ref} />
    </CheckoutProvider>
  )
})
