import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

interface OrderLineItem {
  vendor_name: string
  price: number | string
}

interface Order {
  id: string
  created_at: string
  status: string
  order_line_items_v2: OrderLineItem[]
}

export async function GET(
  request: Request,
  { params }: { params: { vendorId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Convert vendorId to integer
    const vendorId = parseInt(params.vendorId, 10)

    // Validate vendorId
    if (isNaN(vendorId)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
    }

    console.log("Fetching vendor with ID:", vendorId)

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", vendorId)
      .single()

    if (vendorError) {
      console.error("Error fetching vendor:", vendorError)
      return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 })
    }

    console.log("Vendor data:", vendor)

    // Get vendor's products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("vendor", vendor.name)

    if (productsError) {
      console.error("Error fetching products:", productsError)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    console.log("Products data:", products)

    return NextResponse.json({
      vendor,
      products,
    })
  } catch (error) {
    console.error("Unexpected error in vendor details API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 