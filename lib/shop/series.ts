/**
 * Shop Series Data Helpers
 * 
 * Functions for fetching series information for shop product pages.
 * Includes collector progress tracking and series browsing.
 */

import { createClient } from '@/lib/supabase/server'

// =============================================================================
// TYPES
// =============================================================================

export interface SeriesInfo {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  vendor_name: string
  total_artworks: number
  current_position: number
  display_order: number
}

export interface CollectorSeriesProgress {
  series_id: string
  total_artworks: number
  owned_count: number
  owned_percentage: number
  owned_artwork_ids: string[]
}

export interface SeriesArtwork {
  id: string
  submission_id: string
  shopify_product_id: string | null
  title: string
  handle: string | null
  price: number | null
  image_url: string | null
  is_locked: boolean
  display_order: number
  availability_status: 'available' | 'sold_out' | 'upcoming'
}

export interface EditionInfo {
  edition_size: number | null
  edition_number: number | null
  total_editions: number | null
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract numeric Shopify ID from GID format
 */
function extractNumericId(gid: string): string {
  // "gid://shopify/Product/1234567890" -> "1234567890"
  return gid.split('/').pop() || ''
}

/**
 * Get series information for a product by Shopify product ID
 */
export async function getProductSeriesInfo(
  shopifyProductId: string
): Promise<SeriesInfo | null> {
  try {
    const supabase = await createClient()
    const numericId = extractNumericId(shopifyProductId)

    // 1. Find the product submission by shopify_product_id in JSON
    const { data: submission, error: submissionError } = await supabase
      .from('vendor_product_submissions')
      .select('id, series_id')
      .eq('product_data->>shopify_product_id', numericId)
      .single()

    if (submissionError || !submission?.series_id) {
      return null
    }

    // 2. Get series info with member count
    const { data: series, error: seriesError } = await supabase
      .from('artwork_series')
      .select(`
        id,
        name,
        description,
        thumbnail_url,
        vendor_name
      `)
      .eq('id', submission.series_id)
      .single()

    if (seriesError || !series) {
      return null
    }

    // 3. Get total artwork count in series
    const { count: totalArtworks } = await supabase
      .from('artwork_series_members')
      .select('*', { count: 'exact', head: true })
      .eq('series_id', submission.series_id)

    // 4. Get this artwork's position in the series
    const { data: member } = await supabase
      .from('artwork_series_members')
      .select('display_order')
      .eq('submission_id', submission.id)
      .single()

    return {
      id: series.id,
      name: series.name,
      description: series.description,
      thumbnail_url: series.thumbnail_url,
      vendor_name: series.vendor_name,
      total_artworks: totalArtworks || 0,
      current_position: member?.display_order || 0,
      display_order: member?.display_order || 0,
    }
  } catch (error) {
    console.error('Error fetching product series info:', error)
    return null
  }
}

/**
 * Get collector's progress in a series (requires authentication)
 */
export async function getCollectorSeriesProgress(
  seriesId: string,
  collectorEmail: string
): Promise<CollectorSeriesProgress | null> {
  try {
    const supabase = await createClient()

    // 1. Get total artworks in series
    const { count: totalArtworks } = await supabase
      .from('artwork_series_members')
      .select('*', { count: 'exact', head: true })
      .eq('series_id', seriesId)

    // 2. Get series members with their submission IDs
    const { data: members } = await supabase
      .from('artwork_series_members')
      .select('submission_id')
      .eq('series_id', seriesId)

    if (!members) {
      return null
    }

    const submissionIds = members
      .map(m => m.submission_id)
      .filter((id): id is string => id !== null)

    // 3. Find owned line items for these submissions
    const { data: ownedLineItems } = await supabase
      .from('line_items')
      .select('submission_id')
      .eq('owner_email', collectorEmail)
      .in('submission_id', submissionIds)
      .eq('status', 'active')

    const ownedSubmissionIds = ownedLineItems?.map(li => li.submission_id) || []
    const uniqueOwnedIds = [...new Set(ownedSubmissionIds)]

    return {
      series_id: seriesId,
      total_artworks: totalArtworks || 0,
      owned_count: uniqueOwnedIds.length,
      owned_percentage: totalArtworks
        ? Math.round((uniqueOwnedIds.length / totalArtworks) * 100)
        : 0,
      owned_artwork_ids: uniqueOwnedIds,
    }
  } catch (error) {
    console.error('Error fetching collector series progress:', error)
    return null
  }
}

/**
 * Get all artworks in a series for the browse page
 */
export async function getSeriesArtworks(
  seriesId: string,
  collectorEmail?: string
): Promise<SeriesArtwork[]> {
  try {
    const supabase = await createClient()

    // Get series members with submission details
    const { data: members, error } = await supabase
      .from('artwork_series_members')
      .select(`
        id,
        submission_id,
        is_locked,
        display_order,
        vendor_product_submissions!inner (
          id,
          title,
          shopify_product_id,
          shopify_product_handle,
          price,
          images
        )
      `)
      .eq('series_id', seriesId)
      .order('display_order', { ascending: true })

    if (error || !members) {
      console.error('Error fetching series artworks:', error)
      return []
    }

    // Get owned artworks if collector email provided
    let ownedSubmissionIds: string[] = []
    if (collectorEmail) {
      const { data: ownedLineItems } = await supabase
        .from('line_items')
        .select('submission_id')
        .eq('owner_email', collectorEmail)
        .in(
          'submission_id',
          members.map(m => m.submission_id).filter(Boolean)
        )
        .eq('status', 'active')

      ownedSubmissionIds = ownedLineItems?.map(li => li.submission_id) || []
    }

    // Transform to SeriesArtwork format
    return members.map(member => {
      const submission = member.vendor_product_submissions as any
      const images = submission?.images as string[] | null
      const isOwned = ownedSubmissionIds.includes(member.submission_id || '')

      // Determine availability status
      let availability_status: 'available' | 'sold_out' | 'upcoming' = 'available'
      if (member.is_locked && !isOwned) {
        availability_status = 'upcoming'
      } else if (!submission?.shopify_product_id) {
        availability_status = 'upcoming'
      }

      return {
        id: member.id,
        submission_id: member.submission_id || '',
        shopify_product_id: submission?.shopify_product_id || null,
        title: submission?.title || 'Untitled',
        handle: submission?.shopify_product_handle || null,
        price: submission?.price || null,
        image_url: images?.[0] || null,
        is_locked: member.is_locked && !isOwned,
        display_order: member.display_order,
        availability_status,
      }
    })
  } catch (error) {
    console.error('Error fetching series artworks:', error)
    return []
  }
}

/**
 * Get series details (for series page header)
 */
export async function getSeriesDetails(seriesId: string) {
  try {
    const supabase = await createClient()

    const { data: series, error } = await supabase
      .from('artwork_series')
      .select(`
        id,
        name,
        description,
        thumbnail_url,
        vendor_name,
        unlock_type,
        release_date,
        genre_tags
      `)
      .eq('id', seriesId)
      .single()

    if (error || !series) {
      return null
    }

    // Get member count
    const { count: totalArtworks } = await supabase
      .from('artwork_series_members')
      .select('*', { count: 'exact', head: true })
      .eq('series_id', seriesId)

    return {
      ...series,
      total_artworks: totalArtworks || 0,
    }
  } catch (error) {
    console.error('Error fetching series details:', error)
    return null
  }
}

/**
 * Get edition information from product metafields or database
 */
export async function getProductEditionInfo(
  shopifyProductId: string
): Promise<EditionInfo> {
  try {
    const supabase = await createClient()
    const numericId = extractNumericId(shopifyProductId)

    // Get submission with edition data from JSON
    const { data: submission } = await supabase
      .from('vendor_product_submissions')
      .select('product_data')
      .eq('product_data->>shopify_product_id', numericId)
      .single()

    if (!submission || !submission.product_data) {
      return {
        edition_size: null,
        edition_number: null,
        total_editions: null,
      }
    }

    const productData = submission.product_data as any

    return {
      edition_size: productData.edition_size || null,
      edition_number: null, // This would come from the specific line item
      total_editions: productData.edition_total || productData.edition_size || null,
    }
  } catch (error) {
    console.error('Error fetching edition info:', error)
    return {
      edition_size: null,
      edition_number: null,
      total_editions: null,
    }
  }
}
