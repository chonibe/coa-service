/**
 * POST /api/experience/quiz-signup
 * Persist experience intro quiz signup (email, name, owns_lamp, purpose) for tracking and marketing.
 * Body: { email: string, name?: string, ownsLamp: boolean, purpose: 'self' | 'gift', affiliateArtistSlug?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { email, name, ownsLamp, purpose, affiliateArtistSlug } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid email' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (typeof ownsLamp !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid ownsLamp' },
        { status: 400 }
      )
    }

    if (purpose !== 'self' && purpose !== 'gift') {
      return NextResponse.json(
        { error: 'Invalid purpose; must be "self" or "gift"' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { error } = await supabase.from('experience_quiz_signups').insert({
      email: trimmedEmail,
      name: typeof name === 'string' ? name.trim() || null : null,
      owns_lamp: ownsLamp,
      purpose,
      source: 'experience',
      affiliate_artist_slug:
        typeof affiliateArtistSlug === 'string' && affiliateArtistSlug.trim()
          ? affiliateArtistSlug.trim()
          : null,
    })

    if (error) {
      console.error('Experience quiz signup insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save signup' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e) {
    console.error('Experience quiz signup error:', e)
    return NextResponse.json(
      { error: 'An error occurred while saving signup' },
      { status: 500 }
    )
  }
}
