import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get("product_id")

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Get product details including vendor
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        vendors (
          id,
          vendor_name
        ),
        collaborators (
          id,
          name,
          role
        )
      `)
      .eq("id", productId)
      .single()

    if (productError) {
      throw productError
    }

    // Format credits
    const credits = [
      {
        name: product.vendors.vendor_name,
        role: "Main Artist"
      },
      ...(product.collaborators || []).map((collaborator: any) => ({
        name: collaborator.name,
        role: collaborator.role
      }))
    ]

    return NextResponse.json({ credits })
  } catch (error: any) {
    console.error("Error in credits API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}