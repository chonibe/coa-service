import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Fetch product payout information from the database
    const { data, error } = await supabase.from("products").select("payout_price").eq("product_id", productId).single()

    if (error) {
      console.error("Error fetching product payout information:", error)
      return NextResponse.json({ error: "Failed to fetch product payout information" }, { status: 500 })
    }

    return NextResponse.json({ success: true, payoutPrice: data?.payout_price || 0 })
  } catch (error: any) {
    console.error("Error in product payout API:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
