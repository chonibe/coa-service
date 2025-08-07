import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { productIds, vendorNames } = body

    if (!productIds || !productIds.length) {
      return NextResponse.json({ message: "Product IDs are required" }, { status: 400 })
    }

    console.log(`Fetching payouts for ${productIds.length} products from Supabase`)

    // Fetch all payout settings from the product_vendor_payouts table
    const { data, error } = await supabase.from("product_vendor_payouts").select("*").in("product_id", productIds)

    if (error) {
      console.error("Error fetching vendor payouts:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    console.log(`Found ${data?.length || 0} payout records`)
    return NextResponse.json({ payouts: data || [] })
  } catch (error: any) {
    console.error("Error in vendor payouts API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
