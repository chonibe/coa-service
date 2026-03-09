/**
 * POST /api/experience/ab-assignment
 * Records an A/B test variant assignment (onboarding vs skip) for the experience page.
 * Body: { variant: 'onboarding' | 'skip' }
 * Used to compare conversion/engagement between cohorts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_VARIANTS = ['onboarding', 'skip'] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const variant = body?.variant

    if (!variant || !VALID_VARIANTS.includes(variant)) {
      return NextResponse.json(
        { error: 'Invalid or missing variant; use "onboarding" or "skip"' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { error } = await supabase.from('experience_ab_assignments').insert({ variant })

    if (error) {
      console.warn('[experience/ab-assignment] Insert error:', error)
      return NextResponse.json(
        { error: 'Failed to record assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e) {
    console.error('[experience/ab-assignment] Error:', e)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
