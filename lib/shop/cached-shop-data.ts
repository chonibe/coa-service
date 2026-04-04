import { cache } from 'react'
import { fetchArtistProfile } from '@/lib/shop/fetch-artist-profile'
import { getProduct } from '@/lib/shopify/storefront-client'

/**
 * Per-request dedupe for RSC + generateMetadata (same slug + vendor key).
 */
export const getCachedArtistProfile = cache((slug: string, vendorKey: string) =>
  fetchArtistProfile(slug, { vendor: vendorKey || null })
)

export const getCachedProductByHandle = cache((handle: string) => getProduct(handle))
