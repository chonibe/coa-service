import type { ShopifyProduct, ShopifyVideoSource } from '@/lib/shopify/storefront-client'
import { buildProductCarouselSlides, type ProductCarouselSlide } from '@/lib/shop/product-carousel-slides'

/** Reel + thumbnail payload: hero/details image, optional native/external video, then more photos. */
export type ExperienceReelGalleryItem =
  | { kind: 'image'; url: string; altText?: string | null }
  | {
      kind: 'video'
      id: string
      sources: ShopifyVideoSource[]
      posterUrl?: string | null
      altText?: string | null
    }
  | {
      kind: 'externalVideo'
      id: string
      embedUrl: string
      posterUrl?: string | null
      altText?: string | null
    }

function urlKey(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname
  } catch {
    return url
  }
}

export function getFirstProductImageUrl(product: ShopifyProduct | null | undefined): string | null {
  if (!product) return null
  return product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null
}

/** Ordered unique images (hero first) — same rules as the experience info bar / artwork details hero. */
export function getOrderedProductImages(product: ShopifyProduct | null | undefined): {
  url: string
  altText?: string | null
}[] {
  if (!product) return []
  const fromImages = product.images?.edges?.map((e) => e.node).filter(Boolean) ?? []
  const fromMedia =
    product.media?.edges
      ?.map((e) => (e.node as { mediaContentType?: string; image?: { url: string; altText?: string | null } }))
      .filter((n) => n?.mediaContentType === 'IMAGE' && n?.image?.url)
      .map((n) => n!.image!) ?? []
  const fallback = product.featuredImage ? [product.featuredImage] : []
  const combined = [...fromImages, ...fromMedia]
  const source = combined.length > 0 ? combined : fallback
  const seen = new Set<string>()
  const unique: { url: string; altText?: string | null }[] = []
  for (const n of source) {
    const url = n?.url
    if (!url) continue
    const key = urlKey(url)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push({ url, altText: n?.altText ?? null })
  }
  if (unique.length <= 1) return unique
  const firstUrl = getFirstProductImageUrl(product)
  const firstNode = unique.find((n) => n.url === firstUrl) ?? unique[0]
  const rest = unique.filter((n) => n !== firstNode && n.url !== firstUrl)
  return [firstNode!, ...rest]
}

function slideToReelItem(slide: ProductCarouselSlide): ExperienceReelGalleryItem | null {
  if (slide.type === 'image') {
    return { kind: 'image', url: slide.image.url, altText: slide.image.altText }
  }
  if (slide.type === 'video') {
    return {
      kind: 'video',
      id: slide.id,
      sources: slide.sources,
      posterUrl: slide.poster?.url ?? null,
      altText: slide.alt,
    }
  }
  if (slide.type === 'externalVideo') {
    return {
      kind: 'externalVideo',
      id: slide.id,
      embedUrl: slide.embedUrl,
      posterUrl: slide.poster?.url ?? null,
      altText: slide.alt,
    }
  }
  return null
}

/**
 * Build reel thumbnails + vertical gallery: [hero image, optional external embed, …remaining images].
 * **Native Shopify `VIDEO` file** is omitted here (unreliable in-reel playback); it still shows in the product detail slideout via `ProductStandaloneVideoEmbed`.
 * Index 0 stays the details hero; `slice(1)` is what scrolls in SplineFullScreen.
 */
export function buildExperienceReelGalleryItems(
  product: ShopifyProduct | null | undefined
): ExperienceReelGalleryItem[] {
  if (!product) return []
  const ordered = getOrderedProductImages(product)

  /** Video-only (or no image rows) but Shopify media includes a clip. */
  if (ordered.length === 0) {
    const slides = buildProductCarouselSlides(product)
    const firstVideoSlide = slides.find((s) => s.type === 'video' || s.type === 'externalVideo')
    if (!firstVideoSlide) return []
    const videoItem = slideToReelItem(firstVideoSlide)
    if (!videoItem || videoItem.kind === 'image') return []
    /** Native file video: poster-only hero if available; else empty reel list. */
    if (videoItem.kind === 'video') {
      const posterUrl = videoItem.posterUrl
      if (!posterUrl) return []
      return [{ kind: 'image', url: posterUrl, altText: videoItem.altText ?? null }]
    }
    const posterUrl = videoItem.posterUrl
    if (!posterUrl) return [videoItem]
    return [
      { kind: 'image', url: posterUrl, altText: videoItem.altText ?? null },
      videoItem,
    ]
  }

  const hero = ordered[0]!
  const rest = ordered.slice(1)

  const slides = buildProductCarouselSlides(product)
  const firstVideoSlide = slides.find((s) => s.type === 'video' || s.type === 'externalVideo')
  if (!firstVideoSlide) {
    return ordered.map((o) => ({ kind: 'image' as const, url: o.url, altText: o.altText }))
  }

  const videoItem = slideToReelItem(firstVideoSlide)
  if (!videoItem || videoItem.kind === 'image') {
    return ordered.map((o) => ({ kind: 'image' as const, url: o.url, altText: o.altText }))
  }

  /** Native Shopify video: do not add a reel row — photos only after hero. */
  if (videoItem.kind === 'video') {
    const posterKey = videoItem.posterUrl ? urlKey(videoItem.posterUrl) : null
    const restFiltered = posterKey ? rest.filter((r) => urlKey(r.url) !== posterKey) : rest
    return [
      { kind: 'image', url: hero.url, altText: hero.altText },
      ...restFiltered.map((o) => ({ kind: 'image' as const, url: o.url, altText: o.altText })),
    ]
  }

  const posterKey = videoItem.posterUrl ? urlKey(videoItem.posterUrl) : null
  const restFiltered = posterKey ? rest.filter((r) => urlKey(r.url) !== posterKey) : rest

  return [
    { kind: 'image', url: hero.url, altText: hero.altText },
    videoItem,
    ...restFiltered.map((o) => ({ kind: 'image' as const, url: o.url, altText: o.altText })),
  ]
}

/** Stable key for list rendering / React keys. */
export function reelGalleryItemKey(item: ExperienceReelGalleryItem, index: number): string {
  if (item.kind === 'image') return item.url || `img-${index}`
  if (item.kind === 'video') return `${item.id}-${item.sources.map((s) => s.url).join('|')}`
  return `${item.id}-${item.embedUrl}`
}
