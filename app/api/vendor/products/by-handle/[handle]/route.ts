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

    // Find product by handle (try exact match first)
    let { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, product_id, handle")
      .eq("handle", handle)
      .eq("vendor_name", vendorName)
      .single()

    // If not found by exact handle, try case-insensitive search
    if (productError || !product) {
      console.log(`[Products API] Exact handle not found, trying case-insensitive search: ${handle}`)
      const { data: products } = await supabase
        .from("products")
        .select("id, name, product_id, handle")
        .eq("vendor_name", vendorName)
        .ilike("handle", handle)
      
      if (products && products.length > 0) {
        product = products[0]
        productError = null
      }
    }

    // If still not found, try searching by name similarity
    if (productError || !product) {
      console.log(`[Products API] Handle not found, searching by name similarity: ${handle}`)
      
      // Convert handle to search-friendly format (replace hyphens with spaces, capitalize)
      const searchName = handle
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      const { data: products } = await supabase
        .from("products")
        .select("id, name, product_id, handle")
        .eq("vendor_name", vendorName)
        .ilike("name", `%${searchName}%`)
      
      if (products && products.length > 0) {
        product = products[0]
        productError = null
        console.log(`[Products API] Found product by name similarity: ${product.name}`)
      }
    }

    if (productError || !product) {
      console.error(`[Products API] Product not found by handle: ${handle} for vendor: ${vendorName}`, productError)
      
      // Get list of available products for this vendor (first 10) to help with debugging
      const { data: availableProducts } = await supabase
        .from("products")
        .select("handle, name")
        .eq("vendor_name", vendorName)
        .limit(10)
      
      return NextResponse.json({ 
        error: "Product not found",
        message: `No product found with handle "${handle}". This product may need to be synced from Shopify or the handle may be incorrect.`,
        suggestion: "Try syncing products from Shopify or check the product handle.",
        handle,
        vendorName,
        availableProducts: availableProducts?.map(p => ({ handle: p.handle, name: p.name })) || []
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        shopify_product_id: product.product_id, // Note: column is named product_id but contains Shopify product ID
        handle: product.handle,
      },
      matchedBy: product.handle === handle ? "exact_handle" : "name_similarity",
    })
  } catch (error: any) {
    console.error("Error in product by handle API:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
    )
  }
}
