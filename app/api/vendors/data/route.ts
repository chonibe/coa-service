import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorName = searchParams.get("vendorName")

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    // Fetch vendor data from the database
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError) {
      console.error("Error fetching vendor data:", vendorError)
      return NextResponse.json({ error: "Failed to fetch vendor data" }, { status: 500 })
    }

    // Fetch products associated with the vendor from the database
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("vendor_name", vendorName)

    if (productError) {
      console.error("Error fetching product data:", productError)
      return NextResponse.json({ error: "Failed to fetch product data" }, { status: 500 })
    }

    // Fetch sales data (replace with actual sales data retrieval logic)
    const salesData = {
      totalSales: 1000,
      ordersProcessed: 50,
    }

    // Fetch inventory data (replace with actual inventory data retrieval logic)
    const inventoryData = {
      totalProducts: 10,
      itemsSold: 500,
    }

    // Combine vendor and product data
    const combinedData = {
      vendor: vendorData,
      products: productData,
      sales: salesData,
      inventory: inventoryData,
    }

    return NextResponse.json({ success: true, data: combinedData })
  } catch (error: any) {
    console.error("Error in vendor data API:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
