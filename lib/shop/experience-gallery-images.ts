import type { ShopifyImage, ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'

/** Hero column on narrow viewports — ~480px logical × 2 retina. */
export const EXPERIENCE_GALLERY_HERO_MOBILE_PX = 480

/** Hero column max CSS width ≈ min(72vh,820px)×3/4 (~615px); 2× retina ≈ 1230 — cap transfer size. */
export const EXPERIENCE_GALLERY_HERO_PX = 1000

/** Thumbnail rail: w-12 (48px) × 2 for retina. */
export const EXPERIENCE_GALLERY_THUMB_PX = 96

/** Zoom dialog — full viewport, still below raw Shopify master. */
export const EXPERIENCE_GALLERY_LIGHTBOX_PX = 1800

/** Spline texture — deferred idle load; keep moderate. */
export const EXPERIENCE_GALLERY_SPLINE_PX = 1000

export function getFirstProductImageUrl(product: ShopifyProduct | null | undefined): string | null {
  if (!product) return null
  return product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null
}

/** Featured image first, then remaining photos in order. */
export function collectProductImages(product: ShopifyProduct | null): ShopifyImage[] {
  if (!product) return []
  const edges = product.images?.edges?.map((e) => e.node) ?? []
  const feat = product.featuredImage
  if (feat?.url) {
    const featUrl = feat.url
    const rest = edges.filter((n) => n.url && n.url !== featUrl)
    return [{ ...feat }, ...rest]
  }
  if (edges.length > 0) return edges
  const u = getFirstProductImageUrl(product)
  if (!u) return []
  return [{ url: u, altText: product.title, width: null, height: null } as ShopifyImage]
}

/** Multi-image products default to index 1 (lifestyle); single image uses 0. */
export function getDefaultGalleryIndex(imageCount: number): number {
  return imageCount >= 2 ? 1 : 0
}

/**
 * Picks the first-load preview artwork when there is no stronger signal
 * (`?artwork=` deep link / `initialSelectedArtwork`).
 *
 * Prefers the in-season (season 2) pool when non-empty, else season 1.
 * Among that pool, prefers `availableForSale !== false`, then uniform random.
 * Cart / lamp-preview persistence does not override this — but last-viewed artwork
 * (localStorage) does on the client when there is no `?artwork=` deep link.
 *
 * @param random - injectable RNG in `[0, 1)` for tests; defaults to `Math.random`.
 */
export function pickInitialPreviewProduct(
  productsSeason1: ShopifyProduct[],
  productsSeason2: ShopifyProduct[],
  random: () => number = Math.random
): ShopifyProduct | null {
  const pool = productsSeason2.length > 0 ? productsSeason2 : productsSeason1
  if (pool.length === 0) return null
  const purchasable = pool.filter((p) => p.availableForSale !== false)
  const candidates = purchasable.length > 0 ? purchasable : pool
  const index = Math.floor(random() * candidates.length)
  return candidates[index] ?? null
}

export function getGalleryHeroImageUrl(
  product: ShopifyProduct | null,
  galleryIndex?: number,
  width: number = EXPERIENCE_GALLERY_HERO_PX
): string | null {
  const images = collectProductImages(product)
  if (images.length === 0) return null
  const idx = galleryIndex ?? getDefaultGalleryIndex(images.length)
  const node = images[idx] ?? images[0]
  if (!node?.url) return null
  return getShopifyImageUrl(node.url, width) ?? node.url
}

export function getGalleryThumbImageUrl(url: string | null | undefined): string | undefined {
  return getShopifyImageUrl(url, EXPERIENCE_GALLERY_THUMB_PX) ?? url ?? undefined
}

export function getGalleryLightboxImageUrl(
  product: ShopifyProduct | null,
  galleryIndex: number
): string | null {
  const images = collectProductImages(product)
  const node = images[galleryIndex] ?? images[0]
  if (!node?.url) return null
  return getShopifyImageUrl(node.url, EXPERIENCE_GALLERY_LIGHTBOX_PX) ?? node.url
}

export type GalleryImageUrlSet = {
  thumb: string
  hero: string
  lightbox: string
}

/** Right-sized CDN URLs for every image in a product gallery. */
export function buildGalleryImageUrlSets(images: ShopifyImage[]): GalleryImageUrlSet[] {
  return images
    .filter((im) => im.url)
    .map((im) => ({
      thumb: getShopifyImageUrl(im.url, EXPERIENCE_GALLERY_THUMB_PX) ?? im.url,
      hero: getShopifyImageUrl(im.url, EXPERIENCE_GALLERY_HERO_PX) ?? im.url,
      lightbox: getShopifyImageUrl(im.url, EXPERIENCE_GALLERY_LIGHTBOX_PX) ?? im.url,
    }))
}

/** Warm browser cache for a list of image URLs (client-only). */
export function prefetchImageUrls(
  urls: string[],
  priority: 'high' | 'low' | 'auto' = 'low'
): void {
  if (typeof window === 'undefined') return
  const seen = new Set<string>()
  for (const url of urls) {
    if (!url || seen.has(url)) continue
    seen.add(url)
    const img = new window.Image()
    if ('fetchPriority' in img) {
      ;(img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = priority
    }
    img.decoding = 'async'
    img.src = url
  }
}

/** Inject `<link rel="preload">` for the first N hero URLs (highest LCP priority). */
export function injectGalleryLinkPreloads(
  heroUrls: string[],
  maxCount = 4
): () => void {
  if (typeof document === 'undefined') return () => {}
  const links: HTMLLinkElement[] = []
  for (const href of heroUrls.slice(0, maxCount)) {
    if (!href) continue
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = href
    link.setAttribute('fetchpriority', links.length === 0 ? 'high' : 'low')
    document.head.appendChild(link)
    links.push(link)
  }
  return () => {
    for (const link of links) {
      try {
        document.head.removeChild(link)
      } catch {
        // already removed
      }
    }
  }
}

export type AdjacentGalleryOptions = {
  /** Prefetch the current slide too (e.g. LCP on first paint). Default false. */
  includeCurrent?: boolean
  /** Extra steps beyond immediate prev/next (1 → also ±2 for swipe-heavy nav). Default 1. */
  lookahead?: number
}

/**
 * Relative gallery indices to warm while `current` is on screen.
 * Default: immediate prev/next plus one further step each way (lookahead 1).
 */
export function getAdjacentGalleryIndices(
  current: number,
  length: number,
  options: AdjacentGalleryOptions = {}
): number[] {
  const { includeCurrent = false, lookahead = 1 } = options
  if (length <= 0) return []
  if (length === 1) return [0]

  const indices = new Set<number>()
  if (includeCurrent) indices.add(current)

  indices.add((current - 1 + length) % length)
  indices.add((current + 1) % length)

  if (lookahead > 0) {
    for (let step = 2; step <= lookahead + 1; step++) {
      indices.add((current - step + length) % length)
      indices.add((current + step) % length)
    }
  }

  return Array.from(indices).sort((a, b) => a - b)
}

/** Hero CDN URLs at the same width as the main viewer (480w mobile / 1000w desktop). */
export function getGalleryHeroImageUrlsAtWidth(
  images: ShopifyImage[],
  indices: number[],
  width: number = EXPERIENCE_GALLERY_HERO_PX
): string[] {
  const seen = new Set<string>()
  const urls: string[] = []
  for (const index of indices) {
    const node = images[index]
    if (!node?.url) continue
    const url = getShopifyImageUrl(node.url, width) ?? node.url
    if (seen.has(url)) continue
    seen.add(url)
    urls.push(url)
  }
  return urls
}
