import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(cookieStore)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serviceClient = createServiceClient()
    const { data: vendor, error: vendorError } = await serviceClient
      .from("vendors")
      .select("id, status")
      .eq("vendor_name", vendorName)
      .maybeSingle()

    if (vendorError || !vendor) {
      console.error("Error fetching vendor:", vendorError)
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    if (vendor.status !== "active") {
      return NextResponse.json({ error: "Vendor account inactive" }, { status: 403 })
    }

    const { paypalEmail, notifyOnSale, notifyOnPayout, notifyOnMessage } = await request.json()

    const { error: updateError } = await serviceClient
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

    // Fetch and return the updated vendor data
    const { data: updatedVendor, error: fetchError } = await serviceClient
      .from("vendors")
      .select("*")
      .eq("id", vendor.id)
      .maybeSingle()

    if (fetchError || !updatedVendor) {
      console.error("Error fetching updated vendor:", fetchError)
      return NextResponse.json({ error: "Failed to fetch updated vendor" }, { status: 500 })
    }

    return NextResponse.json({ success: true, vendor: updatedVendor })
  } catch (error) {
    console.error("Error updating vendor settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
