import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const LinkGuestPurchasesSchema = z.object({
  email: z.string().email(),
})

/**
 * POST /api/collector/link-guest-purchases
 * Link guest purchases (by email) to the current user's account
 */
export async function POST(request: NextRequest) {
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
    const validationResult = LinkGuestPurchasesSchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message).join(", ")
      return NextResponse.json(
        { success: false, message: `Validation failed: ${errorMessages}` },
        { status: 400 }
      )
    }

    const { email } = validationResult.data

    // Check if the user already owns this email (i.e., it's their current email)
    if (user.email === email) {
      return NextResponse.json(
        { success: false, message: 'This email is already linked to your account' },
        { status: 400 }
      )
    }

    // Check if there are any guest purchases with this email
    const { data: guestPurchases, error: guestError } = await supabase
      .from('order_line_items_v2')
      .select('id, name, edition_number, product_id')
      .eq('owner_email', email)
      .is('owner_id', null) // Only link purchases that aren't already linked to another account

    if (guestError) {
      console.error('Error fetching guest purchases:', guestError)
      return NextResponse.json(
        { success: false, message: 'Failed to check guest purchases' },
        { status: 500 }
      )
    }

    if (!guestPurchases || guestPurchases.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No unlinked purchases found with this email' },
        { status: 404 }
      )
    }

    // Check if any of these purchases are already linked to another user
    const { data: conflictingPurchases } = await supabase
      .from('order_line_items_v2')
      .select('id')
      .eq('owner_email', email)
      .not('owner_id', 'is', null)
      .neq('owner_id', user.id)

    if (conflictingPurchases && conflictingPurchases.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Some purchases with this email are already linked to another account' },
        { status: 409 }
      )
    }

    // Link the purchases to this user
    const { error: linkError } = await supabase
      .from('order_line_items_v2')
      .update({ owner_id: user.id })
      .eq('owner_email', email)
      .is('owner_id', null)

    if (linkError) {
      console.error('Error linking purchases:', linkError)
      return NextResponse.json(
        { success: false, message: 'Failed to link purchases' },
        { status: 500 }
      )
    }

    // Create or update the collector profile with this email as the primary email
    const { data: existingProfile } = await supabase
      .from('collector_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingProfile) {
      // Update existing profile to use this email
      await supabase
        .from('collector_profiles')
        .update({ email })
        .eq('user_id', user.id)
    } else {
      // Create new profile
      await supabase
        .from('collector_profiles')
        .insert({
          user_id: user.id,
          email,
          first_name: null,
          last_name: null,
          phone: null,
          bio: null,
          avatar_url: null,
        })
    }

    // Re-run edition assignment to update names based on the new profile
    const productIds = [...new Set(guestPurchases.map(p => p.product_id))]
    for (const productId of productIds) {
      await supabase.rpc('assign_edition_numbers', { p_product_id: productId.toString() })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully linked ${guestPurchases.length} purchases`,
      data: {
        purchases_linked: guestPurchases.length,
        products_updated: productIds.length
      }
    })
  } catch (error: any) {
    console.error('Link guest purchases error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

