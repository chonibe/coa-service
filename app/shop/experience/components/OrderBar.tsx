'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { HomeIcon, CreditCardIcon, XMarkIcon, TicketIcon } from '@heroicons/react/24/solid'
import { Package } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import { useExperienceOpenOrder, useExperienceOrder } from '../ExperienceOrderContext'
import { CheckoutProvider, useCheckout } from '@/lib/shop/CheckoutContext'
import { CheckoutPiiPrefill } from '@/components/shop/checkout/CheckoutPiiPrefill'
import { ExperienceQuizPrefill } from '@/components/shop/checkout/ExperienceQuizPrefill'
import { AddressModal } from '@/components/shop/checkout/AddressModal'
import { PaymentStep } from '@/components/shop/checkout/PaymentStep'
import { CheckoutButton } from '@/components/shop/checkout/CheckoutButton'
import { Checkbox, Label } from '@/components/ui'

interface OrderBarProps {
  lamp: ShopifyProduct
  selectedArtworks: ShopifyProduct[]
  lampQuantity: number
  onLampQuantityChange: (qty: number) => void
  onRemoveArtwork: (id: string) => void
  onSelectArtwork?: (product: ShopifyProduct) => void
  onViewLampDetail?: (product: ShopifyProduct) => void
  isGift: boolean
  /** Set of product IDs user already owns (show "Collected" badge on order items) */
  collectedProductIds?: Set<string>
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

function isProductCollected(productId: string, collectedIds?: Set<string>): boolean {
  if (!collectedIds?.size) return false
  const numeric = productId.replace(/^gid:\/\/shopify\/Product\//i, '') || productId
  return collectedIds.has(productId) || collectedIds.has(numeric)
}

const OrderBarInner = forwardRef<OrderBarRef, OrderBarProps>(function OrderBarInner({
  lamp,
  selectedArtworks,
  lampQuantity,
  onLampQuantityChange,
  onRemoveArtwork,
  onSelectArtwork,
  isGift,
  collectedProductIds,
}, ref) {
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [paymentSectionExpanded, setPaymentSectionExpanded] = useState(false)
  const [billingModalOpen, setBillingModalOpen] = useState(false)
  const [preloadedClientSecret, setPreloadedClientSecret] = useState<string | null>(null)
  const [enteredCardInfo, setEnteredCardInfo] = useState<{ brand: string; last4: string } | null>(null)
  const { promoDiscount } = useExperienceOrder()
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
    if (!redirectUrl || typeof redirectUrl !== 'string') {
      setError('Redirect URL was not received. Please try again.')
      return
    }
    try {
      fetch('/api/debug/checkout-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'redirect',
          hasRedirectUrl: true,
          message: 'navigating to PayPal',
        }),
      }).catch(() => {})
    } catch {
      /* ignore */
    }
    window.location.href = redirectUrl
  }

  const handleClose = () => {
    setDrawerOpen(false)
  }

  const hasAddress = checkout.isAddressComplete()

  const paymentFormRef = React.useRef<HTMLFormElement | null>(null)
  const handlePlaceOrderClick = () => {
    if (!hasAddress) {
      setAddressModalOpen(true)
      return
    }
    if (!paymentSectionExpanded) {
      setPaymentSectionExpanded(true)
      return
    }
    if (paymentFormRef.current) {
      paymentFormRef.current.requestSubmit()
    } else {
      setPaymentSectionExpanded(true)
    }
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
        <HomeIcon className={cn('w-5 h-5 shrink-0', !hasAddress ? 'text-[#047AFF]' : 'text-neutral-500')} />
        <span data-testid="add-address-button-text" className={hasAddress ? 'text-neutral-900 dark:text-[#f0e8e8]' : 'text-[#047AFF] dark:text-[#60A5FA] font-medium'}>
          {hasAddress ? `${checkout.address!.fullName}, ${checkout.address!.city}, ${checkout.address!.country}` : 'Add Address'}
        </span>
      </span>
      {hasAddress && (
        <span className="text-neutral-500 dark:text-[#c4a0a0] hover:text-neutral-700 dark:hover:text-[#d4b8b8]">Change</span>
      )}
    </button>
  )

  const paymentMethodLabel = React.useMemo(() => {
    if (checkout.savedCard && (checkout.paymentMethod === 'card' || checkout.paymentMethod === 'link')) {
      const brand = checkout.savedCard.brand.charAt(0).toUpperCase() + checkout.savedCard.brand.slice(1)
      return `${brand} ending in ${checkout.savedCard.last4}`
    }
    const displayType = checkout.paymentMethodDisplayType ?? 'google_pay'
    if ((displayType === 'card' || displayType === 'link') && enteredCardInfo) {
      const brand = enteredCardInfo.brand.charAt(0).toUpperCase() + enteredCardInfo.brand.slice(1)
      return `${brand} ending in ${enteredCardInfo.last4}`
    }
    switch (displayType) {
      case 'google_pay':
        return 'Google Pay'
      case 'paypal':
        return 'PayPal account'
      case 'link':
        return 'Link'
      case 'card':
        return 'Card'
      default:
        return 'Payment'
    }
  }, [checkout.savedCard, checkout.paymentMethod, checkout.paymentMethodDisplayType, enteredCardInfo])

  const hasPaymentSelection = paymentSectionExpanded || !!checkout.paymentMethodDisplayType
  const paymentRow = (
    <button
      type="button"
      onClick={() => setPaymentSectionExpanded((p) => !p)}
      data-testid="add-payment-method-button"
      className="flex w-full items-center justify-between gap-2 py-2.5 text-left"
    >
      <span className="flex items-center gap-3">
        <CreditCardIcon className={cn('w-5 h-5 shrink-0', !hasPaymentSelection ? 'text-[#047AFF] dark:text-[#60A5FA]' : 'text-neutral-500 dark:text-[#c4a0a0]')} />
        <span
          data-testid="add-payment-method-button-text"
          className={cn(
            'font-medium',
            !hasPaymentSelection ? 'text-[#047AFF] dark:text-[#60A5FA]' : 'text-neutral-900 dark:text-[#f0e8e8]'
          )}
        >
          {hasPaymentSelection ? paymentMethodLabel : 'Add payment method'}
        </span>
      </span>
      {(paymentSectionExpanded || hasPaymentSelection) && (
        <span className="text-neutral-400 dark:text-[#b89090] hover:text-neutral-600 dark:hover:text-[#d4b8b8] transition-colors">
          {paymentSectionExpanded ? 'Done' : 'Change'}
        </span>
      )}
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
                    <svg viewBox="0 0 306 400" fill="currentColor" className="w-4 h-5 text-neutral-700 dark:text-[#d4b8b8] shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
                  </svg>
                </div>
                <span className="text-sm text-neutral-900 dark:text-[#f0e8e8] truncate">{lampQuantity} × Street {lampQuantity > 1 ? 'Lamps' : 'Lamp'}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 tabular-nums text-sm">
                {lampSavings > 0 ? (
                  <>
                    <span className="text-sm line-through text-neutral-500 dark:text-[#c4a0a0]">${lampOriginalTotal.toFixed(2)}</span>
                    <span className={cn('text-sm font-medium', lampTotal === 0 ? 'text-green-600' : 'text-green-700')}>
                      {lampTotal === 0 ? 'FREE' : `$${lampTotal.toFixed(2)}`}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-neutral-700 dark:text-[#d4b8b8]">
                    {lampTotal === 0 ? 'FREE' : `$${lampTotal.toFixed(2)}`}
                  </span>
                )}
              </div>
            </div>
            {lampSavings > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-7 shrink-0" aria-hidden />
                <TicketIcon className="w-4 h-4 shrink-0 text-green-600" aria-hidden />
                <span className="text-sm text-green-600">
                  Volume discount : you&apos;re saving ${lampSavings.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
        {selectedArtworks.map((art) => {
          const collected = isProductCollected(art.id, collectedProductIds)
          return (
          <div key={art.id} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="relative w-7 h-7 shrink-0 rounded overflow-hidden bg-neutral-100 dark:bg-[#201c1c]">
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
                  <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-[#b89090] text-sm">
                    —
                  </div>
                )}
                {collected && (
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center" title="Already in your collection">
                    <Package className="w-2 h-2 text-white" strokeWidth={2.5} />
                  </div>
                )}
              </div>
              <span className={cn('truncate min-w-0 text-sm text-neutral-900 dark:text-[#f0e8e8]', !art.availableForSale && 'line-through text-neutral-500 dark:text-[#c4a0a0]')}>
                {art.title}
                {collected && <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-500">(Collected)</span>}
              </span>
            </div>
            <span className="text-sm text-neutral-700 dark:text-[#d4b8b8] tabular-nums shrink-0">${parsePrice(art).toFixed(2)}</span>
            <button
              type="button"
              onClick={() => onRemoveArtwork(art.id)}
              aria-label={`Remove ${art.title} from cart`}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-neutral-400 dark:text-[#b89090] hover:text-neutral-700 dark:hover:text-[#d4b8b8] hover:bg-neutral-100 dark:hover:bg-[#201c1c] transition-colors"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        )})}
        {lampQuantity === 0 && (
          <button
            type="button"
            onClick={() => onLampQuantityChange(1)}
            className="flex items-center gap-2 text-sm text-[#047AFF] dark:text-[#60A5FA] font-medium hover:text-[#0366d6] dark:hover:text-[#93C5FD]"
          >
              <svg viewBox="0 0 306 400" fill="currentColor" className="w-4 h-5 text-neutral-600 dark:text-[#c4a0a0] shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
            </svg>
            <span>+ Add lamp</span>
          </button>
        )}
      </div>
      <div className="space-y-2 text-sm pt-3">
        <div data-testid="delivery-summary-item" className="flex justify-between text-sm">
          <span className="text-neutral-600 dark:text-[#c4a0a0]">Shipping</span>
          <span className="font-medium text-neutral-950 dark:text-[#f0e8e8]">Free</span>
        </div>
        <div data-testid="total-summary-item" className="flex justify-between pt-2 text-sm">
          <span className="font-semibold text-neutral-950 dark:text-[#f0e8e8]">Total</span>
          <span className="font-bold text-neutral-950 dark:text-[#f0e8e8] tabular-nums">
            <AnimatedPrice value={Math.max(0, total - promoDiscount)} />
          </span>
        </div>
      </div>
    </div>
  )

  const getCheckoutButtonVariant = (): 'google_pay' | 'paypal' | 'default' => {
    const displayType = checkout.paymentMethodDisplayType
    if (displayType === 'google_pay') return 'google_pay'
    if (displayType === 'paypal')
      return 'paypal'
    return 'default'
  }

  const finalTotal = Math.max(0, total - promoDiscount)
  const placeOrderButton = (
    <CheckoutButton
      variant={getCheckoutButtonVariant()}
      amount={finalTotal}
      disabled={itemCount === 0 || !allAvailable}
      onClick={handlePlaceOrderClick}
      className="text-sm"
    />
  )

  return (
    <div className={cn('fixed inset-0 z-[90]', drawerOpen ? 'pointer-events-auto' : 'pointer-events-none')} aria-hidden={!drawerOpen}>
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
        initial={false}
        animate={{ x: drawerOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="checkout-sheet right-drawer fixed top-0 right-0 bottom-0 z-[92] w-full max-w-md sm:max-w-sm bg-white dark:bg-[#151212] shadow-2xl flex flex-col pointer-events-auto pr-[env(safe-area-inset-right,0px)]"
        style={{ width: 'min(calc(100vw - 0.5rem), 420px)' }}
      >
        {/* Header - close button only */}
        <div className="checkout-title flex-shrink-0 flex items-center justify-end px-6 pt-4 pb-1">
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-[#d4b8b8] dark:hover:bg-[#201c1c] transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Single checkout screen - Top (compressed), divider, Items section — min-h-0 enables scroll */}
        <div className="checkout-content right-drawer flex-1 min-h-0 overflow-y-auto overflow-x-hidden text-sm font-normal">
          <div className="px-6 pb-6">
            {/* Top: Checkout title, Address, Payment — compressed */}
            <div className="pb-3">
              <h3 className="text-lg font-semibold text-neutral-950 dark:text-[#f0e8e8] mb-3">Checkout</h3>
              {addressRow}
              {paymentRow}
              {/* Inline expandable payment section – stays mounted when collapsed so Place Order works */}
              {itemCount > 0 && allAvailable && (
                <div
                  className={cn(
                    'overflow-hidden transition-[max-height] duration-200 ease-out flex flex-col',
                    paymentSectionExpanded ? 'max-h-[70vh]' : 'max-h-0'
                  )}
                  aria-hidden={!paymentSectionExpanded}
                >
                  <div className="pt-3 space-y-4 border-t border-neutral-200 dark:border-white/10 mt-2 overflow-y-auto min-h-0 max-h-[70vh]">
                    <PaymentStep
                      compact
                      formId="checkout-payment-form"
                      formRef={paymentFormRef}
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
                      onPaymentMethodChange={(type, cardInfo) => {
                        const displayType = type === 'google_pay' ? 'google_pay' : type === 'paypal' || type === 'external_paypal' ? 'paypal' : type === 'link' ? 'link' : 'card'
                        if (type === 'google_pay' && checkout.paymentMethodDisplayType && checkout.paymentMethodDisplayType !== 'google_pay') return
                        const method: 'link' | 'paypal' | 'card' = displayType === 'google_pay' || displayType === 'link' ? 'link' : displayType === 'paypal' ? 'paypal' : 'card'
                        checkout.setPaymentMethod(method)
                        checkout.setPaymentMethodDisplayType(displayType)
                        if (displayType !== 'card' && displayType !== 'link') {
                          checkout.setSavedCard(null)
                          setEnteredCardInfo(null)
                        } else if (cardInfo) {
                          setEnteredCardInfo(cardInfo)
                        } else {
                          setEnteredCardInfo(null)
                        }
                      }}
                      preloadedClientSecret={preloadedClientSecret}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1" aria-hidden />
                      <button
                        type="button"
                        onClick={() => setPaymentSectionExpanded(false)}
                        data-testid="payment-done-button"
                        className="text-sm font-medium text-[#047AFF] dark:text-[#60A5FA] hover:text-[#0366d6] dark:hover:text-[#93C5FD]"
                      >
                        Done
                      </button>
                    </div>
                    <div className="border-t border-neutral-200 dark:border-white/10 pt-4 mt-2">
                      <h3 className="text-sm font-medium text-neutral-950 dark:text-[#f0e8e8] mb-3">Billing address</h3>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="same-as-address-exp"
                          checked={checkout.sameAsShipping}
                          onCheckedChange={(c) => {
                            checkout.setSameAsShipping(!!c)
                            if (c) checkout.setBillingAddress(null)
                          }}
                        />
                        <Label htmlFor="same-as-address-exp" className="text-sm text-neutral-700 dark:text-[#d4b8b8] cursor-pointer">
                          Same as Address
                        </Label>
                      </div>
                      {!checkout.sameAsShipping && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => setBillingModalOpen(true)}
                            className="w-full rounded-lg border border-neutral-200 dark:border-white/20 px-4 py-3 text-left text-sm text-neutral-700 dark:text-[#d4b8b8] hover:bg-neutral-50 dark:hover:bg-[#201c1c]/50"
                          >
                            {checkout.billingAddress
                              ? `${checkout.billingAddress.addressLine1}, ${checkout.billingAddress.city}`
                              : 'Add billing address'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Divider + Items section: order summary */}
            <div className="border-t border-neutral-200 dark:border-white/10 pt-5">
              {orderSummary}
            </div>
            {error && <p className="mt-2 text-center text-red-500 dark:text-red-400">{error}</p>}
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

      <AddressModal
        open={billingModalOpen}
        onOpenChange={setBillingModalOpen}
        initialAddress={checkout.sameAsShipping ? undefined : (checkout.billingAddress ?? undefined)}
        onSave={(addr) => {
          checkout.setBillingAddress(addr)
          setBillingModalOpen(false)
        }}
        addressType="billing"
      />
    </div>
  )
})

export const OrderBar = forwardRef<OrderBarRef, OrderBarProps>(function OrderBar(props, ref) {
  return (
    <CheckoutProvider storageKey="sc-experience-checkout">
      <CheckoutPiiPrefill />
      <ExperienceQuizPrefill />
      <OrderBarInner {...props} ref={ref} />
    </CheckoutProvider>
  )
})
