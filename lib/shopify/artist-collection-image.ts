/**
 * Artist portrait resolution — matches homepage featured-artists pathway:
 * Shopify collection image first, then collection lookup by handle, then fallbacks.
 * Focal point from collection image Media presentation when available.
 */

import { getArtistListImageOverride } from '@/lib/shopify/artist-image'
import { createClient } from '@/lib/supabase/server'
import {
  getCollection,
  getCollectionById,
  getProductsByVendor,
  storefrontQuery,
  type ShopifyCollection,
  type ShopifyImage,
} from '@/lib/shopify/storefront-client'

export type ArtistPortrait = {
  url?: string
  /** CSS object-position, e.g. "50% 35%" */
  objectPosition?: string
}

export const DEFAULT_ARTIST_PORTRAIT_OBJECT_POSITION = 'center center'

/** Known handle variants (shared with artist-image.ts) */
const HANDLE_ALIASES: Record<string, string[]> = {
  'tiago-hep': ['tiago-hesp'],
  'jack-jc-art': ['jack-j-c-art'],
  'jack-j-c-art': ['jack-jc-art'],
  'jack-j.c.-art': ['jack-jc-art', 'jack-j-c-art'],
  'jack-ac-art': ['jack-jc-art', 'jack-j-c-art'],
}

const focalPointCache = new Map<string, string | undefined>()

export function focalPointToObjectPosition(x: number, y: number): string {
  const px = Math.round(Math.max(0, Math.min(1, x)) * 1000) / 10
  const py = Math.round(Math.max(0, Math.min(1, y)) * 1000) / 10
  return `${px}% ${py}%`
}

export function artistPortraitCoverStyle(
  objectPosition?: string
): { objectFit: 'cover'; objectPosition: string } {
  return {
    objectFit: 'cover',
    objectPosition: objectPosition?.trim() || DEFAULT_ARTIST_PORTRAIT_OBJECT_POSITION,
  }
}

function parseFocalPointFromPresentation(
  asJson: string | Record<string, unknown> | null | undefined
): { x: number; y: number } | undefined {
  if (!asJson) return undefined
  let data: Record<string, unknown>
  if (typeof asJson === 'string') {
    try {
      data = JSON.parse(asJson) as Record<string, unknown>
    } catch {
      return undefined
    }
  } else {
    data = asJson
  }
  const fp = data.focal_point ?? data.focalPoint
  if (!fp || typeof fp !== 'object') return undefined
  const x = Number((fp as { x?: unknown }).x)
  const y = Number((fp as { y?: unknown }).y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined
  return { x, y }
}

/** Storefront Media.presentation.asJson — focal point for Shopify-hosted images. */
export async function getImageObjectPositionFromStorefront(
  imageId: string | null | undefined
): Promise<string | undefined> {
  const id = imageId?.trim()
  if (!id) return undefined
  if (focalPointCache.has(id)) return focalPointCache.get(id)

  try {
    const query = `
      query ArtistImageFocalPoint($id: ID!) {
        node(id: $id) {
          ... on MediaImage {
            presentation {
              asJson(format: IMAGE)
            }
          }
        }
      }
    `
    const result = await storefrontQuery<{
      node?: { presentation?: { asJson?: string | Record<string, unknown> } | null } | null
    }>(query, { id })

    const fp = parseFocalPointFromPresentation(result?.node?.presentation?.asJson)
    const objectPosition = fp ? focalPointToObjectPosition(fp.x, fp.y) : undefined
    focalPointCache.set(id, objectPosition)
    return objectPosition
  } catch {
    focalPointCache.set(id, undefined)
    return undefined
  }
}

/** Same pathway as homepage: collection.image, then first product featured image. */
export function portraitUrlFromCollection(
  collection: ShopifyCollection | null | undefined
): string | undefined {
  return (
    collection?.image?.url?.trim() ||
    collection?.products?.edges?.[0]?.node?.featuredImage?.url?.trim() ||
    undefined
  )
}

export async function portraitFromCollection(
  collection: ShopifyCollection | null | undefined
): Promise<ArtistPortrait> {
  const url = portraitUrlFromCollection(collection)
  if (!url) return {}
  const imageId = collection?.image?.id
  const objectPosition = imageId ? await getImageObjectPositionFromStorefront(imageId) : undefined
  return { url, objectPosition }
}

async function portraitFromCollectionByHandle(handle: string): Promise<ArtistPortrait> {
  const base = handle.replace(/-\d+$/, '')
  const aliases = HANDLE_ALIASES[base] ?? []
  const handlesToTry = [...new Set([handle, base, ...aliases].filter(Boolean))]

  for (const h of handlesToTry) {
    try {
      const col = await getCollection(h, { first: 1 })
      const portrait = await portraitFromCollection(col)
      if (portrait.url) return portrait
    } catch {
      continue
    }
  }

  const supabase = createClient()
  for (const h of handlesToTry) {
    try {
      const { data: vc } = await supabase
        .from('vendor_collections')
        .select('shopify_collection_id, shopify_collection_handle')
        .eq('shopify_collection_handle', h)
        .maybeSingle()

      if (vc?.shopify_collection_id) {
        const col = await getCollectionById(vc.shopify_collection_id, { first: 1 })
        const portrait = await portraitFromCollection(col)
        if (portrait.url) return portrait
      }
    } catch {
      continue
    }
  }

  const vendorName = base
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  try {
    const { products } = await getProductsByVendor(vendorName, { first: 1 })
    const fromVendor = products?.[0]?.featuredImage?.url?.trim()
    if (fromVendor) return { url: fromVendor }
  } catch {
    // continue
  }

  const override = getArtistListImageOverride(handle)
  return override ? { url: override } : {}
}

/**
 * Resolve artist portrait with homepage-aligned priority:
 * override → collection (with focal point) → handle lookup → Supabase → product thumbnail.
 */
export async function resolveArtistPortrait(input: {
  handle?: string
  collection?: ShopifyCollection | null
  overrideUrl?: string
  supabaseUrl?: string
  productUrl?: string
  extraHandles?: string[]
}): Promise<ArtistPortrait> {
  const override = input.overrideUrl?.trim()
  if (override) return { url: override }

  if (input.collection) {
    const fromCol = await portraitFromCollection(input.collection)
    if (fromCol.url) return fromCol
  }

  const handles = [
    input.handle,
    ...(input.extraHandles ?? []),
    input.collection?.handle,
  ].filter(Boolean) as string[]
  for (const h of [...new Set(handles)]) {
    const portrait = await portraitFromCollectionByHandle(h)
    if (portrait.url) return portrait
  }

  const supabase = input.supabaseUrl?.trim()
  if (supabase) return { url: supabase }

  const product = input.productUrl?.trim()
  if (product) return { url: product }

  return {}
}

/** @deprecated Prefer resolveArtistPortrait — kept for callers that only need URL. */
export async function getArtistPortraitUrlByHandle(handle: string): Promise<string | undefined> {
  const portrait = await portraitFromCollectionByHandle(handle)
  return portrait.url
}

export type ShopifyImageWithId = ShopifyImage & { id?: string | null }
