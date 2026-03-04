import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Artist Spotlight API
 *
 * Returns the most recent "artist spotlight" — the vendor whose artworks were
 * most recently added to the catalog (via artwork_series_members).
 * Used for the experience selector banner: filter artworks, "New Drop" badge, artist info card.
 */

export async function GET() {
  try {
    const supabase = createClient()

    // Find the series with the most recently added member (shopify_product_id)
    const { data: latestMember, error: memberError } = await supabase
      .from('artwork_series_members')
      .select('series_id, created_at')
      .not('shopify_product_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (memberError || !latestMember?.series_id) {
      return NextResponse.json(null)
    }

    // Get series details
    const { data: series, error: seriesError } = await supabase
      .from('artwork_series')
      .select('id, name, vendor_name, description, thumbnail_url, vendor_id')
      .eq('id', latestMember.series_id)
      .eq('is_active', true)
      .single()

    if (seriesError || !series) {
      return NextResponse.json(null)
    }

    // Get all product IDs in this series
    const { data: members, error: membersError } = await supabase
      .from('artwork_series_members')
      .select('shopify_product_id')
      .eq('series_id', series.id)
      .not('shopify_product_id', 'is', null)

    if (membersError || !members?.length) {
      return NextResponse.json({
        vendorName: series.vendor_name,
        vendorSlug: slugify(series.vendor_name),
        bio: series.description?.trim() || undefined,
        image: series.thumbnail_url || undefined,
        productIds: [],
        seriesName: series.name,
      })
    }

    const productIds = members
      .map((m) => m.shopify_product_id?.trim())
      .filter(Boolean) as string[]

    // Get vendor bio if available
    let bio = series.description?.trim() || undefined
    let image = series.thumbnail_url || undefined
    if (series.vendor_id) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('bio, profile_image, profile_picture_url')
        .eq('id', series.vendor_id)
        .maybeSingle()
      if (vendor?.bio?.trim()) bio = vendor.bio.trim()
      if (vendor?.profile_picture_url || vendor?.profile_image) {
        image = (vendor as { profile_picture_url?: string; profile_image?: string }).profile_picture_url
          || (vendor as { profile_picture_url?: string; profile_image?: string }).profile_image
      }
    }

    // Get vendor slug from vendor_collections (prefer vendor_id)
    let vendorSlug = slugify(series.vendor_name)
    const vcQuery = series.vendor_id
      ? supabase.from('vendor_collections').select('shopify_collection_handle').eq('vendor_id', series.vendor_id)
      : supabase.from('vendor_collections').select('shopify_collection_handle').eq('vendor_name', series.vendor_name)
    const { data: vc } = await vcQuery.maybeSingle()
    if (vc?.shopify_collection_handle) {
      vendorSlug = vc.shopify_collection_handle
    }

    return NextResponse.json({
      vendorName: series.vendor_name,
      vendorSlug,
      bio,
      image,
      productIds,
      seriesName: series.name,
    })
  } catch (error) {
    console.error('[artist-spotlight] Error:', error)
    return NextResponse.json(null)
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
