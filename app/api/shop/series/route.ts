import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Series Listing API — Track B2
 * 
 * Returns all active artwork series with metadata.
 * For authenticated collectors, includes progress indicators.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated for collector progress
    let collectorEmail: string | undefined
    try {
      const { data: { user } } = await supabase.auth.getUser()
      collectorEmail = user?.email || undefined
    } catch {
      // Not authenticated, continue without collector info
    }

    // Fetch all active series with member counts
    const { data: seriesList, error } = await supabase
      .from('artwork_series')
      .select(`
        id,
        name,
        description,
        thumbnail_url,
        vendor_name,
        vendor_id,
        unlock_type,
        is_active,
        display_order,
        release_date,
        genre_tags
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[Series API] Error fetching series:', error)
      return NextResponse.json(
        { error: 'Failed to fetch series' },
        { status: 500 }
      )
    }

    if (!seriesList || seriesList.length === 0) {
      return NextResponse.json({ series: [] })
    }

    // Get member counts for all series in a single query
    const seriesIds = seriesList.map(s => s.id)
    const { data: memberCounts } = await supabase
      .from('artwork_series_members')
      .select('series_id')
      .in('series_id', seriesIds)

    // Count members per series
    const countMap = new Map<string, number>()
    ;(memberCounts || []).forEach((m: any) => {
      countMap.set(m.series_id, (countMap.get(m.series_id) || 0) + 1)
    })

    // If authenticated, get collector progress for all series
    let progressMap = new Map<string, { owned: number; total: number }>()
    if (collectorEmail) {
      // Get all series member submission IDs
      const { data: allMembers } = await supabase
        .from('artwork_series_members')
        .select('series_id, submission_id')
        .in('series_id', seriesIds)

      if (allMembers && allMembers.length > 0) {
        const submissionIds = allMembers
          .map(m => m.submission_id)
          .filter((id): id is string => id !== null)

        // Get owned line items
        const { data: ownedItems } = await supabase
          .from('line_items')
          .select('submission_id')
          .eq('owner_email', collectorEmail)
          .in('submission_id', submissionIds)
          .eq('status', 'active')

        const ownedSet = new Set((ownedItems || []).map((li: any) => li.submission_id))

        // Calculate progress per series
        allMembers.forEach((member: any) => {
          const current = progressMap.get(member.series_id) || { owned: 0, total: 0 }
          current.total++
          if (member.submission_id && ownedSet.has(member.submission_id)) {
            current.owned++
          }
          progressMap.set(member.series_id, current)
        })
      }
    }

    // Build enriched series list
    const series = seriesList.map(s => {
      const totalArtworks = countMap.get(s.id) || 0
      const progress = progressMap.get(s.id)

      return {
        id: s.id,
        name: s.name,
        description: s.description,
        thumbnail_url: s.thumbnail_url,
        vendor_name: s.vendor_name,
        unlock_type: s.unlock_type,
        total_artworks: totalArtworks,
        release_date: s.release_date,
        genre_tags: s.genre_tags,
        // Collector progress (only if authenticated)
        collector_progress: progress
          ? {
              owned_count: progress.owned,
              total_artworks: progress.total,
              owned_percentage: progress.total > 0
                ? Math.round((progress.owned / progress.total) * 100)
                : 0,
            }
          : null,
      }
    })

    return NextResponse.json({ series })
  } catch (error: any) {
    console.error('[Series API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch series' },
      { status: 500 }
    )
  }
}
