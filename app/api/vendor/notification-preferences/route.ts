import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()

    // Get or create notification preferences
    const { data: prefs, error: fetchError } = await supabase
      .from("vendor_notification_preferences")
      .select("*")
      .eq("vendor_name", vendorName)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = not found, which is okay
      console.error("Error fetching notification preferences:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch preferences", message: fetchError.message },
        { status: 500 },
      )
    }

    // If no preferences exist, return defaults
    if (!prefs) {
      return NextResponse.json({
        success: true,
        preferences: {
          notify_on_collector_auth: true,
          weekly_auth_digest: false,
        },
      })
    }

    return NextResponse.json({
      success: true,
      preferences: {
        notify_on_collector_auth: prefs.notify_on_collector_auth !== false,
        weekly_auth_digest: prefs.weekly_auth_digest === true,
      },
    })
  } catch (error: any) {
    console.error("Error in notification preferences GET API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const body = await request.json()

    // Upsert notification preferences
    const { data: prefs, error: upsertError } = await supabase
      .from("vendor_notification_preferences")
      .upsert(
        {
          vendor_name: vendorName,
          notify_on_collector_auth: body.notify_on_collector_auth !== false,
          weekly_auth_digest: body.weekly_auth_digest === true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "vendor_name",
        }
      )
      .select()
      .single()

    if (upsertError) {
      console.error("Error upserting notification preferences:", upsertError)
      return NextResponse.json(
        { error: "Failed to save preferences", message: upsertError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      preferences: prefs,
    })
  } catch (error: any) {
    console.error("Error in notification preferences POST API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
