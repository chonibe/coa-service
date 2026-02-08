/**
 * API route to parse Instagram comments
 * POST /api/giveaway/parse
 * Body: { comments: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  parseInstagramComments,
  createWheelEntries,
  getParseStats,
  generatePreviewText,
} from '@/lib/giveaway/comment-parser'
import { ParseResponse } from '@/lib/giveaway/types'

export async function POST(request: NextRequest): Promise<NextResponse<ParseResponse>> {
  try {
    const body = await request.json()
    const { comments } = body

    if (!comments || typeof comments !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid "comments" field. Expected a string.',
        },
        { status: 400 }
      )
    }

    if (comments.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Comments field is empty.',
        },
        { status: 400 }
      )
    }

    // Parse the comments
    const parsedData = parseInstagramComments(comments)

    // Create wheel entries
    const wheelEntries = createWheelEntries(parsedData.tags)

    // Get statistics
    const stats = getParseStats(parsedData)
    const preview = generatePreviewText(wheelEntries)

    return NextResponse.json(
      {
        success: true,
        data: parsedData,
        wheelEntries,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error parsing comments:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to parse comments. Please try again.',
      },
      { status: 500 }
    )
  }
}
