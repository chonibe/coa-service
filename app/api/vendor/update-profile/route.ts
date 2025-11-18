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
      .select("id, vendor_name, status")
      .eq("vendor_name", vendorName)
      .maybeSingle()

    if (vendorError || !vendor) {
      console.error("Error fetching vendor:", vendorError)
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    if (vendor.status !== "active") {
      return NextResponse.json({ error: "Vendor account inactive" }, { status: 403 })
    }

    const formData = await request.json()

    const { error: updateError } = await serviceClient
      .from("vendors")
      .update({
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        phone: formData.phone,
        address: formData.address,
        website: formData.website,
        instagram_url: formData.instagram_url,
        bio: formData.bio,
        paypal_email: formData.paypal_email,
        bank_account: formData.bank_account,
        is_company: formData.is_company,
        tax_id: formData.tax_id,
        tax_country: formData.tax_country,
        notify_on_sale: formData.notify_on_sale,
        notify_on_payout: formData.notify_on_payout,
        notify_on_message: formData.notify_on_message,
        onboarding_completed: true,
        onboarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      })
      .eq("id", vendor.id)

    if (updateError) {
      console.error("Error updating vendor profile:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    const { data: updatedVendor, error: fetchError } = await serviceClient
      .from("vendors")
      .select("*")
      .eq("id", vendor.id)
      .maybeSingle()

    if (fetchError || !updatedVendor) {
      console.error("Error fetching updated vendor:", fetchError)
      return NextResponse.json({ error: "Failed to fetch updated profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true, vendor: updatedVendor })
  } catch (error) {
    console.error("Error updating vendor profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
