'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { XMarkIcon, TicketIcon } from '@heroicons/react/24/solid'
import { Package, Shield, RotateCcw, Lock, Minus, Plus, Loader2, ChevronRight } from 'lucide-react'
import { ExperienceOrderLampIcon } from './ExperienceOrderLampIcon'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn, formatPriceCompact } from '@/lib/utils'
import { useExperienceOpenOrder, useExperienceOrder } from '../ExperienceOrderContext'
import { trackBeginCheckout } from '@/lib/google-analytics'
import { captureCheckoutError, tagSessionForReplay } from '@/lib/posthog'
import { storefrontProductToItem } from '@/lib/analytics-ecommerce'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { CheckoutButton } from '@/components/shop/checkout/CheckoutButton'
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
import {
  EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS,
  resolveExperienceNextAction,
} from '@/lib/shop/experience-journey-next-action'

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
}, ref) {
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const { promoDiscount, promoCode, pickerEngaged, setOrderDrawerOpen } = useExperienceOrder()
  const { user } = useShopAuthContext()
  const pathname = usePathname()
  const { lampArtworkVolume: lampVolumeDiscountEnabled } = useShopDiscountFlags()

  useExperienceOpenOrder(() => {
    setDrawerOpen(true)
  })

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
          variantTitle: lamp.variants?.edges?.[0]?.node?.title ?? undefined,
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
        variantTitle: art.variants?.edges?.[0]?.node?.title ?? undefined,
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
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setError(message)
      setIsCheckingOut(false)
      captureCheckoutError({ error_message: message, source: 'experience_order_bar' })
      tagSessionForReplay('checkout-error')
    }
  }, [
    allAvailable,
    buildGaProductItems,
    buildLineItems,
    itemCount,
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
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setError(message)
      captureCheckoutError({ error_message: message, source: 'order_bar_test' })
      tagSessionForReplay('checkout-error')
    }
  }, [lamp])

  useImperativeHandle(ref, () => ({ testZeroOrder: handleTestZeroOrder }), [handleTestZeroOrder])

  const handleClose = () => {
    setDrawerOpen(false)
  }

  const journeyNextAction = React.useMemo(
    () =>
      resolveExperienceNextAction({
        lampQuantity,
        artworkCount: selectedArtworks.length,
        pickerEngaged,
        orderDrawerOpen: drawerOpen,
        hasAddress: false,
        hasPaymentSelection: false,
        paymentSectionExpanded: false,
        paymentStripeUnlocked: false,
        stripeHostedInDrawer: true,
      }),
    [lampQuantity, selectedArtworks.length, pickerEngaged, drawerOpen]
  )

  const journeyHighlight = EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS

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
              {onViewLampDetail ? (
                <button
                  type="button"
                  onClick={() => onViewLampDetail(lamp)}
                  className={cn(
                    'shrink-0 rounded-lg p-0.5 -m-0.5 transition-colors',
                    'text-neutral-400 dark:text-[#d4b8b8]',
                    'hover:text-[#047AFF] dark:hover:text-[#60A5FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047AFF]'
                  )}
                  aria-label="View Street Lamp product details"
                >
                  <ExperienceOrderLampIcon className="h-7 w-7" />
                </button>
              ) : (
                <ExperienceOrderLampIcon className={cn('h-7 w-7', 'text-neutral-400 dark:text-[#d4b8b8]')} />
              )}
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
          const lineSubtotal = artworkUnitUsd(art, runStartIndex) * quantity
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

  const finalTotal = Math.max(0, total - promoDiscount)
  const checkoutButtonDisabled = itemCount === 0 || !allAvailable || isCheckingOut
  const placeOrderButton = (
    <CheckoutButton
      variant="default"
      amount={finalTotal}
      disabled={checkoutButtonDisabled}
      onClick={handleContinueToHostedCheckout}
      className={cn(
        'text-sm relative',
        journeyNextAction === 'place_order' && journeyHighlight
      )}
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
            <div className="pb-3">
              <h3 className="text-lg font-semibold text-neutral-950 dark:text-[#FFBA94] mb-4">Your Collection</h3>
            </div>
            <div className="border-t border-neutral-200 dark:border-white/10 pt-5">
              {orderSummary}
            </div>
            {error && <p className="mt-2 text-center text-red-500 dark:text-red-400">{error}</p>}
            <div className="mt-8">
              {placeOrderButton}
              <ShippingCountryNotListedLink
                variant="dark"
                customerEmail={user?.email ?? undefined}
                orderSummary={shippingOutreachOrderSummary}
                className="mt-3"
              />
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
    </div>
  )
})

export const OrderBar = OrderBarInner
