/**
 * POST /api/experience/quiz-signup/link
 * Links the current authenticated user to any experience_quiz_signups row(s) with matching email.
 * Sets collector_user_id so we can associate the signup with the account after login.
 * Idempotent: safe to call on every experience page load when authenticated.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized', linked: false }, { status: 401 })
    }

    const email = user.email.trim()
    const { error: updateError } = await supabase
      .from('experience_quiz_signups')
      .update({ collector_user_id: user.id })
      .ilike('email', email)

    if (updateError) {
      console.warn('[experience/quiz-signup/link] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to link signup', linked: false },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, linked: true })
  } catch (e) {
    console.error('[experience/quiz-signup/link] Error:', e)
    return NextResponse.json(
      { error: 'An error occurred', linked: false },
      { status: 500 }
    )
  }
}
