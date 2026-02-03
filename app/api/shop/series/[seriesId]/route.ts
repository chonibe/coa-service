import { NextResponse } from 'next/server'
import { getSeriesDetails, getSeriesArtworks } from '@/lib/shop/series'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await context.params

    // Get series details
    const series = await getSeriesDetails(seriesId)
    
    if (!series) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      )
    }

    // Get collector email if authenticated
    let collectorEmail: string | undefined
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      collectorEmail = user?.email || undefined
    } catch (error) {
      // Not authenticated, continue without collector info
    }

    // Get artworks with collector context
    const artworks = await getSeriesArtworks(seriesId, collectorEmail)

    return NextResponse.json({
      series,
      artworks,
    })
  } catch (error: any) {
    console.error('Error fetching series:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch series' },
      { status: 500 }
    )
  }
}
