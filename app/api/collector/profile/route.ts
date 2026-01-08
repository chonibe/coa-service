import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get collector profile
    const { data: profile, error: profileError } = await supabase
      .from('collector_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    // If no profile exists, create one with basic info from user
    if (!profile) {
      const newProfile = {
        user_id: user.id,
        email: user.email || '',
        first_name: null,
        last_name: null,
        phone: null,
        bio: null,
        avatar_url: null,
      }

      const { data: createdProfile, error: createError } = await supabase
        .from('collector_profiles')
        .insert(newProfile)
        .select()
        .single()

      if (createError) {
        console.error('Profile creation error:', createError)
        return NextResponse.json(
          { success: false, message: 'Failed to create profile' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        profile: createdProfile
      })
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
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

    // Ensure user owns the profile they're updating
    const { data: existingProfile } = await supabase
      .from('collector_profiles')
      .select('id')
      .eq('user_id', user.id)
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
      .eq('user_id', user.id)
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
