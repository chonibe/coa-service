/**
 * API: Get collector profile (RBAC v2 - Example Migration)
 * 
 * This demonstrates using the new withCollector middleware.
 * 
 * Old way:
 * ```typescript
 * const collectorSession = getCollectorSession(request.cookies)
 * if (!collectorSession?.email) {
 *   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
 * }
 * ```
 * 
 * New way:
 * ```typescript
 * export const GET = withCollector(async (request, { user }) => {
 *   // user.userId and user.email guaranteed to be available
 * })
 * ```
 */

import { NextRequest, NextResponse } from "next/server"
import { withCollector } from "@/lib/rbac/middleware"
import { createClient as createServiceClient } from "@/lib/supabase/server"

export const GET = withCollector(async (request: NextRequest, { user }) => {
  try {
    const supabase = createServiceClient()

    // Get collector profile
    const { data: profile, error: profileError } = await supabase
      .from("collector_profiles")
      .select("*")
      .eq("user_id", user.userId)
      .maybeSingle()

    if (profileError) {
      console.error("[collector/profile-new] Error fetching profile:", profileError)
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      )
    }

    // Get collector's orders count
    const { count: ordersCount, error: ordersError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("customer_email", user.email)

    // Get collector's line items (editions owned)
    const { count: editionsCount, error: editionsError } = await supabase
      .from("order_line_items_v2")
      .select("*", { count: "exact", head: true })
      .or(`owner_id.eq.${user.userId},owner_email.ilike.${user.email}`)
      .eq("status", "active")

    return NextResponse.json({
      profile: profile || {
        user_id: user.userId,
        email: user.email,
        // Default profile data
      },
      stats: {
        orders: ordersCount || 0,
        editions: editionsCount || 0,
      },
      _debug: {
        requestedBy: user.email,
        userId: user.userId,
        roles: user.roles,
      },
    })
  } catch (error: any) {
    console.error("[collector/profile-new] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})

export const PUT = withCollector(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json()
    const { first_name, last_name, phone, bio, avatar_url } = body

    const supabase = createServiceClient()

    // Upsert collector profile
    const { data: profile, error } = await supabase
      .from("collector_profiles")
      .upsert({
        user_id: user.userId,
        email: user.email,
        first_name,
        last_name,
        phone,
        bio,
        avatar_url,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      })
      .select()
      .single()

    if (error) {
      console.error("[collector/profile-new] Error updating profile:", error)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profile,
      message: "Profile updated successfully",
    })
  } catch (error: any) {
    console.error("[collector/profile-new] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})
