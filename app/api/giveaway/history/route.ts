/**
 * API route to fetch giveaway history
 * GET /api/giveaway/history?page=1&limit=10
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HistoryResponse, GiveawayRecord } from '@/lib/giveaway/types'

export async function GET(request: NextRequest): Promise<NextResponse<HistoryResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))

    const offset = (page - 1) * pageSize

    const supabase = createClient()

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('giveaway_entries')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error getting count:', countError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch giveaway history.',
        },
        { status: 500 }
      )
    }

    // Get paginated results
    const { data, error } = await supabase
      .from('giveaway_entries')
      .select('id, giveaway_name, entry_data, winner_data, status, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch giveaway history.',
        },
        { status: 500 }
      )
    }

    const records: GiveawayRecord[] = (data || []).map(record => ({
      id: record.id,
      giveaway_name: record.giveaway_name,
      entry_data: record.entry_data as any,
      winner_data: record.winner_data as any,
      status: record.status as 'active' | 'completed',
      created_at: record.created_at,
      updated_at: record.updated_at,
    }))

    return NextResponse.json(
      {
        success: true,
        data: records,
        total: totalCount || 0,
        page,
        pageSize,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while fetching giveaway history.',
      },
      { status: 500 }
    )
  }
}
