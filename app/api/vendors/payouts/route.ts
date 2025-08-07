import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { productIds, vendorName } = body

    if (!productIds || !productIds.length || !vendorName) {
      return NextResponse.json({ message: "Product IDs and vendor name are required" }, { status: 400 })
    }

    // Fetch payout settings for these products
    const { data, error } = await supabase
      .from("vendor_payouts")
      .select("*")
      .eq("vendor_name", vendorName)
      .in("product_id", productIds)

    if (error) {
      console.error("Error fetching vendor payouts:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ payouts: data || [] })
  } catch (error: any) {
    console.error("Error in vendor payouts API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
