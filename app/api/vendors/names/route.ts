import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.from("vendors").select("vendor_name").order("vendor_name")

    if (error) {
      console.error("Error fetching vendor names:", error)
      return NextResponse.json({ error: "Failed to fetch vendor names" }, { status: 500 })
    }

    const vendorNames = data.map((vendor) => vendor.vendor_name)

    return NextResponse.json({ vendors: vendorNames })
  } catch (error: any) {
    console.error("Error in vendor names API:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
