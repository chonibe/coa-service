import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { experienceVendorsLooselyEqual } from '@/lib/shop/experience-spotlight-match'
import { mergeArtistStyleTags } from '@/lib/shop/experience-artist-style-tags'

export type RelatedArtworkReason = 'current' | 'same_artist' | 'similar_tags'

export type RelatedArtworkSliderItem = {
  product: ShopifyProduct
  reason: RelatedArtworkReason
  matchedTags: string[]
  score: number
}

function productTagSet(product: ShopifyProduct): Set<string> {
  return new Set(
    (product.tags ?? [])
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
  )
}

function overlapTags(a: Set<string>, b: Set<string>): string[] {
  const out: string[] = []
  for (const t of a) {
    if (b.has(t)) out.push(t)
  }
  return out
}

function scoreSimilarProduct(
  candidate: ShopifyProduct,
  current: ShopifyProduct | null,
  styleTags: string[],
  artistVendor: string
): { score: number; matchedTags: string[] } {
  const candTags = productTagSet(candidate)
  const styleSet = new Set(styleTags.map((t) => t.toLowerCase()))
  const matched = new Set<string>()

  for (const t of candTags) {
    if (styleSet.has(t)) matched.add(t)
  }
  if (current) {
    for (const t of overlapTags(candTags, productTagSet(current))) {
      matched.add(t)
    }
  }

  let score = matched.size * 3
  if (artistVendor && experienceVendorsLooselyEqual(candidate.vendor ?? '', artistVendor)) {
    score += 8
  }
  if (candidate.availableForSale !== false) score += 2

  return { score, matchedTags: [...matched] }
}

export type BuildRelatedArtworkSliderParams = {
  current: ShopifyProduct | null
  catalog: ShopifyProduct[]
  lampProductId: string
  artistVendor?: string
  artistBio?: string | null
  /** Extra products for same artist (e.g. artist profile API). */
  artistProducts?: ShopifyProduct[]
  limit?: number
  /** When true, only include works from the same artist (no tag-similar picks). */
  artistOnly?: boolean
}

/**
 * Build a horizontal slider list: current artwork first, then same-artist works,
 * then tag-similar picks from the wider catalog.
 */
export function buildExperienceRelatedArtworkSlider({
  current,
  catalog,
  lampProductId,
  artistVendor = '',
  artistBio,
  artistProducts = [],
  limit = 16,
  artistOnly = false,
}: BuildRelatedArtworkSliderParams): RelatedArtworkSliderItem[] {
  const vendor = artistVendor.trim()
  const styleTags = mergeArtistStyleTags(artistBio, [
    ...(current ? [current] : []),
    ...artistProducts,
    ...catalog.filter((p) => vendor && experienceVendorsLooselyEqual(p.vendor ?? '', vendor)),
  ])

  const byId = new Map<string, ShopifyProduct>()
  const addProduct = (p: ShopifyProduct) => {
    if (!p?.id || p.id === lampProductId) return
    if (!byId.has(p.id)) byId.set(p.id, p)
  }
  for (const p of catalog) addProduct(p)
  for (const p of artistProducts) addProduct(p)
  if (current) addProduct(current)

  const items: RelatedArtworkSliderItem[] = []
  const used = new Set<string>()

  if (current && current.id !== lampProductId) {
    items.push({
      product: current,
      reason: 'current',
      matchedTags: [],
      score: 1000,
    })
    used.add(current.id)
  }

  const sameArtist: RelatedArtworkSliderItem[] = []
  const similar: RelatedArtworkSliderItem[] = []

  for (const product of byId.values()) {
    if (used.has(product.id)) continue
    const isSameArtist = vendor && experienceVendorsLooselyEqual(product.vendor ?? '', vendor)
    const { score, matchedTags } = scoreSimilarProduct(product, current, styleTags, vendor)

    if (isSameArtist) {
      sameArtist.push({
        product,
        reason: 'same_artist',
        matchedTags,
        score: score + 20,
      })
    } else if (!artistOnly && matchedTags.length > 0 && score > 0) {
      similar.push({
        product,
        reason: 'similar_tags',
        matchedTags,
        score,
      })
    }
  }

  sameArtist.sort((a, b) => b.score - a.score)
  similar.sort((a, b) => b.score - a.score)

  for (const row of artistOnly ? sameArtist : [...sameArtist, ...similar]) {
    if (items.length >= limit) break
    if (used.has(row.product.id)) continue
    items.push(row)
    used.add(row.product.id)
  }

  return items
}
