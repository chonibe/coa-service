import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase.from("vendor_instagram_urls").select("*")

    if (error) {
      console.error("Error fetching vendor Instagram URLs:", error)
      return NextResponse.json({ success: false, message: "Failed to fetch vendor Instagram URLs" }, { status: 500 })
    }

    // Convert the array of objects to a single object with vendor as key and URL as value
    const vendorInstagramUrls = data.reduce((obj, item) => {
      obj[item.vendor] = item.instagram_url
      return obj
    }, {})

    return NextResponse.json({
      success: true,
      vendorInstagramUrls,
    })
  } catch (error: any) {
    console.error("Error in get vendor Instagram URLs API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vendor, instagramUrl } = body

    if (!vendor || !instagramUrl) {
      return NextResponse.json({ success: false, message: "Vendor and Instagram URL are required" }, { status: 400 })
    }

    // Check if the vendor already exists
    const { data: existingVendor, error: checkError } = await supabase
      .from("vendor_instagram_urls")
      .select("*")
      .eq("vendor", vendor)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing vendor:", checkError)
      return NextResponse.json({ success: false, message: "Failed to check existing vendor" }, { status: 500 })
    }

    if (existingVendor) {
      // Update the existing vendor
      const { error: updateError } = await supabase
        .from("vendor_instagram_urls")
        .update({ instagram_url: instagramUrl })
        .eq("vendor", vendor)

      if (updateError) {
        console.error("Error updating vendor Instagram URL:", updateError)
        return NextResponse.json({ success: false, message: "Failed to update vendor Instagram URL" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Vendor Instagram URL updated successfully" })
    } else {
      // Create a new vendor
      const { error: insertError } = await supabase.from("vendor_instagram_urls").insert({
        vendor,
        instagram_url: instagramUrl,
      })

      if (insertError) {
        console.error("Error creating vendor Instagram URL:", insertError)
        return NextResponse.json({ success: false, message: "Failed to create vendor Instagram URL" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Vendor Instagram URL created successfully" })
    }
  } catch (error: any) {
    console.error("Error in update vendor Instagram URLs API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendor = searchParams.get("vendor")

    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor is required" }, { status: 400 })
    }

    // Delete the vendor
    const { error } = await supabase.from("vendor_instagram_urls").delete().eq("vendor", vendor)

    if (error) {
      console.error("Error deleting vendor Instagram URL:", error)
      return NextResponse.json({ success: false, message: "Failed to delete vendor Instagram URL" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Vendor Instagram URL deleted successfully" })
  } catch (error: any) {
    console.error("Error in delete vendor Instagram URLs API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
