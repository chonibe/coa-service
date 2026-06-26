'use client'

import { useEffect, useRef, useState } from 'react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'

/** `ProductListFields` only requests `images(first: 2)` — hydrate full gallery on demand. */
const LIST_FRAGMENT_IMAGE_CAP = 2

function galleryImageCount(product: ShopifyProduct | null | undefined): number {
  return product?.images?.edges?.length ?? 0
}

function galleryLooksComplete(cached: ShopifyProduct, list: ShopifyProduct): boolean {
  if (cached !== list) return true
  return galleryImageCount(list) < LIST_FRAGMENT_IMAGE_CAP
}

/**
 * Upgrades lightweight list products to full Storefront gallery data (images first: 50).
 * Caches by handle so revisiting artworks does not re-fetch.
 */
export function useGalleryProductHydration(
  listProduct: ShopifyProduct | null,
  options?: { initialFullProduct?: ShopifyProduct | null }
): ShopifyProduct | null {
  const cacheRef = useRef<Map<string, ShopifyProduct>>(new Map())
  const abortRef = useRef<AbortController | null>(null)
  const seededRef = useRef(false)

  if (!seededRef.current && options?.initialFullProduct?.handle) {
    cacheRef.current.set(options.initialFullProduct.handle, options.initialFullProduct)
    seededRef.current = true
  }

  const [galleryProduct, setGalleryProduct] = useState<ShopifyProduct | null>(() => {
    if (!listProduct) return null
    const handle = listProduct.handle
    if (!handle) return listProduct
    const cached = options?.initialFullProduct?.handle === handle
      ? options.initialFullProduct
      : cacheRef.current.get(handle)
    return cached ?? listProduct
  })

  useEffect(() => {
    if (!listProduct) {
      setGalleryProduct(null)
      return
    }

    const handle = listProduct.handle
    if (!handle) {
      setGalleryProduct(listProduct)
      return
    }

    const cached = cacheRef.current.get(handle)
    if (cached && galleryLooksComplete(cached, listProduct)) {
      setGalleryProduct(cached)
      return
    }

    setGalleryProduct(cached ?? listProduct)

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    fetch(`/api/shop/products/${encodeURIComponent(handle)}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.product || ac.signal.aborted) return
        const full = data.product as ShopifyProduct
        cacheRef.current.set(handle, full)
        setGalleryProduct(full)
      })
      .catch(() => {})

    return () => ac.abort()
  }, [listProduct])

  return galleryProduct
}
