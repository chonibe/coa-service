'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { useExperienceOrder } from '@/app/(store)/shop/experience-v2/ExperienceOrderContext'
import { loadExperienceCart, saveExperienceCart } from '@/lib/shop/experience-cart-persistence'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import { experienceArtworkUnitUsd } from '@/lib/shop/experience-artwork-unit-price'
import {
  ARTWORKS_PER_FREE_LAMP,
  lampVolumeDiscountPercentForAllocated,
} from '@/lib/shop/lamp-artwork-volume-discount'
import { fetchStreetEditionStatesMap } from '@/lib/shop/fetch-street-edition-states-client'
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { useShopDiscountFlags } from '@/app/(store)/shop/experience-v2/components/ShopDiscountFlagsContext'
import { useCartEditionHolds } from '@/lib/shop/use-cart-edition-holds'
import { homeV2LandingContent } from '@/content/home-v2-landing'

const OrderBar = dynamic(
  () =>
    import('@/app/(store)/shop/experience-v2/components/OrderBar').then((m) => ({
      default: m.OrderBar,
    })),
  { ssr: false }
)

function uniqueCartIdsInOrder(cartOrder: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of cartOrder) {
    const key = normalizeShopifyProductId(id) ?? id
    if (seen.has(key)) continue
    seen.add(key)
    out.push(id)
  }
  return out
}

interface LandingExperienceCartShellProps {
  lamp: ShopifyProduct
}

export function LandingExperienceCartShell({ lamp }: LandingExperienceCartShellProps) {
  const router = useRouter()
  const { isAuthenticated } = useShopAuthContext()
  const { lampArtworkVolume: lampVolumeDiscountEnabled } = useShopDiscountFlags()
  const { setOrderSummary, setOrderBarProps, orderBarRef } = useExperienceOrder()

  const [initialCart] = useState(() => loadExperienceCart())
  const [cartOrder, setCartOrder] = useState<string[]>(() => initialCart.cartOrder)
  const [lampQuantity, setLampQuantity] = useState(() => initialCart.lampQuantity)
  const [lampPreviewOrder, setLampPreviewOrder] = useState<string[]>(() => initialCart.lampPreviewOrder)
  const [cartProductsById, setCartProductsById] = useState<Record<string, ShopifyProduct>>({})
  const [streetEditionByProductId, setStreetEditionByProductId] = useState<
    Record<string, StreetEditionStatesRow>
  >({})
  const [lockedArtworkPrices, setLockedArtworkPrices] = useState<Record<string, number>>({})

  const reloadCartFromStorage = useCallback(() => {
    const snapshot = loadExperienceCart()
    setCartOrder(snapshot.cartOrder)
    setLampQuantity(snapshot.lampQuantity)
    setLampPreviewOrder(snapshot.lampPreviewOrder)
  }, [])

  useEffect(() => {
    saveExperienceCart(cartOrder, lampQuantity, lampPreviewOrder)
  }, [cartOrder, lampQuantity, lampPreviewOrder])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key == null || event.key === 'sc-experience-cart-v2') {
        reloadCartFromStorage()
      }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', reloadCartFromStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', reloadCartFromStorage)
    }
  }, [reloadCartFromStorage])

  const uniqueIds = useMemo(() => uniqueCartIdsInOrder(cartOrder), [cartOrder])

  useEffect(() => {
    if (uniqueIds.length === 0) {
      setCartProductsById({})
      return
    }
    let cancelled = false
    const query = encodeURIComponent(uniqueIds.join(','))
    fetch(`/api/shop/cart/products?ids=${query}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data: { products?: ShopifyProduct[] }) => {
        if (cancelled) return
        const next: Record<string, ShopifyProduct> = {}
        for (const product of data.products ?? []) {
          const key = normalizeShopifyProductId(product.id) ?? product.id
          next[key] = product
        }
        setCartProductsById(next)
      })
      .catch(() => {
        if (!cancelled) setCartProductsById({})
      })
    return () => {
      cancelled = true
    }
  }, [uniqueIds.join(',')])

  const findProductByCartId = useCallback(
    (cartId: string) => {
      const key = normalizeShopifyProductId(cartId) ?? cartId
      return cartProductsById[key] ?? null
    },
    [cartProductsById]
  )

  const selectedArtworks = useMemo(
    () => cartOrder.map((id) => findProductByCartId(id)).filter(Boolean) as ShopifyProduct[],
    [cartOrder, findProductByCartId]
  )

  useEffect(() => {
    const ids = uniqueIds
      .map((id) => normalizeShopifyProductId(id))
      .filter((x): x is string => Boolean(x))
    if (ids.length === 0) return
    let cancelled = false
    const t = window.setTimeout(() => {
      void fetchStreetEditionStatesMap(ids)
        .then((map) => {
          if (!cancelled) setStreetEditionByProductId(map)
        })
        .catch(() => {})
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [uniqueIds.join(',')])

  useEffect(() => {
    if (!isAuthenticated) {
      setLockedArtworkPrices({})
      return
    }
    fetch('/api/shop/reserve/locks', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { locks: [] }))
      .then((j: { locks?: Array<{ shopify_product_id: string; locked_price_usd: number }> }) => {
        const m: Record<string, number> = {}
        for (const row of j.locks || []) {
          if (row.shopify_product_id && row.locked_price_usd > 0) {
            m[row.shopify_product_id] = row.locked_price_usd
          }
        }
        setLockedArtworkPrices(m)
      })
      .catch(() => setLockedArtworkPrices({}))
  }, [isAuthenticated])

  const streetLadderPrices = useMemo(() => {
    const m: Record<string, number> = {}
    for (const [id, row] of Object.entries(streetEditionByProductId)) {
      if (row.priceUsd != null && row.priceUsd > 0) m[id] = row.priceUsd
    }
    return m
  }, [streetEditionByProductId])

  const artworkPriceMaps = useMemo(
    () => ({
      lockedUsdByProductId: lockedArtworkPrices,
      streetLadderUsdByProductId: streetLadderPrices,
      seasonBandsFallback: 2 as const,
    }),
    [lockedArtworkPrices, streetLadderPrices]
  )

  const lampPrice = parseFloat(lamp.priceRange?.minVariantPrice?.amount ?? '0')
  const artworkCount = selectedArtworks.length

  const lampPrices = useMemo(() => {
    const prices: number[] = []
    for (let k = 1; k <= lampQuantity; k++) {
      const start = (k - 1) * ARTWORKS_PER_FREE_LAMP
      const end = k * ARTWORKS_PER_FREE_LAMP
      const allocated = Math.max(0, Math.min(artworkCount, end) - start)
      const discountPct = lampVolumeDiscountPercentForAllocated(allocated, lampVolumeDiscountEnabled)
      prices.push(lampPrice * Math.max(0, 1 - discountPct / 100))
    }
    return prices
  }, [lampQuantity, artworkCount, lampPrice, lampVolumeDiscountEnabled])

  const orderTotal = useMemo(() => {
    const artworkSubtotal = selectedArtworks.reduce(
      (sum, product) => sum + experienceArtworkUnitUsd(product, artworkPriceMaps),
      0
    )
    return lampPrices.reduce((a, b) => a + b, 0) + artworkSubtotal
  }, [selectedArtworks, lampPrices, artworkPriceMaps])

  const orderItemCount = selectedArtworks.length + lampQuantity

  const {
    cartHoldsByProductId: cartEditionHolds,
    soonestExpiry: cartEditionHoldSoonestExpiry,
  } = useCartEditionHolds({
    cartProductGids: cartOrder,
    streetEditionByProductId,
  })

  const handleLampQuantityChange = useCallback(
    (n: number) => {
      const next = Math.max(0, n)
      if (next > 0 && cartOrder.length === 0) return
      setLampQuantity(next)
    },
    [cartOrder.length]
  )

  useEffect(() => {
    if (cartOrder.length === 0 && lampQuantity > 0) {
      setLampQuantity(0)
    }
  }, [cartOrder.length, lampQuantity])

  const handleAdjustArtworkQuantity = useCallback((runStartIndex: number, delta: 1 | -1) => {
    if (delta === -1) {
      setCartOrder((prev) => {
        const id = prev[runStartIndex]
        if (!id) return prev
        let end = runStartIndex
        while (end < prev.length && prev[end] === id) end++
        const removeIndex = end - 1
        return prev.filter((_, i) => i !== removeIndex)
      })
      return
    }
    setCartOrder((prev) => {
      const id = prev[runStartIndex]
      if (!id) return prev
      let end = runStartIndex
      while (end < prev.length && prev[end] === id) end++
      const next = [...prev]
      next.splice(end, 0, id)
      return next
    })
  }, [])

  const handleSelectArtworkFromCart = useCallback(
    (product: ShopifyProduct) => {
      const handle = product.handle?.trim()
      if (!handle) return
      router.push(`${homeV2LandingContent.urls.experience}?artwork=${encodeURIComponent(handle)}`)
    },
    [router]
  )

  useEffect(() => {
    setOrderSummary({ total: orderTotal, itemCount: orderItemCount })
  }, [orderTotal, orderItemCount, setOrderSummary])

  useEffect(() => {
    setOrderBarProps({
      lamp,
      selectedArtworks,
      lampQuantity,
      onLampQuantityChange: handleLampQuantityChange,
      onAdjustArtworkQuantity: handleAdjustArtworkQuantity,
      onSelectArtwork: handleSelectArtworkFromCart,
      onViewLampDetail: () => {},
      isGift: false,
      lampPrice,
      lampTotal: lampPrices.reduce((a, b) => a + b, 0),
      artworkCount,
      pastLampPaywall: true,
      lockedArtworkPrices,
      streetLadderPrices,
      streetPricingSeasonFallback: 2,
      requireArtworkForLamp: true,
      cartEditionHolds,
      cartEditionHoldSoonestExpiry,
    })
  }, [
    lamp,
    selectedArtworks,
    lampQuantity,
    lampPrice,
    lampPrices,
    artworkCount,
    lockedArtworkPrices,
    streetLadderPrices,
    cartEditionHolds,
    cartEditionHoldSoonestExpiry,
    handleLampQuantityChange,
    handleAdjustArtworkQuantity,
    handleSelectArtworkFromCart,
    setOrderBarProps,
  ])

  return (
    <OrderBar
      ref={orderBarRef}
      lamp={lamp}
      selectedArtworks={selectedArtworks}
      lampQuantity={lampQuantity}
      onLampQuantityChange={handleLampQuantityChange}
      onAdjustArtworkQuantity={handleAdjustArtworkQuantity}
      onSelectArtwork={handleSelectArtworkFromCart}
      onViewLampDetail={() => {}}
      isGift={false}
      lockedArtworkPrices={lockedArtworkPrices}
      streetLadderPrices={streetLadderPrices}
      streetPricingSeasonFallback={2}
      requireArtworkForLamp
      cartEditionHolds={cartEditionHolds}
      cartEditionHoldSoonestExpiry={cartEditionHoldSoonestExpiry}
    />
  )
}
