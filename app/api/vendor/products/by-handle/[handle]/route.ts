import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

// GET: Get database product ID from Shopify handle
export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { handle } = params

    // Find product by handle
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, shopify_product_id")
      .eq("handle", handle)
      .eq("vendor_name", vendorName)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        shopify_product_id: product.shopify_product_id,
      },
    })
  } catch (error: any) {
    console.error("Error in product by handle API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
