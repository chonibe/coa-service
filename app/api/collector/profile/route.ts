import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyCollectorSessionToken } from "@/lib/collector-session"
import { z } from "zod"

// Profile schema for validation
const CollectorProfileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
})

/**
 * GET /api/collector/profile
 * Get the current user's collector profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify collector session
    const collectorSession = verifyCollectorSessionToken(request.cookies.get("collector_session")?.value)
    if (!collectorSession) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sessionEmail = collectorSession.email
    if (!sessionEmail) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      )
    }

    // Get collector profile by email
    const { data: profile, error: profileError } = await supabase
      .from('collector_profiles')
      .select('*')
      .eq('email', sessionEmail)
      .single()

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    // If no profile exists, return error (profile should be created during OAuth)
    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile
    })
  } catch (error: any) {
    console.error('Profile GET error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/collector/profile
 * Update the current user's collector profile
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify collector session
    const collectorSession = verifyCollectorSessionToken(request.cookies.get("collector_session")?.value)
    if (!collectorSession) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sessionEmail = collectorSession.email
    if (!sessionEmail) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = CollectorProfileSchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message).join(", ")
      return NextResponse.json(
        { success: false, message: `Validation failed: ${errorMessages}` },
        { status: 400 }
      )
    }

    const updates = validationResult.data

    // Ensure profile exists for this email
    const { data: existingProfile } = await supabase
      .from('collector_profiles')
      .select('id')
      .eq('email', sessionEmail)
      .single()

    if (!existingProfile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found' },
        { status: 404 }
      )
    }

    // Update the profile (trigger will automatically log changes)
    const { data: updatedProfile, error: updateError } = await supabase
      .from('collector_profiles')
      .update(updates)
      .eq('email', sessionEmail)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    })
  } catch (error: any) {
    console.error('Profile PUT error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


