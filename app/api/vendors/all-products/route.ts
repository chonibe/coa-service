import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Fetch all products from Supabase
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, title, image_url, price, currency, vendor_name")
      .order("title")

    if (error) {
      console.error("Error fetching products:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedProducts = products.map((product) => ({
      id: product.id,
      title: product.title || "Untitled Product",
      image: product.image_url,
      price: product.price?.toString() || "0",
      currency: product.currency || "USD",
      vendor: product.vendor_name || "Unknown Vendor",
    }))

    return NextResponse.json({ products: transformedProducts })
  } catch (error: any) {
    console.error("Error in all products API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
