import { mergeResearchBio, researchInstagramHandle } from '@/lib/shop/artist-research-merge'
import { getArtistImageByHandle, getArtistListImageOverride } from '@/lib/shopify/artist-image'
import { getVendorCollectionHandle } from '@/lib/shopify/collections'
import { getVendorMeta } from '@/lib/shopify/vendor-meta'
import { getProducts } from '@/lib/shopify/storefront-client'
import { createClient } from '@/lib/supabase/server'

/** Shopify vendor names excluded from public artist listings (internal / house vendor). */
const HIDDEN_SHOP_VENDOR_NAMES = new Set(['street collector'])

function isHiddenShopVendor(name: string): boolean {
  return HIDDEN_SHOP_VENDOR_NAMES.has(name.trim().toLowerCase())
}

/**
 * Single artist row for shop listing + explore page (same shape as GET /api/shop/artists).
 */
export type ShopArtist = {
  name: string
  slug: string
  productCount: number
  image?: string
  bio?: string
  instagramUrl?: string
  hasProfile: boolean
}

type VendorProfileRow = {
  vendor_name: string
  bio: string | null
  artist_bio: string | null
  instagram_url: string | null
  profile_image: string | null
  profile_picture_url: string | null
}

async function fetchVendorProfiles(): Promise<VendorProfileRow[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        vendor_name,
        bio,
        artist_bio,
        instagram_url,
        profile_image,
        profile_picture_url
      `)
      .eq('status', 'active')

    if (error) {
      console.error('[ShopArtistsList] Supabase vendor profiles error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[ShopArtistsList] Supabase error:', error)
    return []
  }
}

/**
 * Returns all unique vendors/artists from Shopify products,
 * enriched with Supabase vendor profile data (profile images, bios).
 * Shared by GET /api/shop/artists and server-rendered pages.
 */
export async function getShopArtistsList(): Promise<ShopArtist[]> {
  const [shopifyResult, vendorProfiles] = await Promise.all([
    getProducts({ first: 250 }),
    fetchVendorProfiles(),
  ])

  const { products } = shopifyResult

  const vendorMap = new Map<
    string,
    { count: number; shopifyImage?: string; shopifyImageArea?: number }
  >()

  products.forEach((product) => {
    if (!product.vendor) return
    const existing = vendorMap.get(product.vendor)
    const img = product.featuredImage
    const area = img?.url ? (img.width || 0) * (img.height || 0) : 0
    if (existing) {
      existing.count++
      if (area > (existing.shopifyImageArea ?? 0) && img?.url) {
        existing.shopifyImage = img.url
        existing.shopifyImageArea = area
      }
    } else {
      vendorMap.set(product.vendor, {
        count: 1,
        shopifyImage: img?.url,
        shopifyImageArea: area,
      })
    }
  })

  const profileLookup = new Map<string, VendorProfileRow>()
  vendorProfiles.forEach((v) => {
    profileLookup.set(v.vendor_name.toLowerCase(), v)
  })

  const baseArtists = Array.from(vendorMap.entries())
    .filter(([name]) => !isHiddenShopVendor(name))
    .map(([name, data]) => {
      const profile = profileLookup.get(name.toLowerCase())
      return {
        name,
        slug: getVendorCollectionHandle(name),
        productCount: data.count,
        image: profile?.profile_picture_url || profile?.profile_image || data.shopifyImage,
        bio: profile?.bio || profile?.artist_bio || undefined,
        instagramUrl: profile?.instagram_url || undefined,
        hasProfile: !!profile,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const supabase = createClient()
  const artists = await Promise.all(
    baseArtists.map(async (artist) => {
      try {
        const meta = await getVendorMeta(supabase, artist.name, null)
        const slugForImage = meta.vendorSlug || artist.slug
        const imageOverride =
          getArtistListImageOverride(slugForImage) || getArtistListImageOverride(artist.slug)
        const image =
          imageOverride ||
          meta.image ||
          (await getArtistImageByHandle(slugForImage)) ||
          (await getArtistImageByHandle(artist.slug)) ||
          artist.image
        const bio = mergeResearchBio(artist.slug, artist.bio || meta.bio)
        const igFromResearch = researchInstagramHandle(artist.slug)
        const instagramUrl =
          artist.instagramUrl ||
          (meta.instagram ? `https://www.instagram.com/${meta.instagram}/` : undefined) ||
          (igFromResearch ? `https://www.instagram.com/${igFromResearch}/` : undefined)
        return {
          ...artist,
          image,
          bio,
          instagramUrl,
        }
      } catch {
        const ig = researchInstagramHandle(artist.slug)
        return {
          ...artist,
          bio: mergeResearchBio(artist.slug, artist.bio),
          instagramUrl:
            artist.instagramUrl || (ig ? `https://www.instagram.com/${ig}/` : undefined),
        }
      }
    })
  )

  return artists
}
