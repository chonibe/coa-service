/**
 * Vendor profile + Shopify collection enrichment — shared by artist-spotlight and artists list API.
 * Mirrors spotlight priority: Supabase portrait → collection image/description → synced page bio.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { hasPage, getPage } from '@/content/shopify-content'
import { getVendorCollectionHandle } from '@/lib/shopify/collections'
import { getCollection } from '@/lib/shopify/storefront-client'

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
  unlisted?: boolean
}> {
  let bio: string | undefined
  let image: string | undefined
  let vendorSlug: string | undefined
  let instagram: string | undefined
  let gifUrl: string | undefined
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

  if (vendorSlug) {
    try {
      const col = await getCollection(vendorSlug, { first: 1 })
      if (col) {
        if (!image) {
          image = col.image?.url ?? col.products?.edges?.[0]?.node?.featuredImage?.url
        }
        if (!bio) {
          const desc = col.description?.trim() || (col.descriptionHtml
            ? col.descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
            : '')
          if (desc) bio = desc
        }
        if (!instagram && col.metafield?.value?.trim()) {
          instagram = parseInstagramHandle(col.metafield.value)
        }
        if (col.gifMetafield?.value?.trim()) {
          gifUrl = col.gifMetafield.value.trim()
        }
        if (col.unlistedMetafield?.value?.trim()) {
          unlisted = true
        }
      }
    } catch {
      // Ignore
    }
  }

  if (!bio) {
    const handleToTry = vendorSlug || getVendorCollectionHandle(vendorName)
    if (handleToTry) {
      const pageBio = getBioFromShopifyPage(handleToTry)
      if (pageBio) bio = pageBio
    }
  }

  return { bio, image, vendorSlug, instagram, gifUrl, unlisted }
}
