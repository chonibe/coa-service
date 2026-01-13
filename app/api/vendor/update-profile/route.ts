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

    // Prepare update data - conditionally include optional fields
    const updateData: Record<string, any> = {
      contact_name: formData.contact_name,
      contact_email: formData.contact_email,
      phone: formData.phone,
      address: formData.address,
      delivery_address1: formData.delivery_address1,
      delivery_address2: formData.delivery_address2,
      delivery_city: formData.delivery_city,
      delivery_province: formData.delivery_province,
      delivery_country: formData.delivery_country,
      delivery_zip: formData.delivery_zip,
      delivery_phone: formData.delivery_phone,
      delivery_name: formData.delivery_name,
      website: formData.website,
      instagram_url: formData.instagram_url,
      bio: formData.bio,
      paypal_email: formData.paypal_email,
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
    }

    // Conditionally include profile_image and artist_history
    // These fields may not exist if migration hasn't been run
    if (formData.profile_image !== undefined) {
      updateData.profile_image = formData.profile_image
    }
    if (formData.artist_history !== undefined) {
      updateData.artist_history = formData.artist_history
    }

    console.log("Updating vendor profile:", { vendorId: vendor.id, updateData })

    let updateError: any = null
    const updateResult = await serviceClient
      .from("vendors")
      .update(updateData)
      .eq("id", vendor.id)
    
    updateError = updateResult.error

    // If update failed due to missing columns (PGRST204), retry without those columns
    if (updateError && updateError.code === "PGRST204") {
      console.warn("Column not found error detected. Retrying without optional fields:", updateError.message)
      
      // Check which column is missing from the error message
      const missingColumns: string[] = []
      if (updateError.message?.includes("profile_image")) {
        missingColumns.push("profile_image")
      }
      if (updateError.message?.includes("artist_history")) {
        missingColumns.push("artist_history")
      }
      
      // Remove fields that don't exist in the database
      const safeUpdateData = { ...updateData }
      if (missingColumns.includes("profile_image")) {
        delete safeUpdateData.profile_image
      }
      if (missingColumns.includes("artist_history")) {
        delete safeUpdateData.artist_history
      }

      // Retry with only safe fields
      const retryResult = await serviceClient
        .from("vendors")
        .update(safeUpdateData)
        .eq("id", vendor.id)
      
      updateError = retryResult.error
    }

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
