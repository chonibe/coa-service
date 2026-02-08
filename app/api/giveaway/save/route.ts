/**
 * API route to save giveaway results
 * POST /api/giveaway/save
 * Body: { giveawayName: string, entryData: GiveawayEntryData, winnerData: GiveawayWinnerData }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SaveResponse, GiveawayEntryData, GiveawayWinnerData } from '@/lib/giveaway/types'

export async function POST(request: NextRequest): Promise<NextResponse<SaveResponse>> {
  try {
    const body = await request.json()
    const { giveawayName, entryData, winnerData } = body

    // Validate required fields
    if (!giveawayName || typeof giveawayName !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid "giveawayName" field.',
        },
        { status: 400 }
      )
    }

    if (!entryData || typeof entryData !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid "entryData" field.',
        },
        { status: 400 }
      )
    }

    if (!winnerData || typeof winnerData !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid "winnerData" field.',
        },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Insert the giveaway record
    const { data, error } = await supabase
      .from('giveaway_entries')
      .insert({
        giveaway_name: giveawayName.trim(),
        entry_data: entryData as GiveawayEntryData,
        winner_data: winnerData as GiveawayWinnerData,
        status: 'completed',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save giveaway results to database.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        giveawayId: data.id,
        message: 'Giveaway results saved successfully.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error saving giveaway:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while saving the giveaway.',
      },
      { status: 500 }
    )
  }
}
