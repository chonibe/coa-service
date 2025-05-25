import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      )
    }

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, title, vendor_name, price")
      .order("title")

    if (error) {
      console.error("Error fetching products:", error)
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      )
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Error in all-products:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
