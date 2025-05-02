import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorName = searchParams.get("vendor")

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    // Get total products for this vendor
    const { data: products, error: productsError } = await supabaseAdmin
      .from("order_line_items")
      .select("product_id")
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      // Only count line items that are Unfulfilled or Fulfilled
      .in("fulfillment_status", ["Unfulfilled", "Fulfilled"])
      .is("deleted_at", null)

    if (productsError) {
      console.error("Error fetching vendor products:", productsError)
      return NextResponse.json({ error: "Failed to fetch vendor products" }, { status: 500 })
    }

    // Get unique product IDs
    const uniqueProductIds = [...new Set(products?.map((item) => item.product_id))]

    // Get total sales for this vendor
    const { data: sales, error: salesError } = await supabaseAdmin
      .from("order_line_items")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      // Only count line items that are Unfulfilled or Fulfilled
      .in("fulfillment_status", ["Unfulfilled", "Fulfilled"])
      .is("deleted_at", null)

    if (salesError) {
      console.error("Error fetching vendor sales:", salesError)
      return NextResponse.json({ error: "Failed to fetch vendor sales" }, { status: 500 })
    }

    // Get total editions for this vendor
    const { data: editions, error: editionsError } = await supabaseAdmin
      .from("order_line_items")
      .select("edition_number")
      .eq("vendor_name", vendorName)
      .eq("status", "active")
      // Only count line items that are Unfulfilled or Fulfilled
      .in("fulfillment_status", ["Unfulfilled", "Fulfilled"])
      .is("deleted_at", null)
      .not("edition_number", "is", null)

    if (editionsError) {
      console.error("Error fetching vendor editions:", editionsError)
      return NextResponse.json({ error: "Failed to fetch vendor editions" }, { status: 500 })
    }

    return NextResponse.json({
      totalProducts: uniqueProductIds.length,
      totalSales: sales?.length || 0,
      totalEditions: editions?.length || 0,
    })
  } catch (error) {
    console.error("Error in vendor stats API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
