import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Cart Series Suggestions API — Track B2
 * 
 * Given product handles in the cart, finds series that those products
 * belong to and suggests other products from the same series.
 * 
 * POST body: { handles: string[] }
 * Returns: { suggestions: Array<{ id, handle, title, price, image_url, series_name, series_id, vendor_name }> }
 */

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const handles: string[] = body.handles || []

    if (handles.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    const supabase = await createClient()

    // 1. Find submissions matching these handles
    const { data: cartSubmissions } = await supabase
      .from('vendor_product_submissions')
      .select('id, series_id, shopify_product_handle')
      .in('shopify_product_handle', handles)
      .not('series_id', 'is', null)

    if (!cartSubmissions || cartSubmissions.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    // 2. Get unique series IDs from cart items
    const seriesIds = [...new Set(cartSubmissions.map(s => s.series_id).filter(Boolean))]
    const cartSubmissionIds = new Set(cartSubmissions.map(s => s.id))

    // 3. Fetch series info
    const { data: seriesInfo } = await supabase
      .from('artwork_series')
      .select('id, name')
      .in('id', seriesIds)

    const seriesNameMap = new Map<string, string>()
    ;(seriesInfo || []).forEach(s => seriesNameMap.set(s.id, s.name))

    // 4. Get all members of these series (excluding what's already in cart)
    const { data: seriesMembers } = await supabase
      .from('artwork_series_members')
      .select(`
        series_id,
        submission_id,
        display_order,
        is_locked,
        vendor_product_submissions!inner (
          id,
          title,
          shopify_product_id,
          shopify_product_handle,
          price,
          images
        )
      `)
      .in('series_id', seriesIds)
      .eq('is_locked', false)
      .order('display_order', { ascending: true })

    if (!seriesMembers || seriesMembers.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    // 5. Filter out items already in cart and build suggestions
    const suggestions = seriesMembers
      .filter(member => {
        const submission = member.vendor_product_submissions as any
        return (
          submission?.shopify_product_handle &&
          !handles.includes(submission.shopify_product_handle) &&
          !cartSubmissionIds.has(member.submission_id || '')
        )
      })
      .map(member => {
        const submission = member.vendor_product_submissions as any
        const images = submission?.images as string[] | null

        return {
          id: submission?.shopify_product_id || member.submission_id,
          handle: submission?.shopify_product_handle,
          title: submission?.title || 'Untitled',
          price: submission?.price || null,
          image_url: images?.[0] || null,
          series_name: seriesNameMap.get(member.series_id) || 'Series',
          series_id: member.series_id,
          vendor_name: '', // Could be enriched if needed
        }
      })
      .filter(s => s.handle) // Only include items with valid handles
      .slice(0, 4) // Limit to 4 suggestions

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error('[Cart Series Suggestions] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}
