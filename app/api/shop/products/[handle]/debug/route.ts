import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Debug endpoint to check product series/edition data
 * Access at: /api/shop/products/[handle]/debug
 */

export async function GET(
  request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await context.params
    const supabase = await createClient()

    // 1. Find product by handle in vendor_product_submissions
    const { data: submissions, error: submissionError } = await supabase
      .from('vendor_product_submissions')
      .select(`
        id,
        title,
        shopify_product_id,
        shopify_product_handle,
        series_id,
        edition_size,
        edition_total,
        artwork_series:series_id (
          id,
          name,
          vendor_name
        )
      `)
      .eq('shopify_product_handle', handle)

    if (submissionError) {
      return NextResponse.json({
        error: 'Database query failed',
        details: submissionError,
      }, { status: 500 })
    }

    // 2. Check if any submissions found
    if (!submissions || submissions.length === 0) {
      return NextResponse.json({
        message: 'No submission found for this product handle',
        handle,
        tip: 'This product may not be linked in vendor_product_submissions table',
        possibleReasons: [
          'Product created in Shopify but not submitted through vendor dashboard',
          'shopify_product_handle not matching URL handle',
          'Product not yet synced to database'
        ]
      })
    }

    // 3. If series exists, get member count
    let seriesDetails = null
    if (submissions[0].series_id) {
      const { count } = await supabase
        .from('artwork_series_members')
        .select('*', { count: 'exact', head: true })
        .eq('series_id', submissions[0].series_id)

      seriesDetails = {
        ...submissions[0].artwork_series,
        member_count: count,
      }
    }

    return NextResponse.json({
      success: true,
      handle,
      submission: {
        id: submissions[0].id,
        title: submissions[0].title,
        shopify_product_id: submissions[0].shopify_product_id,
        shopify_product_handle: submissions[0].shopify_product_handle,
      },
      hasSeries: !!submissions[0].series_id,
      seriesInfo: seriesDetails,
      hasEditionInfo: !!(submissions[0].edition_size || submissions[0].edition_total),
      editionInfo: {
        edition_size: submissions[0].edition_size,
        edition_total: submissions[0].edition_total,
      },
      recommendations: [
        submissions[0].series_id ? null : '💡 Add this product to a series to show series info',
        submissions[0].edition_size ? null : '💡 Set edition_size to show edition info',
      ].filter(Boolean)
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Unexpected error',
      message: error.message,
    }, { status: 500 })
  }
}
