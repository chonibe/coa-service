import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, payoutPrice } = body

    if (!productId || payoutPrice === undefined) {
      return NextResponse.json({ error: "Product ID and payout price are required" }, { status: 400 })
    }

    // Update product payout information in the database
    const { data, error } = await supabase
      .from("products")
      .update({ payout_price: payoutPrice })
      .eq("product_id", productId)
      .select()

    if (error) {
      console.error("Error updating product payout information:", error)
      return NextResponse.json({ error: "Failed to update product payout information" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error in product payout update API:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
