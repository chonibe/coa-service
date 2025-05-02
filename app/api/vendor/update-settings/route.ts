import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Get the vendor session
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the vendor ID from the session
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("auth_id", session.user.id)
      .single()

    if (vendorError || !vendor) {
      console.error("Error fetching vendor:", vendorError)
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Get the request body
    const { paypalEmail, notifyOnSale, notifyOnPayout, notifyOnMessage } = await request.json()

    // Update the vendor settings
    const { error: updateError } = await supabase
      .from("vendors")
      .update({
        paypal_email: paypalEmail,
        notify_on_sale: notifyOnSale,
        notify_on_payout: notifyOnPayout,
        notify_on_message: notifyOnMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendor.id)

    if (updateError) {
      console.error("Error updating vendor settings:", updateError)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating vendor settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
