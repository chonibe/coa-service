/**
 * Artist/collection image lookup by handle
 *
 * Tries multiple strategies to resolve an artist image when the primary
 * getCollection(handle) path fails or returns no image.
 * Used by Street Collector artist carousel and similar features.
 */

import { createClient } from '@/lib/supabase/server'
import {
  getCollection,
  getCollectionById,
  getProductsByVendor,
} from '@/lib/shopify/storefront-client'

/** Known handle variants (e.g. tiago-hep → tiago-hesp where Shopify uses different handle) */
const HANDLE_ALIASES: Record<string, string[]> = {
  'tiago-hep': ['tiago-hesp'],
  /** Jack J.C. Art — storefront / admin handle variants */
  'jack-jc-art': ['jack-j-c-art'],
  'jack-j-c-art': ['jack-jc-art'],
  /** Legacy listing slug with dots in segment (before getVendorCollectionHandle on artists API) */
  'jack-j.c.-art': ['jack-jc-art', 'jack-j-c-art'],
}

/** Collection portrait for artists list when profile / product pick is wrong */
const JACK_JC_ART_LIST_IMAGE =
  'https://cdn.shopify.com/s/files/1/0659/7925/2963/collections/Screenshot_2026-03-08_at_13.41.17.png?v=1772970106'

/** Slug/handle keys → forced image URL for `/api/shop/artists` (checked before Supabase/collection fallbacks) */
const ARTIST_LIST_IMAGE_OVERRIDES: Record<string, string> = Object.fromEntries(
  [
    'jack-jc-art',
    'jack-j-c-art',
    'jack-j.c.-art',
    'jack-jc-art-one',
    'jack-j-c-art-one',
    /** Display name “Jack AC Art” → slug jack-ac-art */
    'jack-ac-art',
  ].map((h) => [h, JACK_JC_ART_LIST_IMAGE])
)

/** Resolve an explicit list image for a vendor collection handle (if configured). */
export function getArtistListImageOverride(handle: string): string | undefined {
  if (!handle) return undefined
  const base = handle.replace(/-\d+$/, '')
  return ARTIST_LIST_IMAGE_OVERRIDES[handle] ?? ARTIST_LIST_IMAGE_OVERRIDES[base]
}

export async function getArtistImageByHandle(handle: string): Promise<string | undefined> {
  const base = handle.replace(/-\d+$/, '')
  const aliases = HANDLE_ALIASES[base] ?? []
  const handlesToTry = [handle, base, ...aliases].filter(Boolean)
  const uniqueHandles = [...new Set(handlesToTry)]

  // 1. Try collection by handle(s)
  for (const h of uniqueHandles) {
    try {
      const col = await getCollection(h, { first: 1 })
      const url = col?.image?.url ?? col?.products?.edges?.[0]?.node?.featuredImage?.url
      if (url) return url
    } catch {
      continue
    }
  }

  // 2. Try vendor_collections -> getCollectionById
  const supabase = createClient()
  for (const h of uniqueHandles) {
    try {
      const { data: vc } = await supabase
        .from('vendor_collections')
        .select('shopify_collection_id, shopify_collection_handle')
        .eq('shopify_collection_handle', h)
        .maybeSingle()

      if (vc?.shopify_collection_id) {
        const col = await getCollectionById(vc.shopify_collection_id, { first: 1 })
        const url = col?.image?.url ?? col?.products?.edges?.[0]?.node?.featuredImage?.url
        if (url) return url
      }
    } catch {
      continue
    }
  }

  // 3. Fallback: products by vendor name (slug -> "Vendor Name")
  const vendorName = handle
    .replace(/-\d+$/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  try {
    const { products } = await getProductsByVendor(vendorName, { first: 1 })
    return products?.[0]?.featuredImage?.url
  } catch {
    return undefined
  }
}

/**
 * Get collection description (artist info) by handle.
 * Tries handle, handle without -N suffix, and known aliases.
 * Returns plain text with HTML stripped.
 */
export async function getCollectionDescription(handle: string): Promise<string | undefined> {
  const base = handle.replace(/-\d+$/, '')
  const aliases = HANDLE_ALIASES[base] ?? []
  const handlesToTry = [handle, base, ...aliases].filter(Boolean)
  const uniqueHandles = [...new Set(handlesToTry)]

  for (const h of uniqueHandles) {
    try {
      const col = await getCollection(h, { first: 1 })
      const desc = col?.description?.trim() || (col?.descriptionHtml
        ? col.descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : '')
      if (desc) return desc
    } catch {
      continue
    }
  }
  return undefined
}

/** Extract Instagram handle from URL or @handle string */
function parseInstagramHandle(value: string): string {
  const trimmed = value.trim()
  const match = trimmed.match(/(?:instagram\.com\/|instagr\.am\/|@)([a-zA-Z0-9._]+)/i)
  if (match) return match[1]
  if (trimmed.startsWith('@')) return trimmed.slice(1)
  return trimmed
}

/**
 * Get collection Instagram handle from custom.instagram metafield.
 * Tries handle, handle without -N suffix, and known aliases.
 */
export async function getCollectionInstagram(handle: string): Promise<string | undefined> {
  const base = handle.replace(/-\d+$/, '')
  const aliases = HANDLE_ALIASES[base] ?? []
  const handlesToTry = [handle, base, ...aliases].filter(Boolean)
  const uniqueHandles = [...new Set(handlesToTry)]

  for (const h of uniqueHandles) {
    try {
      const col = await getCollection(h, { first: 1 })
      const raw = col?.metafield?.value?.trim()
      if (raw) return parseInstagramHandle(raw)
    } catch {
      continue
    }
  }
  return undefined
}
