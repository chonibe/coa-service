import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ message: "Database connection error" }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const vendorName = searchParams.get("vendorName")

    if (!vendorName) {
      return NextResponse.json({ message: "Vendor name is required" }, { status: 400 })
    }

    // Get the vendor's Instagram URL
    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("instagram_url")
      .eq("vendor_name", vendorName)
      .single()

    if (error) {
      console.error("Error fetching vendor:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    if (!vendor?.instagram_url) {
      return NextResponse.json({ message: "No Instagram URL found for vendor" }, { status: 404 })
    }

    // Extract username from Instagram URL
    const username = vendor.instagram_url.split("/").pop()?.replace("@", "")
    if (!username) {
      return NextResponse.json({ message: "Invalid Instagram URL" }, { status: 400 })
    }

    // Use the direct Instagram profile picture URL
    const profilePicture = `https://www.instagram.com/${username}/media/?size=t`

    return NextResponse.json({ profilePicture })
  } catch (error: any) {
    console.error("Error in Instagram profile API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
} 