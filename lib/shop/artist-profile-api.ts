import { getCollectionInstagram } from '@/lib/shopify/artist-image'
import { getCollection, type ShopifyCollection, type ShopifyProduct } from '@/lib/shopify/storefront-client'

export type ProcessGalleryItem = { url: string; label?: string }
export type ExhibitionRow = { year: number; type: string; title: string; venue: string; city: string }
export type PressCard = { outlet: string; year?: string; quote: string; url?: string }
/** `url` = image src; optional `link` = click target (e.g. post permalink). Falls back to profile URL. */
export type InstagramShowcaseItem = { url: string; kind?: string; link?: string }

export type ArtistProfileRich = {
  location?: string
  alias?: string
  storyHook?: string
  pullquote?: string
  processGallery?: ProcessGalleryItem[]
  exhibitions?: ExhibitionRow[]
  press?: PressCard[]
  instagramShowcase?: InstagramShowcaseItem[]
  activeSince?: string
  impactCallout?: string
  exclusiveCallout?: string
}

export type ArtistProfileApiResponse = {
  name: string
  slug: string
  bio?: string
  image?: string
  instagram?: string
  instagramUrl?: string
  products: ShopifyProduct[]
  profile: ArtistProfileRich
  stats: { editionCount: number; remainingCount: number }
}

function parseJsonArray<T>(raw: string | undefined): T[] | undefined {
  if (!raw?.trim()) return undefined
  try {
    const v = JSON.parse(raw) as unknown
    return Array.isArray(v) ? (v as T[]) : undefined
  } catch {
    return undefined
  }
}

export function artistProfileRichFromCollection(collection: ShopifyCollection | null): ArtistProfileRich {
  if (!collection) return {}
  return {
    location: collection.artistLocationMetafield?.value?.trim() || undefined,
    alias: collection.artistAliasMetafield?.value?.trim() || undefined,
    storyHook: collection.storyHookMetafield?.value?.trim() || undefined,
    pullquote: collection.pullquoteMetafield?.value?.trim() || undefined,
    processGallery: parseJsonArray<ProcessGalleryItem>(collection.processGalleryMetafield?.value),
    exhibitions: parseJsonArray<ExhibitionRow>(collection.exhibitionsMetafield?.value),
    press: parseJsonArray<PressCard>(collection.pressMetafield?.value),
    instagramShowcase: parseJsonArray<InstagramShowcaseItem>(collection.instagramShowcaseMetafield?.value),
    activeSince: collection.activeSinceMetafield?.value?.trim() || undefined,
    impactCallout: collection.impactCalloutMetafield?.value?.trim() || undefined,
    exclusiveCallout: collection.exclusiveCalloutMetafield?.value?.trim() || undefined,
  }
}

export function computeArtistProductStats(products: ShopifyProduct[]): {
  editionCount: number
  remainingCount: number
} {
  const editionCount = products.length
  let remainingCount = 0
  for (const p of products) {
    for (const e of p.variants.edges) {
      remainingCount += e.node.quantityAvailable ?? 0
    }
  }
  return { editionCount, remainingCount }
}

/** Prefer Supabase vendor handle; fall back to collection `custom.instagram` (URL or @handle). */
export function mergeInstagramHandle(
  vendorInstagramHandle?: string,
  collectionInstagramRaw?: string
): { handle?: string; url?: string } {
  const pick = (vendorInstagramHandle?.trim() || collectionInstagramRaw?.trim()) ?? ''
  if (!pick) return {}
  const match = pick.match(/(?:instagram\.com\/|instagr\.am\/|@)([a-zA-Z0-9._]+)/i)
  const h = match ? match[1] : pick.startsWith('@') ? pick.slice(1) : pick
  const clean = h.split('/')[0]?.split('?')[0]?.trim()
  if (!clean) return {}
  return { handle: clean, url: `https://www.instagram.com/${clean}/` }
}

export async function buildArtistProfileResponse(input: {
  slug: string
  name: string
  bio?: string
  image?: string
  products: ShopifyProduct[]
  collection: ShopifyCollection | null
  vendorInstagramHandle?: string
  collectionHandlesToTry?: string[]
}): Promise<ArtistProfileApiResponse> {
  let col = input.collection

  if (!col && input.collectionHandlesToTry?.length) {
    for (const h of input.collectionHandlesToTry) {
      try {
        const c = await getCollection(h, { first: 1 })
        if (c?.id) {
          col = c
          break
        }
      } catch {
        continue
      }
    }
  }

  const profile = artistProfileRichFromCollection(col)
  const stats = computeArtistProductStats(input.products)
  const colInsta = col?.metafield?.value?.trim()

  let ig = mergeInstagramHandle(input.vendorInstagramHandle, colInsta)
  if (!ig.handle) {
    const fallback = await getCollectionInstagram(input.slug)
    if (fallback) {
      ig = mergeInstagramHandle(fallback, undefined)
    }
  }

  return {
    name: input.name,
    slug: input.slug,
    bio: input.bio,
    image: input.image,
    instagram: ig.handle,
    instagramUrl: ig.url,
    products: input.products,
    profile,
    stats: { editionCount: stats.editionCount, remainingCount: stats.remainingCount },
  }
}
