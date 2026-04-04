import { createClient } from '@/lib/supabase/server'
import { getVendorCollectionHandle } from '@/lib/shopify/collections'
import { buildArtistProfileResponse, type ArtistProfileApiResponse } from '@/lib/shop/artist-profile-api'
import {
  getCollection,
  getCollectionById,
  getProductsByVendor,
  type ShopifyProduct,
} from '@/lib/shopify/storefront-client'
import { hasPage, getPage } from '@/content/shopify-content'
import { mergeInstagramDiscoveryIfNeeded } from '@/lib/instagram/business-discovery'

async function finalizeArtist(slug: string, artist: ArtistProfileApiResponse): Promise<ArtistProfileApiResponse> {
  let a = await mergeInstagramDiscoveryIfNeeded(artist)
  if (!a.bio?.trim() && hasPage(slug)) {
    const page = getPage(slug)
    if (page?.body?.trim()) {
      a = { ...a, bio: page.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() }
    }
  }
  return a
}

function parseInstagramHandle(value: string): string {
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

export type FetchArtistProfileOptions = {
  /** Same as `?vendor=` on the API — optional vendor name override for matching */
  vendor?: string | null
}

/**
 * Server-only artist profile resolver shared by `/api/shop/artists/[slug]`,
 * `generateMetadata`, and the artist page. Returns `null` when not found.
 */
export async function fetchArtistProfile(
  slug: string,
  options?: FetchArtistProfileOptions
): Promise<ArtistProfileApiResponse | null> {
  const vendorParam = options?.vendor ?? null
  const artistNameForMatch = (vendorParam || slug.replace(/-/g, ' ')).trim()
  const artistNameBase = slug.replace(/-\d+$/, '').replace(/-/g, ' ').trim()
  const slugAsShopifyHandle = getVendorCollectionHandle(artistNameForMatch)

  try {
    const supabase = createClient()

    let vendorBio: string | undefined
    let vendorInstagram: string | undefined
    let pairedCollectionId: string | null = null
    let pairedCollectionHandle: string | null = null
    let vendorName: string | undefined

    try {
      const handlesToTry = [...new Set([slug, slug.replace(/-\d+$/, ''), slugAsShopifyHandle].filter(Boolean))]
      for (const h of handlesToTry) {
        const { data: vc } = await supabase
          .from('vendor_collections')
          .select('vendor_id, shopify_collection_id, shopify_collection_handle, vendor_name')
          .eq('shopify_collection_handle', h)
          .maybeSingle()

        if (vc?.vendor_id) {
          const { data: vendor } = await supabase
            .from('vendors')
            .select('id, bio, vendor_name, instagram_url')
            .eq('id', vc.vendor_id)
            .maybeSingle()

          if (vendor) {
            vendorBio = vendor.bio?.trim() || undefined
            vendorName = vendor.vendor_name
            const v = vendor as { instagram_url?: string }
            if (v?.instagram_url?.trim()) vendorInstagram = parseInstagramHandle(v.instagram_url)
            pairedCollectionId = vc.shopify_collection_id ?? null
            pairedCollectionHandle = vc.shopify_collection_handle ?? null
            break
          }
        }
      }

      if (!vendorName) {
        for (const nameToTry of [artistNameForMatch, artistNameBase]) {
          if (!nameToTry) continue
          const { data: vendor } = await supabase
            .from('vendors')
            .select('id, bio, vendor_name, instagram_url')
            .ilike('vendor_name', nameToTry)
            .maybeSingle()

          if (vendor) {
            vendorBio = vendor.bio?.trim() || undefined
            vendorName = vendor.vendor_name
            const v = vendor as { instagram_url?: string }
            if (v?.instagram_url?.trim()) vendorInstagram = parseInstagramHandle(v.instagram_url)

            const { data: vendorCollection } = await supabase
              .from('vendor_collections')
              .select('shopify_collection_id, shopify_collection_handle')
              .eq('vendor_id', vendor.id)
              .maybeSingle()

            pairedCollectionId = vendorCollection?.shopify_collection_id ?? null
            pairedCollectionHandle = vendorCollection?.shopify_collection_handle ?? null
            break
          }
        }
      }
    } catch {
      /* Supabase optional */
    }

    let collection = null

    if (pairedCollectionId) {
      collection = await getCollectionById(pairedCollectionId, {
        first: 50,
        sortKey: 'CREATED',
        reverse: true,
      })
    }

    if (!collection) {
      const canonicalHandle = vendorName ? getVendorCollectionHandle(vendorName) : slug
      const handlesToTry = [
        pairedCollectionHandle,
        canonicalHandle !== slug ? canonicalHandle : null,
        slugAsShopifyHandle !== slug ? slugAsShopifyHandle : null,
        slug,
      ].filter(Boolean) as string[]
      const uniqueHandles = [...new Set(handlesToTry)]

      for (const handle of uniqueHandles) {
        try {
          collection = await getCollection(handle, {
            first: 50,
            sortKey: 'CREATED',
            reverse: true,
          })
          if (collection) break
        } catch {
          continue
        }
      }
    }

    const collectionDesc =
      collection?.description ||
      (collection?.descriptionHtml
        ? collection.descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : '')

    if (collection?.products?.edges?.length) {
      const products = collection.products.edges.map((edge) => edge.node)
      const bio = vendorBio || (collectionDesc || undefined) || getBioFromShopifyPage(slug)
      const artist = await buildArtistProfileResponse({
        slug,
        name: vendorName || collection.title,
        bio: bio || undefined,
        image: collection.image?.url ?? undefined,
        products,
        collection,
        vendorInstagramHandle: vendorInstagram,
        collectionHandlesToTry: [
          ...new Set(
            [
              pairedCollectionHandle,
              slug,
              slug.replace(/-\d+$/, ''),
              slugAsShopifyHandle,
              vendorName ? getVendorCollectionHandle(vendorName) : null,
            ].filter(Boolean) as string[]
          ),
        ],
      })
      return finalizeArtist(slug, artist)
    }

    let vendorProducts: ShopifyProduct[] = []
    try {
      const result = await getProductsByVendor(artistNameForMatch, {
        first: 50,
        sortKey: 'CREATED_AT',
        reverse: true,
      })
      vendorProducts = result?.products ?? []
    } catch (vendorErr) {
      console.warn('[fetchArtistProfile] Vendor lookup failed for', slug, vendorErr)
    }

    if (vendorProducts.length === 0) {
      const fallbackHandles = [
        slug,
        slug.replace(/-\d+$/, ''),
        slugAsShopifyHandle,
        `${slug.replace(/-\d+$/, '')}-one`,
      ]
      for (const h of [...new Set(fallbackHandles)].filter(Boolean)) {
        try {
          const col = await getCollection(h, { first: 50, sortKey: 'CREATED', reverse: true })
          if (col?.title) {
            const name =
              vendorName ||
              col.title ||
              slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            const products = col.products?.edges?.map((e) => e.node) ?? []
            const colBio = col.description?.trim() ||
              (col.descriptionHtml ? col.descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '')
            const bio = vendorBio || colBio || getBioFromShopifyPage(slug)
            const artist = await buildArtistProfileResponse({
              slug,
              name,
              bio: bio || undefined,
              image: col.image?.url ?? undefined,
              products,
              collection: col,
              vendorInstagramHandle: vendorInstagram,
              collectionHandlesToTry: [...new Set(fallbackHandles)].filter(Boolean) as string[],
            })
            return finalizeArtist(slug, artist)
          }
        } catch {
          continue
        }
      }
      return null
    }

    if ((!vendorBio || !vendorInstagram) && vendorProducts[0]?.vendor) {
      try {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('bio, vendor_name')
          .ilike('vendor_name', vendorProducts[0].vendor)
          .maybeSingle()
        if (vendor?.bio?.trim()) {
          vendorBio = vendor.bio.trim()
        }
        if (vendor?.vendor_name && !vendorName) {
          vendorName = vendor.vendor_name
        }
      } catch {
        /* ignore */
      }
    }

    const bio =
      vendorBio ||
      collectionDesc ||
      vendorProducts[0]?.description ||
      getBioFromShopifyPage(slug)
    const artist = await buildArtistProfileResponse({
      slug,
      name: vendorName || vendorProducts[0]?.vendor || artistNameForMatch,
      bio: bio || undefined,
      image: vendorProducts[0]?.featuredImage?.url,
      products: vendorProducts,
      collection: null,
      vendorInstagramHandle: vendorInstagram,
      collectionHandlesToTry: [
        ...new Set(
          [
            pairedCollectionHandle,
            slug,
            slug.replace(/-\d+$/, ''),
            slugAsShopifyHandle,
            vendorName ? getVendorCollectionHandle(vendorName) : null,
            `${slug.replace(/-\d+$/, '')}-one`,
          ].filter(Boolean) as string[]
        ),
      ],
    })
    return finalizeArtist(slug, artist)
  } catch (error) {
    console.error('[fetchArtistProfile] Error for slug', slug, ':', error)
    return null
  }
}
