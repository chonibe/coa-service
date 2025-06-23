import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client not initialized" }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin.from("vendors").select("vendor_name").order("vendor_name")

    if (error) {
      console.error("Error fetching vendor names:", error)
      return NextResponse.json({ error: "Failed to fetch vendor names", details: error }, { status: 500 })
    }

    const vendorNames = data.map((vendor) => vendor.vendor_name)

    return NextResponse.json({ vendors: vendorNames })
  } catch (error: any) {
    console.error("Error in vendor names API:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
