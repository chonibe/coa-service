/**
 * POST /api/experience/quiz-signup
 * Persist experience intro quiz signup (name, email, owns_lamp, purpose) for tracking and marketing.
 * Body: { email?: string, name?: string, ownsLamp: boolean, purpose: 'self' | 'gift', affiliateArtistSlug?: string }
 * At least one of email or name is required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendMetaServerEvent } from '@/lib/meta-conversions-server'
import { sendTikTokEvent } from '@/lib/tiktok-events-server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { email, name, ownsLamp, purpose, affiliateArtistSlug } = body

    const trimmedEmail =
      typeof email === 'string' && email.trim() && EMAIL_REGEX.test(email.trim())
        ? email.trim()
        : null
    const trimmedName = typeof name === 'string' ? name.trim() || null : null

    if (!trimmedEmail && !trimmedName) {
      return NextResponse.json(
        { error: 'At least one of email or name is required' },
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
      name: trimmedName,
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

    // Fire Meta Lead event for quiz signup (only if email provided)
    if (trimmedEmail) {
      await sendMetaServerEvent({
        eventName: 'Lead',
        userData: {
          em: trimmedEmail,
        },
        customData: {
          lead_type: 'experience_quiz',
          owns_lamp: ownsLamp,
          purpose,
        },
      }).catch((err) => {
        // Log but don't fail the request if Meta event fails
        console.error('[quiz-signup] Failed to send Meta Lead event:', err)
      })

      // Fire TikTok SubmitForm event for quiz signup
      await sendTikTokEvent({
        event: 'SubmitForm',
        userData: {
          email: trimmedEmail,
        },
        properties: {
          content_type: 'experience_quiz',
        },
      }).catch((err) => {
        // Log but don't fail the request if TikTok event fails
        console.error('[quiz-signup] Failed to send TikTok SubmitForm event:', err)
      })
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
