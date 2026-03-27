'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { HomeIcon, CreditCardIcon, XMarkIcon, TicketIcon } from '@heroicons/react/24/solid'
import { Package, Shield, RotateCcw, Lock, Minus, Plus } from 'lucide-react'
import { ExperienceOrderLampIcon } from './ExperienceOrderLampIcon'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn, formatPriceCompact } from '@/lib/utils'
import { useExperienceOpenOrder, useExperienceOrder } from '../ExperienceOrderContext'
import { trackBeginCheckout, trackAddPaymentInfo } from '@/lib/google-analytics'
import { captureFunnelEvent, FunnelEvents, captureAddShippingInfo, captureCheckoutError, tagSessionForReplay } from '@/lib/posthog'
import { storefrontProductToItem } from '@/lib/analytics-ecommerce'
import { CheckoutProvider, useCheckout } from '@/lib/shop/CheckoutContext'
import { CheckoutPiiPrefill } from '@/components/shop/checkout/CheckoutPiiPrefill'
import { ExperienceQuizPrefill } from '@/components/shop/checkout/ExperienceQuizPrefill'
import { AddressModal } from '@/components/shop/checkout/AddressModal'
import { CheckoutButton } from '@/components/shop/checkout/CheckoutButton'
import { Checkbox, Label } from '@/components/ui'
import {
  experienceArtworkUnitUsd,
  storefrontVariantUsd,
} from '@/lib/shop/experience-artwork-unit-price'

// Lazy-load PaymentStep (Stripe React SDK + hCaptcha + Google Pay) only when the
// payment section is expanded by the user — keeps them off the initial experience bundle.
const PaymentStep = dynamic(
  () => import('@/components/shop/checkout/PaymentStep').then((m) => ({ default: m.PaymentStep })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-[#047AFF] rounded-full animate-spin" />
      </div>
    ),
  }
)

/** Compact ± controls — globals.css gives all buttons min 44×44; qty-stepper-compact opts out */
const qtyStepperBtnClass =
  'qty-stepper-compact h-[22px] w-[22px] shrink-0 inline-flex items-center justify-center rounded border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-[#d4b8b8] bg-neutral-50 dark:bg-[#201c1c] hover:bg-neutral-100 dark:hover:bg-[#2a2424] transition-colors disabled:opacity-40 disabled:pointer-events-none'

/** Consecutive identical product IDs in cart order are one line with quantity = run length. */
function groupConsecutiveArtworks(products: ShopifyProduct[]): Array<{
  product: ShopifyProduct
  quantity: number
  runStartIndex: number
}> {
  const runs: Array<{ product: ShopifyProduct; quantity: number; runStartIndex: number }> = []
  let i = 0
  while (i < products.length) {
    const product = products[i]
    let j = i + 1
    while (j < products.length && products[j].id === product.id) j++
    runs.push({ product, quantity: j - i, runStartIndex: i })
    i = j
  }
  return runs
}

interface OrderBarProps {
  lamp: ShopifyProduct
  selectedArtworks: ShopifyProduct[]
  lampQuantity: number
  onLampQuantityChange: (qty: number) => void
  /**
   * Adjust quantity for a consecutive run of the same artwork.
   * `runStartIndex` is the `selectedArtworks` index where that run begins.
   */
  onAdjustArtworkQuantity: (runStartIndex: number, delta: 1 | -1) => void
  onSelectArtwork?: (product: ShopifyProduct) => void
  onViewLampDetail?: (product: ShopifyProduct) => void
  isGift: boolean
  /** Set of product IDs user already owns (show "Collected" badge on order items) */
  collectedProductIds?: Set<string>
  /** Locked artwork USD prices (numeric Shopify product id → dollars) from The Reserve */
  lockedArtworkPrices?: Record<string, number>
  /** Street ladder buy-now USD per artwork (numeric product id) from edition-states */
  streetLadderPrices?: Record<string, number>
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

  return <span className="tabular-nums">${formatPriceCompact(display)}</span>
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
  onAdjustArtworkQuantity,
  onSelectArtwork,
  isGift,
  collectedProductIds,
  lockedArtworkPrices,
  streetLadderPrices,
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

  const firedBeginCheckoutRef = useRef(false)
  const firedAddPaymentInfoRef = useRef(false)

  useExperienceOpenOrder(() => {
    setDrawerOpen(true)
    firedBeginCheckoutRef.current = false
    firedAddPaymentInfoRef.current = false
  })

  const priceMaps = React.useMemo(
    () => ({
      lockedUsdByProductId: lockedArtworkPrices,
      streetLadderUsdByProductId: streetLadderPrices,
    }),
    [lockedArtworkPrices, streetLadderPrices]
  )

  const lampPrice = parsePrice(lamp)
  const artworkCount = selectedArtworks.length
  const artworkRuns = React.useMemo(() => groupConsecutiveArtworks(selectedArtworks), [selectedArtworks])
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
  const artworksTotal = selectedArtworks.reduce(
    (sum, p) => sum + experienceArtworkUnitUsd(p, priceMaps),
    0
  )
  const total = lampTotal + artworksTotal
  const allAvailable = selectedArtworks.every((p) => p.availableForSale)
  const itemCount = selectedArtworks.length + lampQuantity

  // E-commerce: track begin_checkout when order drawer opens with items
  useEffect(() => {
    if (!drawerOpen) {
      firedBeginCheckoutRef.current = false
      return
    }
    if (itemCount === 0) return
    if (firedBeginCheckoutRef.current) return
    firedBeginCheckoutRef.current = true
    const artworkLineItems: ReturnType<typeof storefrontProductToItem>[] = []
    let ai = 0
    while (ai < selectedArtworks.length) {
      const p = selectedArtworks[ai]
      let aj = ai + 1
      while (aj < selectedArtworks.length && selectedArtworks[aj].id === p.id) aj++
      const qty = aj - ai
      const unit = experienceArtworkUnitUsd(p, priceMaps)
      const pAdj =
        unit !== storefrontVariantUsd(p)
          ? ({
              ...p,
              priceRange: {
                minVariantPrice: { amount: String(unit), currencyCode: 'USD' },
                maxVariantPrice: { amount: String(unit), currencyCode: 'USD' },
              },
            } as ShopifyProduct)
          : p
      artworkLineItems.push(storefrontProductToItem(pAdj, p.variants?.edges?.[0]?.node, qty))
      ai = aj
    }
    const items =
      lampQuantity > 0
        ? [storefrontProductToItem(lamp, lamp.variants?.edges?.[0]?.node, lampQuantity), ...artworkLineItems]
        : artworkLineItems
    trackBeginCheckout(items, total, 'USD', {
      em: checkout.address?.email || undefined,
    })
  }, [drawerOpen, itemCount, lampQuantity, lamp, selectedArtworks, total, priceMaps])

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

    let wi = 0
    while (wi < selectedArtworks.length) {
      const art = selectedArtworks[wi]
      let wj = wi + 1
      while (wj < selectedArtworks.length && selectedArtworks[wj].id === art.id) wj++
      if (!art.availableForSale) {
        wi = wj
        continue
      }
      const qty = wj - wi
      items.push({
        productId: art.id.replace('gid://shopify/Product/', ''),
        variantId: getVariantId(art),
        variantGid: art.variants?.edges?.[0]?.node?.id ?? '',
        handle: art.handle,
        title: art.title,
        price: experienceArtworkUnitUsd(art, priceMaps),
        quantity: qty,
        image: art.featuredImage?.url ?? undefined,
      })
      wi = wj
    }
    return items
  }, [lamp, lampQuantity, lampPrices, selectedArtworks, priceMaps])

  /* Preload checkout session when cart drawer opens – payment dialog loads instantly */
  const preloadKeyRef = React.useRef<string>('')
  React.useEffect(() => {
    const key = JSON.stringify({
      items: buildLineItems().map((i) => i.variantId + ':' + i.quantity + ':' + i.price),
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
    // Don't preload until we have address with email — ensures PayPal orders get customer details
    if (!checkout.address?.email?.trim()) return
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
          cancelUrl: typeof window !== 'undefined' ? `${window.location.origin}/experience` : undefined,
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
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setError(message)
      captureCheckoutError({ error_message: message, source: 'order_bar_test' })
      tagSessionForReplay('checkout-error')
    }
  }, [lamp])

  useImperativeHandle(ref, () => ({ testZeroOrder: handleTestZeroOrder }), [handleTestZeroOrder])

  const handleAddressSave = (addr: typeof checkout.address) => {
    checkout.setAddress(addr)
    setAddressModalOpen(false)
    if (addr) {
      captureAddShippingInfo([], undefined, addr.country)
      captureFunnelEvent(FunnelEvents.checkout_step_viewed, { step_name: 'address_saved', context: 'experience' })
    }
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
        <span className="text-neutral-500 dark:text-experience-highlight/80 hover:text-neutral-700 dark:hover:text-[#FFBA94]">Change</span>
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
      <div className="px-0.5 pt-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-[#948888]">
          Your Street Lamp + artworks
        </p>
      </div>
      {/* Compact cart lines */}
      <div className="pt-2 space-y-2 max-h-[35vh] overflow-y-auto scrollbar-prominent">
        {lampQuantity > 0 && (
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2 items-center text-sm">
            <div className="flex items-center gap-2 min-w-0 justify-self-start">
              <ExperienceOrderLampIcon className={cn('h-7 w-7', 'text-neutral-400 dark:text-[#d4b8b8]')} />
              <span className="text-sm text-neutral-900 dark:text-[#f0e8e8] truncate min-w-0">Street {lampQuantity > 1 ? 'Lamps' : 'Lamp'}</span>
            </div>
            <div className="flex items-center justify-center gap-0.5 shrink-0 justify-self-center">
              <button
                type="button"
                onClick={() => onLampQuantityChange(Math.max(0, lampQuantity - 1))}
                className={qtyStepperBtnClass}
                aria-label="Decrease lamp quantity"
              >
                <Minus className="w-2.5 h-2.5" strokeWidth={2.5} />
              </button>
              <span className="min-w-[1.125rem] text-center text-[10px] font-medium tabular-nums text-neutral-900 dark:text-[#f0e8e8]">
                {lampQuantity}
              </span>
              <button
                type="button"
                onClick={() => onLampQuantityChange(Math.min(99, lampQuantity + 1))}
                disabled={lampQuantity >= 99}
                className={qtyStepperBtnClass}
                aria-label="Increase lamp quantity"
              >
                <Plus className="w-2.5 h-2.5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0 justify-self-end min-w-0">
              {lampSavings > 0 && (
                <span className="flex items-center gap-1 text-green-600 text-xs whitespace-nowrap">
                  <TicketIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  Saving ${formatPriceCompact(lampSavings)}
                </span>
              )}
              <div className="flex items-center gap-1.5 tabular-nums whitespace-nowrap">
                {lampSavings > 0 && (
                  <span className="line-through text-neutral-500 dark:text-[#c4a0a0]">${formatPriceCompact(lampOriginalTotal)}</span>
                )}
                <span className={cn('font-medium text-sm', lampTotal === 0 ? 'text-green-600' : 'text-neutral-700 dark:text-[#d4b8b8]')}>
                  {lampTotal === 0 ? 'FREE' : `$${formatPriceCompact(lampTotal)}`}
                </span>
              </div>
            </div>
          </div>
        )}
        {artworkRuns.map(({ product: art, quantity, runStartIndex }) => {
          const collected = isProductCollected(art.id, collectedProductIds)
          const lineSubtotal = experienceArtworkUnitUsd(art, priceMaps) * quantity
          return (
          <div key={`${art.id}-${runStartIndex}`} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2 items-center text-sm">
            <div className="flex items-center gap-2 min-w-0 justify-self-start">
              <div className="relative w-7 h-7 shrink-0 rounded overflow-hidden bg-neutral-100 dark:bg-[#201c1c]">
                {art.featuredImage?.url ? (
                  <Image
                    src={art.featuredImage.url}
                    alt={art.title}
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    unoptimized
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
            <div className="flex items-center justify-center gap-0.5 shrink-0 justify-self-center">
              <button
                type="button"
                onClick={() => onAdjustArtworkQuantity(runStartIndex, -1)}
                className={qtyStepperBtnClass}
                aria-label={`Remove one ${art.title} from order`}
              >
                <Minus className="w-2.5 h-2.5" strokeWidth={2.5} />
              </button>
              <span className="min-w-[1.125rem] text-center text-[10px] font-medium tabular-nums text-neutral-900 dark:text-[#f0e8e8]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onAdjustArtworkQuantity(runStartIndex, 1)}
                disabled={!art.availableForSale}
                className={qtyStepperBtnClass}
                aria-label={`Add another ${art.title}`}
              >
                <Plus className="w-2.5 h-2.5" strokeWidth={2.5} />
              </button>
            </div>
            <span className="text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] tabular-nums shrink-0 justify-self-end whitespace-nowrap">
              ${formatPriceCompact(lineSubtotal)}
            </span>
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
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={cn(
          'fixed inset-0 pointer-events-auto z-[91] bg-black/30 transition-opacity duration-200',
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
      />
      {/* Drawer — CSS slide from right */}
      <div
        className={cn(
          'checkout-sheet right-drawer fixed top-0 right-0 bottom-0 z-[92] w-full md:w-[480px] bg-white dark:bg-[#171515] shadow-2xl flex flex-col pointer-events-auto pr-[env(safe-area-inset-right,0px)]',
          'transition-transform duration-300',
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}
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
        <div className="checkout-content right-drawer flex-1 min-h-0 overflow-y-auto overflow-x-hidden text-sm font-normal scrollbar-prominent">
          <div className="px-6 pb-6">
            {/* Top: Checkout title, Address, Payment — compressed */}
            <div className="pb-3">
              <h3 className="text-lg font-semibold text-[#FFBA94] mb-3">Checkout</h3>
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
                  <div className="pt-3 space-y-4 border-t border-neutral-200 dark:border-white/10 mt-2 overflow-y-auto min-h-0 max-h-[70vh] scrollbar-prominent">
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
                      onError={(msg) => {
                        setError(msg)
                        captureFunnelEvent(FunnelEvents.payment_error, { error_message: msg, source: 'experience_order_bar' })
                        tagSessionForReplay('payment-error')
                      }}
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
                        // E-commerce: track add_payment_info once per checkout session
                        if (!firedAddPaymentInfoRef.current && selectedArtworks.length + lampQuantity > 0) {
                          firedAddPaymentInfoRef.current = true
                          const artworkGa: ReturnType<typeof storefrontProductToItem>[] = []
                          let gai = 0
                          while (gai < selectedArtworks.length) {
                            const gp = selectedArtworks[gai]
                            let gaj = gai + 1
                            while (gaj < selectedArtworks.length && selectedArtworks[gaj].id === gp.id) gaj++
                            const gqty = gaj - gai
                            const gUnit = experienceArtworkUnitUsd(gp, priceMaps)
                            const gpAdj =
                              gUnit !== storefrontVariantUsd(gp)
                                ? ({
                                    ...gp,
                                    priceRange: {
                                      minVariantPrice: { amount: String(gUnit), currencyCode: 'USD' },
                                      maxVariantPrice: { amount: String(gUnit), currencyCode: 'USD' },
                                    },
                                  } as ShopifyProduct)
                                : gp
                            artworkGa.push(
                              storefrontProductToItem(gpAdj, gp.variants?.edges?.[0]?.node, gqty)
                            )
                            gai = gaj
                          }
                          const items =
                            lampQuantity > 0
                              ? [
                                  storefrontProductToItem(lamp, lamp.variants?.edges?.[0]?.node, lampQuantity),
                                  ...artworkGa,
                                ]
                              : artworkGa
                          trackAddPaymentInfo(displayType, items, total, 'USD', {
                            em: checkout.address?.email || undefined,
                          })
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
                      <h3 className="text-sm font-medium text-[#FFBA94] mb-3">Billing address</h3>
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
            <div className="mt-8">
              {placeOrderButton}
              {/* Trust chips under Place Order - 2 per row, centered, icons aligned */}
              <div className="mt-10 grid grid-cols-2 gap-2.5 w-fit mx-auto">
              <span className="inline-flex items-center gap-1 text-[11px] leading-tight bg-neutral-100 dark:bg-[#201c1c] text-neutral-600 dark:text-[#c4a0a0] px-3 py-1.5 rounded-lg [&>svg]:size-[1.1em] [&>svg]:shrink-0 shrink-0">
                <Package strokeWidth={1} />
                Free Worldwide Shipping
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] leading-tight bg-neutral-100 dark:bg-[#201c1c] text-neutral-600 dark:text-[#c4a0a0] px-3 py-1.5 rounded-lg [&>svg]:size-[1.1em] [&>svg]:shrink-0 shrink-0">
                <Shield strokeWidth={1} />
                12 months guarantee
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] leading-tight bg-neutral-100 dark:bg-[#201c1c] text-neutral-600 dark:text-[#c4a0a0] px-3 py-1.5 rounded-lg [&>svg]:size-[1.1em] [&>svg]:shrink-0 shrink-0">
                <RotateCcw strokeWidth={1} />
                Easy 30 days returns
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] leading-tight bg-neutral-100 dark:bg-[#201c1c] text-neutral-600 dark:text-[#c4a0a0] px-3 py-1.5 rounded-lg [&>svg]:size-[1.1em] [&>svg]:shrink-0 shrink-0">
                <Lock strokeWidth={1} />
                Secure payment
              </span>
            </div>
            </div>
          </div>
        </div>
      </div>

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
