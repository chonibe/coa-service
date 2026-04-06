/**
 * Vendor profile + Shopify collection enrichment — shared by artist-spotlight and artists list API.
 * Mirrors spotlight priority: Supabase portrait → collection image/description → synced page bio.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { hasPage, getPage } from '@/content/shopify-content'
import { getVendorCollectionHandle } from '@/lib/shopify/collections'
import {
  getCollectionVideoUrlByAdmin,
  resolveMediaGidToUrl,
} from '@/lib/shopify/admin-collection-products'
import { getCollection, type ShopifyCollection } from '@/lib/shopify/storefront-client'

type AppSupabase = SupabaseClient<Database>

export function parseInstagramHandle(value: string): string {
  const trimmed = value.trim()
  const match = trimmed.match(/(?:instagram\.com\/|instagr\.am\/|@)([a-zA-Z0-9._]+)/i)
  if (match) return match[1]
  if (trimmed.startsWith('@')) return trimmed.slice(1)
  return trimmed
}

function getBioFromShopifyPage(handle: string): string | undefined {
  const base = handle.replace(/-\d+$/, '')
  const handlesToTry = [handle, base, `${base}-one`].filter(Boolean)
  const unique = [...new Set(handlesToTry)]
  for (const h of unique) {
    if (hasPage(h)) {
      const page = getPage(h)
      if (page?.body?.trim()) {
        return page.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      }
    }
  }
  return undefined
}

/** Handles to try when vendor ↔ collection pairing uses suffixes (e.g. saturn-png) or DB slug differs. */
function collectionHandleCandidates(vendorSlugFromDb: string | undefined, vendorName: string): string[] {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  const fromVc = vendorSlugFromDb?.trim() ? slug(vendorSlugFromDb.trim()) : ''
  const fromName = slug(vendorName)
  const primaries = [...new Set([fromVc, fromName].filter(Boolean))]
  const out: string[] = []
  for (const p of primaries) {
    out.push(p, `${p}-one`, `${p}-png`, `${p}-jpg`, `${p}-art`)
  }
  return [...new Set(out)]
}

export async function getVendorMeta(
  supabase: AppSupabase,
  vendorName: string,
  vendorId: number | null
): Promise<{
  bio?: string
  image?: string
  vendorSlug?: string
  instagram?: string
  gifUrl?: string
  /** Collection metafield custom.video (URL or resolved file reference) */
  videoUrl?: string
  unlisted?: boolean
}> {
  let bio: string | undefined
  let image: string | undefined
  let vendorSlug: string | undefined
  let instagram: string | undefined
  let gifUrl: string | undefined
  let videoUrl: string | undefined
  let unlisted: boolean | undefined
  let resolvedVendorId = vendorId

  if (resolvedVendorId) {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('bio, profile_image, profile_picture_url, instagram_url')
      .eq('id', resolvedVendorId)
      .maybeSingle()
    if (vendor?.bio?.trim()) bio = vendor.bio.trim()
    const v = vendor as { profile_picture_url?: string; profile_image?: string; instagram_url?: string } | null
    if (v?.profile_picture_url || v?.profile_image) {
      image = v.profile_picture_url || v.profile_image
    }
    if (v?.instagram_url?.trim()) instagram = parseInstagramHandle(v.instagram_url)
  } else {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, bio, profile_image, profile_picture_url, instagram_url')
      .ilike('vendor_name', vendorName)
      .maybeSingle()
    if (vendor?.bio?.trim()) bio = vendor.bio.trim()
    const v = vendor as { profile_picture_url?: string; profile_image?: string; instagram_url?: string } | null
    if (v?.profile_picture_url || v?.profile_image) {
      image = v.profile_picture_url || v.profile_image
    }
    if (v?.instagram_url?.trim()) instagram = parseInstagramHandle(v.instagram_url)
    if (vendor?.id) resolvedVendorId = (vendor as { id: number }).id
  }

  const vcQuery = resolvedVendorId
    ? supabase.from('vendor_collections').select('shopify_collection_handle').eq('vendor_id', resolvedVendorId)
    : supabase.from('vendor_collections').select('shopify_collection_handle').eq('vendor_name', vendorName)
  const { data: vc } = await vcQuery.maybeSingle()
  if (vc?.shopify_collection_handle) vendorSlug = vc.shopify_collection_handle

  const handleList = collectionHandleCandidates(vendorSlug, vendorName)
  const loadedCols: ShopifyCollection[] = []
  for (const h of handleList) {
    try {
      const col = await getCollection(h, { first: 1 })
      if (col) loadedCols.push(col)
    } catch {
      // Ignore
    }
  }

  const primaryCol = loadedCols[0]
  if (primaryCol) {
    if (!image) {
      image =
        primaryCol.image?.url ?? primaryCol.products?.edges?.[0]?.node?.featuredImage?.url
    }
    if (!bio) {
      const desc =
        primaryCol.description?.trim() ||
        (primaryCol.descriptionHtml
          ? primaryCol.descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          : '')
      if (desc) bio = desc
    }
    if (!instagram && primaryCol.metafield?.value?.trim()) {
      instagram = parseInstagramHandle(primaryCol.metafield.value)
    }
  }

  for (const col of loadedCols) {
    if (col.unlistedMetafield?.value?.trim()) {
      unlisted = true
    }
    if (!gifUrl && col.gifMetafield?.value?.trim()) {
      gifUrl = col.gifMetafield.value.trim()
    }
    if (!videoUrl && col.videoMetafield?.value?.trim()) {
      videoUrl = col.videoMetafield.value.trim()
    }
  }

  if (!videoUrl?.trim()) {
    for (const col of loadedCols) {
      if (!col.id) continue
      const fromAdmin = await getCollectionVideoUrlByAdmin(col.id)
      if (fromAdmin?.trim()) {
        videoUrl = fromAdmin.trim()
        break
      }
    }
  }

  if (gifUrl?.startsWith('gid://')) {
    const resolved = await resolveMediaGidToUrl(gifUrl)
    if (resolved) gifUrl = resolved
  }
  if (videoUrl?.startsWith('gid://')) {
    const resolved = await resolveMediaGidToUrl(videoUrl)
    if (resolved) videoUrl = resolved
  }

  if (!bio) {
    const handleToTry = vendorSlug || getVendorCollectionHandle(vendorName)
    if (handleToTry) {
      const pageBio = getBioFromShopifyPage(handleToTry)
      if (pageBio) bio = pageBio
    }
  }

  return { bio, image, vendorSlug, instagram, gifUrl, videoUrl, unlisted }
}
