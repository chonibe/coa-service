import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

/**
 * PUT /api/admin/payouts/notification-preferences/[vendorName]
 * Update notification preferences for a vendor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { vendorName: string } }
) {
  try {
    await guardAdminRequest()

    const body = await request.json()
    const supabase = createClient()

    // Check if preferences exist
    const { data: existing } = await supabase
      .from("vendor_notification_preferences")
      .select("*")
      .eq("vendor_name", params.vendorName)
      .single()

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("vendor_notification_preferences")
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq("vendor_name", params.vendorName)
        .select()
        .single()

      if (error) {
        console.error("Error updating preferences:", error)
        return NextResponse.json(
          { error: "Failed to update preferences", details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ preferences: data })
    } else {
      // Create new
      const { data, error } = await supabase
        .from("vendor_notification_preferences")
        .insert({
          vendor_name: params.vendorName,
          email_enabled: body.email_enabled !== false,
          payout_processed: body.payout_processed !== false,
          payout_failed: body.payout_failed !== false,
          payout_pending: body.payout_pending !== false,
          refund_deduction: body.refund_deduction !== false,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating preferences:", error)
        return NextResponse.json(
          { error: "Failed to create preferences", details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ preferences: data })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

