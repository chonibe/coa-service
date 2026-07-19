'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { TicketIcon } from '@heroicons/react/24/solid'
import { Package, Shield, RotateCcw, Lock, Minus, Plus, Loader2, ChevronRight, X } from 'lucide-react'
import { ExperienceOrderLampIcon } from './ExperienceOrderLampIcon'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn, formatPriceCompact } from '@/lib/utils'
import { useExperienceOpenOrder, useExperienceOrder } from '../ExperienceOrderContext'
import { trackBeginCheckout } from '@/lib/google-analytics'
import { captureCheckoutError, captureFunnelEvent, FunnelEvents, getDeviceType, tagSessionForReplay } from '@/lib/posthog'
import { storefrontProductToItem } from '@/lib/analytics-ecommerce'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { CheckoutButton } from '@/components/shop/checkout/CheckoutButton'
import { streetCollectorCtaClass } from '@/lib/shop/street-collector-cta'
import { ShippingCountryNotListedLink } from '@/components/shop/checkout/ShippingCountryNotListedLink'
import {
  experienceArtworkUnitUsd,
  normalizeExperienceProductKey,
  storefrontVariantUsd,
} from '@/lib/shop/experience-artwork-unit-price'
import type { FeaturedBundleCheckoutPrices } from '@/lib/shop/experience-featured-bundle'
import {
  ARTWORKS_PER_FREE_LAMP,
  lampVolumeDiscountPercentForAllocated,
} from '@/lib/shop/lamp-artwork-volume-discount'
import { useShopDiscountFlags } from './ShopDiscountFlagsContext'
import type { CartEditionHold } from '@/lib/shop/cart-edition-hold-types'
import { EditionHoldCartSummary, EditionHoldIndicator } from './EditionHoldIndicator'
import {
  shopUnifiedTopBarDrawerHeightClass,
  shopUnifiedTopBarTopInsetClass,
} from '@/lib/shop/shop-unified-top-bar-layout'
import { stripeLineItemDescription } from '@/lib/shop/stripe-line-item-description'

/** Compact ± controls — globals.css gives all buttons min 44×44; qty-stepper-compact opts out */
const qtyStepperBtnClass =
  'qty-stepper-compact h-[22px] w-[22px] shrink-0 inline-flex items-center justify-center rounded border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-[#d4b8b8] bg-neutral-50 dark:bg-[#201c1c] hover:bg-neutral-100 dark:hover:bg-[#2a2424] transition-colors disabled:opacity-40 disabled:pointer-events-none'

/**
 * Consecutive same-SKU runs; splits when unit price differs (e.g. one bundle-priced line + extra at ladder price).
 */
function groupConsecutiveArtworksWithUnits(
  products: ShopifyProduct[],
  unitAtIndex: (p: ShopifyProduct, i: number) => number
): Array<{ product: ShopifyProduct; quantity: number; runStartIndex: number }> {
  const runs: Array<{ product: ShopifyProduct; quantity: number; runStartIndex: number }> = []
  let i = 0
  while (i < products.length) {
    const product = products[i]
    const unit = unitAtIndex(product, i)
    let j = i + 1
    while (j < products.length) {
      const p2 = products[j]
      if (p2.id !== product.id) break
      const u2 = unitAtIndex(p2, j)
      if (Math.round(u2 * 100) !== Math.round(unit * 100)) break
      j++
    }
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
  /** Active season tab — used only when API ladder misses (Storefront metafield + inventory fallback). */
  streetPricingSeasonFallback?: 1 | 2
  /** Featured artist bundle: allocated line prices for lamp + two spotlight prints */
  featuredBundleCheckout?: FeaturedBundleCheckoutPrices | null
  /** Which `selectedArtworks` indices use bundle unit prices (extras use natural ladder/lock prices). */
  bundlePricedArtworkIndices?: Set<number> | null
  /** When true, hide “+ Add lamp” until at least one artwork is in the cart (experience v3). */
  requireArtworkForLamp?: boolean
  /** Active 24h edition holds for cart artworks (numeric Shopify product id). */
  cartEditionHolds?: Record<string, CartEditionHold>
  cartEditionHoldSoonestExpiry?: string | null
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

function isProductCollected(productId: string, collectedIds?: Set<string>): boolean {
  if (!collectedIds?.size) return false
  const numeric = productId.replace(/^gid:\/\/shopify\/Product\//i, '') || productId
  return collectedIds.has(productId) || collectedIds.has(numeric)
}

function cartArtistLabel(product: ShopifyProduct): string | null {
  const vendor = product.vendor?.trim()
  if (!vendor || vendor.toLowerCase() === 'street collector') return null
  return vendor
}

function CartQtyStepper({
  quantity,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  increaseDisabled,
}: {
  quantity: number
  onDecrease: () => void
  onIncrease: () => void
  decreaseLabel: string
  increaseLabel: string
  increaseDisabled?: boolean
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button type="button" onClick={onDecrease} className={qtyStepperBtnClass} aria-label={decreaseLabel}>
        <Minus className="h-2.5 w-2.5" strokeWidth={2.5} />
      </button>
      <span className="min-w-[1.125rem] text-center text-[10px] font-medium tabular-nums">{quantity}</span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={increaseDisabled}
        className={qtyStepperBtnClass}
        aria-label={increaseLabel}
      >
        <Plus className="h-2.5 w-2.5" strokeWidth={2.5} />
      </button>
    </div>
  )
}

function CartLinePrice({
  amount,
  amountClassName,
  strikethrough,
}: {
  amount: React.ReactNode
  amountClassName?: string
  strikethrough?: React.ReactNode
}) {
  return (
    <div className="flex w-[4.75rem] shrink-0 flex-col items-end gap-0.5 text-right">
      <div className="flex flex-col items-end gap-0.5 whitespace-nowrap tabular-nums">
        {strikethrough}
        <span className={cn('text-sm font-medium text-foreground', amountClassName)}>{amount}</span>
      </div>
    </div>
  )
}

const OrderBarInner = forwardRef<OrderBarRef, OrderBarProps>(function OrderBarInner({
  lamp,
  selectedArtworks,
  lampQuantity,
  onLampQuantityChange,
  onAdjustArtworkQuantity,
  onSelectArtwork,
  onViewLampDetail,
  isGift,
  collectedProductIds,
  lockedArtworkPrices,
  streetLadderPrices,
  streetPricingSeasonFallback,
  featuredBundleCheckout,
  bundlePricedArtworkIndices,
  requireArtworkForLamp = false,
  cartEditionHolds,
  cartEditionHoldSoonestExpiry,
}, ref) {
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const { promoDiscount, promoCode, setOrderDrawerOpen } = useExperienceOrder()
  const { user } = useShopAuthContext()
  const pathname = usePathname()
  const { lampArtworkVolume: lampVolumeDiscountEnabled } = useShopDiscountFlags()

  useEffect(() => {
    setOrderDrawerOpen(drawerOpen)
    return () => setOrderDrawerOpen(false)
  }, [drawerOpen, setOrderDrawerOpen])

  const priceMaps = React.useMemo(
    () => ({
      lockedUsdByProductId: lockedArtworkPrices,
      streetLadderUsdByProductId: streetLadderPrices,
      seasonBandsFallback: streetPricingSeasonFallback,
    }),
    [lockedArtworkPrices, streetLadderPrices, streetPricingSeasonFallback]
  )

  const lampPrice = parsePrice(lamp)
  const artworkCount = selectedArtworks.length
  const includeLamp = lampQuantity > 0

  const lampPrices = React.useMemo(() => {
    if (
      featuredBundleCheckout?.lampLineUsd?.length &&
      featuredBundleCheckout.lampLineUsd.length === lampQuantity
    ) {
      return [...featuredBundleCheckout.lampLineUsd]
    }
    const prices: number[] = []
    for (let k = 1; k <= lampQuantity; k++) {
      const start = (k - 1) * ARTWORKS_PER_FREE_LAMP
      const end = k * ARTWORKS_PER_FREE_LAMP
      const allocated = Math.max(0, Math.min(artworkCount, end) - start)
      const discountPct = lampVolumeDiscountPercentForAllocated(allocated, lampVolumeDiscountEnabled)
      prices.push(lampPrice * Math.max(0, 1 - discountPct / 100))
    }
    return prices
  }, [lampQuantity, artworkCount, lampPrice, featuredBundleCheckout, lampVolumeDiscountEnabled])

  const artworkUnitUsd = React.useCallback(
    (p: ShopifyProduct, cartIndex: number) => {
      if (bundlePricedArtworkIndices?.has(cartIndex)) {
        const k = normalizeExperienceProductKey(p.id)
        const bundleUnit = featuredBundleCheckout?.artworkUnitUsdByNumericId[k]
        if (bundleUnit != null && bundleUnit > 0) return bundleUnit
      }
      return experienceArtworkUnitUsd(p, priceMaps)
    },
    [featuredBundleCheckout, priceMaps, bundlePricedArtworkIndices]
  )

  const artworkRuns = React.useMemo(
    () => groupConsecutiveArtworksWithUnits(selectedArtworks, artworkUnitUsd),
    [selectedArtworks, artworkUnitUsd]
  )

  const lampTotal = lampPrices.reduce((a, b) => a + b, 0)
  const naturalLampTotal = React.useMemo(() => {
    let sum = 0
    for (let k = 1; k <= lampQuantity; k++) {
      const start = (k - 1) * ARTWORKS_PER_FREE_LAMP
      const end = k * ARTWORKS_PER_FREE_LAMP
      const allocated = Math.max(0, Math.min(artworkCount, end) - start)
      const discountPct = lampVolumeDiscountPercentForAllocated(allocated, lampVolumeDiscountEnabled)
      sum += lampPrice * Math.max(0, 1 - discountPct / 100)
    }
    return sum
  }, [lampQuantity, artworkCount, lampPrice, lampVolumeDiscountEnabled])

  const naturalArtworksTotal = React.useMemo(
    () => selectedArtworks.reduce((sum, p) => sum + experienceArtworkUnitUsd(p, priceMaps), 0),
    [selectedArtworks, priceMaps]
  )

  const artworksTotal = selectedArtworks.reduce(
    (sum, p, i) => sum + artworkUnitUsd(p, i),
    0
  )
  const total = lampTotal + artworksTotal
  const lampSavings =
    lampQuantity > 0
      ? featuredBundleCheckout
        ? Math.max(0, naturalLampTotal + naturalArtworksTotal - total)
        : lampQuantity * lampPrice - lampTotal
      : 0
  const allAvailable = selectedArtworks.every((p) => p.availableForSale)
  const itemCount = selectedArtworks.length + lampQuantity

  useEffect(() => {
    if (!drawerOpen) return
    captureFunnelEvent(FunnelEvents.order_bar_opened, {
      surface: pathname?.includes('/experience-v3') || pathname === '/shop/experience' ? 'experience_v3' : 'experience_v2',
      device_type: getDeviceType(),
      item_count: itemCount,
      artwork_count: artworkCount,
      lamp_quantity: lampQuantity,
      total_value: Math.round(total * 100) / 100,
    })
    captureFunnelEvent(FunnelEvents.checkout_step_viewed, {
      step_name: 'order_bar',
      surface: pathname?.includes('/experience-v3') || pathname === '/shop/experience' ? 'experience_v3' : 'experience_v2',
      item_count: itemCount,
      total_value: Math.round(total * 100) / 100,
    })
  }, [artworkCount, drawerOpen, itemCount, lampQuantity, pathname, total])

  const activeCartHoldCount = React.useMemo(() => {
    if (!cartEditionHolds) return 0
    const seen = new Set<string>()
    for (const art of selectedArtworks) {
      const key = normalizeExperienceProductKey(art.id)
      if (key && cartEditionHolds[key]) seen.add(key)
    }
    return seen.size
  }, [cartEditionHolds, selectedArtworks])

  const buildLineItems = useCallback(() => {
    const items: Array<{
      productId: string
      variantId: string
      variantGid: string
      handle: string
      title: string
      variantTitle?: string
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
          variantTitle: stripeLineItemDescription(lamp.variants?.edges?.[0]?.node?.title),
          price,
          quantity: 1,
          image: lamp.featuredImage?.url ?? undefined,
          /** Hosted checkout must not replace per-lamp tier / volume prices with DB ladder. */
          priceBasis: 'client',
        })
      }
    }

    let wi = 0
    while (wi < selectedArtworks.length) {
      const art = selectedArtworks[wi]
      const unit = artworkUnitUsd(art, wi)
      let wj = wi + 1
      while (wj < selectedArtworks.length) {
        const art2 = selectedArtworks[wj]
        if (art2.id !== art.id) break
        const u2 = artworkUnitUsd(art2, wj)
        if (Math.round(u2 * 100) !== Math.round(unit * 100)) break
        wj++
      }
      if (!art.availableForSale) {
        wi = wj
        continue
      }
      const qty = wj - wi
      const runUsesBundlePrice =
        bundlePricedArtworkIndices != null &&
        Array.from({ length: wj - wi }, (_, d) => wi + d).some((idx) =>
          bundlePricedArtworkIndices.has(idx)
        )
      items.push({
        productId: art.id.replace('gid://shopify/Product/', ''),
        variantId: getVariantId(art),
        variantGid: art.variants?.edges?.[0]?.node?.id ?? '',
        handle: art.handle,
        title: art.title,
        variantTitle: stripeLineItemDescription(art.variants?.edges?.[0]?.node?.title),
        price: unit,
        quantity: qty,
        image: art.featuredImage?.url ?? undefined,
        ...(runUsesBundlePrice ? { priceBasis: 'client' as const } : {}),
      })
      wi = wj
    }
    return items
  }, [lamp, lampQuantity, lampPrices, selectedArtworks, artworkUnitUsd, bundlePricedArtworkIndices])

  const shippingOutreachOrderSummary = useMemo(
    () =>
      buildLineItems()
        .map((item) => {
          const variant = item.variantTitle ? ` (${item.variantTitle})` : ''
          return `${item.quantity}× ${item.title}${variant}`
        })
        .join('\n'),
    [buildLineItems]
  )

  const buildGaProductItems = useCallback((): ReturnType<typeof storefrontProductToItem>[] => {
    const artworkLineItems: ReturnType<typeof storefrontProductToItem>[] = []
    let ai = 0
    while (ai < selectedArtworks.length) {
      const p = selectedArtworks[ai]
      const unit = artworkUnitUsd(p, ai)
      let aj = ai + 1
      while (aj < selectedArtworks.length) {
        const p2 = selectedArtworks[aj]
        if (p2.id !== p.id) break
        const u2 = artworkUnitUsd(p2, aj)
        if (Math.round(u2 * 100) !== Math.round(unit * 100)) break
        aj++
      }
      const qty = aj - ai
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
    return lampQuantity > 0
      ? [storefrontProductToItem(lamp, lamp.variants?.edges?.[0]?.node, lampQuantity), ...artworkLineItems]
      : artworkLineItems
  }, [lamp, lampQuantity, selectedArtworks, artworkUnitUsd])

  const handleContinueToHostedCheckout = useCallback(async () => {
    setError(null)
    if (itemCount === 0 || !allAvailable) return
    setIsCheckingOut(true)
    try {
      captureFunnelEvent(FunnelEvents.checkout_clicked, {
        source: 'experience_order_bar',
        surface: pathname?.includes('/experience-v3') || pathname === '/shop/experience' ? 'experience_v3' : 'experience_v2',
        item_count: itemCount,
        artwork_count: artworkCount,
        lamp_quantity: lampQuantity,
        total_value: Math.round(total * 100) / 100,
      })
      const lineItems = buildLineItems().map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        variantGid: item.variantGid,
        handle: item.handle,
        title: item.title,
        variantTitle: item.variantTitle,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        ...(item.priceBasis === 'client' ? { priceBasis: 'client' as const } : {}),
      }))
      const cancelBase =
        typeof window !== 'undefined' && pathname
          ? `${window.location.origin}${pathname.split('?')[0]}`
          : ''
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lineItems,
          creditsToUse: 0,
          shippingRequired: true,
          customerEmail: user?.email || undefined,
          promoCode: promoCode?.trim() || undefined,
          cancelUrl: cancelBase ? `${cancelBase}?cancelled=true` : undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }
      const productItems = buildGaProductItems()
      if (productItems.length > 0) {
        trackBeginCheckout(productItems, total, 'USD', {
          em: user?.email || undefined,
        })
      }
      if (data.type === 'credit_only' || data.type === 'zero_dollar') {
        window.location.href = data.completeUrl
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      throw new Error('No checkout URL returned')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Please try again.'
      setError(message)
      setIsCheckingOut(false)
      captureCheckoutError({ error_message: message, source: 'experience_order_bar' })
      tagSessionForReplay('checkout-error')
    }
  }, [
    allAvailable,
    artworkCount,
    buildGaProductItems,
    buildLineItems,
    itemCount,
    lampQuantity,
    pathname,
    promoCode,
    total,
    user?.email,
  ])

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
      const message = err instanceof Error ? err.message : 'Please try again.'
      setError(message)
      captureCheckoutError({ error_message: message, source: 'order_bar_test' })
      tagSessionForReplay('checkout-error')
    }
  }, [lamp])

  useImperativeHandle(ref, () => ({ testZeroOrder: handleTestZeroOrder }), [handleTestZeroOrder])

  const orderBarSurface =
    pathname?.includes('/experience-v3') || pathname === '/shop/experience' ? 'experience_v3' : 'experience_v2'

  const handleClose = useCallback(() => {
    captureFunnelEvent(FunnelEvents.order_bar_closed, {
      surface: orderBarSurface,
      item_count: itemCount,
      artwork_count: artworkCount,
      lamp_quantity: lampQuantity,
      total_value: Math.round(total * 100) / 100,
    })
    setDrawerOpen(false)
  }, [orderBarSurface, itemCount, artworkCount, lampQuantity, total])

  const handleToggleDrawer = useCallback(() => {
    setDrawerOpen((open) => {
      if (open) {
        captureFunnelEvent(FunnelEvents.order_bar_closed, {
          surface: orderBarSurface,
          item_count: itemCount,
          artwork_count: artworkCount,
          lamp_quantity: lampQuantity,
          total_value: Math.round(total * 100) / 100,
        })
        return false
      }
      return true
    })
  }, [orderBarSurface, itemCount, artworkCount, lampQuantity, total])

  useExperienceOpenOrder(handleToggleDrawer)

  const handleArtworkSelect = useCallback(
    (product: ShopifyProduct) => {
      onSelectArtwork?.(product)
      setDrawerOpen(false)
    },
    [onSelectArtwork]
  )

  /* ─── Order summary & cart ─── */
  const lampOriginalTotal = lampQuantity * lampPrice

  const cartLineRowClass = 'flex gap-3 rounded-lg px-4 py-3 text-sm text-foreground'

  const cartMenuRowClass =
    'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/80 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

  const cartItemsSection = (
    <section className="px-2 pb-3">
      <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Your Street Lamp + artworks
      </p>
      {activeCartHoldCount > 1 ? (
        <div className="px-2 pb-2">
          <EditionHoldCartSummary
            holdCount={activeCartHoldCount}
            soonestExpiry={cartEditionHoldSoonestExpiry ?? null}
            holds={Object.values(cartEditionHolds ?? {})}
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-0.5">
        {lampQuantity > 0 && (
          <div className={cartLineRowClass}>
            <ExperienceOrderLampIcon className="h-10 w-10 shrink-0 text-muted-foreground" />
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {onViewLampDetail ? (
                  <button
                    type="button"
                    onClick={() => onViewLampDetail(lamp)}
                    className={cn(
                      'block w-full min-w-0 rounded-lg text-left transition-colors',
                      'text-foreground hover:text-experience-highlight dark:hover:text-[#60A5FA]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                    )}
                    aria-label="View Street Lamp product details"
                  >
                    <span className="block truncate font-medium">
                      Street {lampQuantity > 1 ? 'Lamps' : 'Lamp'}
                    </span>
                  </button>
                ) : (
                  <span className="block truncate font-medium text-foreground">
                    Street {lampQuantity > 1 ? 'Lamps' : 'Lamp'}
                  </span>
                )}
                {lampSavings > 0 ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-green-600">
                    <TicketIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Saving ${formatPriceCompact(lampSavings)}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <CartQtyStepper
                  quantity={lampQuantity}
                  onDecrease={() => onLampQuantityChange(Math.max(0, lampQuantity - 1))}
                  onIncrease={() => onLampQuantityChange(Math.min(99, lampQuantity + 1))}
                  decreaseLabel="Decrease lamp quantity"
                  increaseLabel="Increase lamp quantity"
                  increaseDisabled={lampQuantity >= 99}
                />
                <CartLinePrice
                  amount={lampTotal === 0 ? 'FREE' : `$${formatPriceCompact(lampTotal)}`}
                  amountClassName={lampTotal === 0 ? 'text-green-600' : undefined}
                  strikethrough={
                    lampSavings > 0 ? (
                      <span className="text-xs text-muted-foreground line-through">
                        ${formatPriceCompact(lampOriginalTotal)}
                      </span>
                    ) : undefined
                  }
                />
              </div>
            </div>
          </div>
        )}
        {artworkRuns.map(({ product: art, quantity, runStartIndex }) => {
          const collected = isProductCollected(art.id, collectedProductIds)
          const hold = cartEditionHolds?.[normalizeExperienceProductKey(art.id)]
          const lineSubtotal = artworkUnitUsd(art, runStartIndex) * quantity
          const artistLabel = cartArtistLabel(art)
          const titleButtonClass = cn(
            'block w-full min-w-0 rounded-lg text-left transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            onSelectArtwork
              ? 'hover:text-experience-highlight dark:hover:text-[#60A5FA]'
              : 'text-foreground'
          )
          const titleContent = (
            <>
              <span
                className={cn(
                  'block truncate font-medium',
                  !art.availableForSale && 'text-muted-foreground line-through'
                )}
              >
                {art.title}
                {collected ? (
                  <span className="ml-1 text-[10px] font-normal text-emerald-600 dark:text-emerald-500">
                    (Collected)
                  </span>
                ) : null}
              </span>
              {artistLabel ? (
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{artistLabel}</span>
              ) : null}
            </>
          )
          return (
            <div key={`${art.id}-${runStartIndex}`} className="space-y-0.5">
              <div className={cartLineRowClass}>
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  {art.featuredImage?.url ? (
                    <Image
                      src={art.featuredImage.url}
                      alt=""
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
                      —
                    </div>
                  )}
                  {collected ? (
                    <div
                      className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500"
                      title="Already in your collection"
                    >
                      <Package className="h-2 w-2 text-white" strokeWidth={2.5} />
                    </div>
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {onSelectArtwork ? (
                      <button
                        type="button"
                        onClick={() => handleArtworkSelect(art)}
                        className={titleButtonClass}
                        aria-label={`Review artwork: ${art.title}`}
                      >
                        {titleContent}
                      </button>
                    ) : (
                      <div className="min-w-0">{titleContent}</div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <CartQtyStepper
                      quantity={quantity}
                      onDecrease={() => onAdjustArtworkQuantity(runStartIndex, -1)}
                      onIncrease={() => onAdjustArtworkQuantity(runStartIndex, 1)}
                      decreaseLabel={`Remove one ${art.title} from order`}
                      increaseLabel={`Add another ${art.title}`}
                      increaseDisabled={!art.availableForSale}
                    />
                    <CartLinePrice amount={`$${formatPriceCompact(lineSubtotal)}`} />
                  </div>
                </div>
              </div>
              {hold ? (
                <div className="px-4 pb-1 pl-[3.25rem]">
                  <EditionHoldIndicator hold={hold} variant="line" />
                </div>
              ) : null}
            </div>
          )
        })}
        {lampQuantity > 0 && selectedArtworks.length === 1 ? (
          <p
            className="mx-2 mt-1 rounded-lg border border-experience-highlight/25 bg-experience-highlight/5 px-3 py-2 text-xs leading-snug text-muted-foreground"
            role="status"
          >
            Your Street Lamp lights both sides — add a second artwork so each face gets its own piece.
          </p>
        ) : null}
        {lampQuantity === 0 && (!requireArtworkForLamp || selectedArtworks.length > 0) && (
          <button
            type="button"
            onClick={() => onLampQuantityChange(1)}
            className={cn(
              cartMenuRowClass,
              'mx-2 text-experience-highlight dark:text-[#60A5FA]'
            )}
          >
            <svg
              viewBox="0 0 306 400"
              fill="currentColor"
              className="h-4 w-5 shrink-0 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
            </svg>
            <span className="font-medium">+ Add lamp</span>
          </button>
        )}
      </div>
    </section>
  )

  const finalTotal = Math.max(0, total - promoDiscount)
  const checkoutButtonDisabled = itemCount === 0 || !allAvailable || isCheckingOut
  const placeOrderButton = (
    <CheckoutButton
      variant="default"
      amount={finalTotal}
      disabled={checkoutButtonDisabled}
      onClick={handleContinueToHostedCheckout}
      className={cn('text-sm relative', streetCollectorCtaClass, 'shadow-experience-cta/30')}
    >
      {isCheckingOut ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden />
          Redirecting…
        </>
      ) : (
        <>
          Continue to Secure Checkout
          <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
        </>
      )}
    </CheckoutButton>
  )

  const cartFooterSection = (
    <div className="shrink-0 border-t border-border bg-background shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.18)]">
      <div className="space-y-3 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="space-y-2 px-1 text-sm">
          <div data-testid="delivery-summary-item" className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium text-foreground">Free</span>
          </div>
          <div data-testid="total-summary-item" className="flex justify-between border-t border-border/70 pt-2">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold tabular-nums text-foreground">
              <AnimatedPrice value={Math.max(0, total - promoDiscount)} />
            </span>
          </div>
        </div>
        {error ? <p className="text-center text-sm text-red-500 dark:text-red-400">{error}</p> : null}
        {placeOrderButton}
        <ShippingCountryNotListedLink
          variant="dark"
          customerEmail={user?.email ?? undefined}
          orderSummary={shippingOutreachOrderSummary}
          className="mt-1"
        />
        <div className="grid grid-cols-2 gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-muted/60 px-2.5 py-1.5 text-[10px] leading-tight text-muted-foreground [&>svg]:size-[1em] [&>svg]:shrink-0">
            <Package strokeWidth={1} />
            Free worldwide shipping · 9–15 business days
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-muted/60 px-2.5 py-1.5 text-[10px] leading-tight text-muted-foreground [&>svg]:size-[1em] [&>svg]:shrink-0">
            <Shield strokeWidth={1} />
            12 months guarantee
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-muted/60 px-2.5 py-1.5 text-[10px] leading-tight text-muted-foreground [&>svg]:size-[1em] [&>svg]:shrink-0">
            <RotateCcw strokeWidth={1} />
            Easy 30 days returns
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-muted/60 px-2.5 py-1.5 text-[10px] leading-tight text-muted-foreground [&>svg]:size-[1em] [&>svg]:shrink-0">
            <Lock strokeWidth={1} />
            Secure payment
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className={cn('fixed inset-0 z-[200]', drawerOpen ? 'pointer-events-auto' : 'pointer-events-none')} aria-hidden={!drawerOpen}>
      {/* Backdrop — above unified top bar (z-[122]), collection toggle (z-[130]/z-[140]), sticky bar (z-[52]) */}
      <div
        onClick={handleClose}
        className={cn(
          'fixed inset-0 pointer-events-auto z-[201] bg-black/30 transition-opacity duration-200',
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
      />
      {/* Drawer — fixed full-height panel below unified top bar */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Your Collection"
        className={cn(
          'fixed right-0 bottom-0 z-[202] flex w-full max-w-[min(100vw,28rem)] flex-col overflow-hidden border-l border-border bg-background text-foreground shadow-2xl sm:max-w-[min(100vw,30rem)] md:max-w-[480px]',
          shopUnifiedTopBarTopInsetClass,
          shopUnifiedTopBarDrawerHeightClass,
          'pointer-events-auto pr-[env(safe-area-inset-right,0px)]',
          'transition-transform duration-300 will-change-transform',
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2 className="min-w-0 text-sm font-semibold text-foreground">Your Collection</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close cart"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2 scrollbar-prominent">
            {cartItemsSection}
          </div>
          {cartFooterSection}
        </div>
      </div>
    </div>
  )
})

export const OrderBar = OrderBarInner
