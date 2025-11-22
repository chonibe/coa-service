import { NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/admin/payouts/notification-preferences
 * Get all vendor notification preferences
 */
export async function GET() {
  try {
    await guardAdminRequest()

    const supabase = createClient()
    const { data: preferences, error } = await supabase
      .from("vendor_notification_preferences")
      .select("*")
      .order("vendor_name")

    if (error) {
      console.error("Error fetching preferences:", error)
      return NextResponse.json(
        { error: "Failed to fetch preferences", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ preferences: preferences || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

