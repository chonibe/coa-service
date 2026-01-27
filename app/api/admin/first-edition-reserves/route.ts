import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import {
  getReservedEditions,
  reserveFirstEdition,
  type FirstEditionReserve,
} from "@/lib/first-edition-reserve"

/**
 * GET /api/admin/first-edition-reserves
 * List all first edition reserves with optional filters
 */
export async function GET(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const supabase = createClient()
    const { searchParams } = request.nextUrl
    const status = searchParams.get("status")
    const vendorName = searchParams.get("vendor_name")
    const productId = searchParams.get("product_id")

    let query = supabase
      .from("first_edition_reserves")
      .select("*")
      .order("reserved_at", { ascending: false })

    // Apply filters
    if (status && ["reserved", "fulfilled", "cancelled"].includes(status)) {
      query = query.eq("status", status)
    }

    if (vendorName) {
      query = query.eq("vendor_name", vendorName)
    }

    if (productId) {
      query = query.eq("product_id", productId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching reserves:", error)
      return NextResponse.json(
        { error: "Failed to fetch reserves", message: error.message },
        { status: 500 }
      )
    }

    // Enrich with product details
    const reserves = (data || []) as FirstEditionReserve[]
    const enrichedReserves = await Promise.all(
      reserves.map(async (reserve) => {
        const { data: product } = await supabase
          .from("products")
          .select("name, img_url, image_url")
          .or(`product_id.eq.${reserve.product_id},id.eq.${reserve.product_id}`)
          .maybeSingle()

        return {
          ...reserve,
          product_name: product?.name || "Unknown Product",
          product_image: product?.img_url || product?.image_url || null,
        }
      })
    )

    return NextResponse.json({
      success: true,
      reserves: enrichedReserves,
      count: enrichedReserves.length,
    })
  } catch (error: any) {
    console.error("Error in GET /api/admin/first-edition-reserves:", error)
    return NextResponse.json(
      { error: "Failed to fetch reserves", message: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/first-edition-reserves/create
 * Manually create a first edition reserve (for retroactive reserves)
 */
export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const supabase = createClient()
    const body = await request.json()
    const { product_id, vendor_name, price, product_data } = body

    if (!product_id || !vendor_name || !price) {
      return NextResponse.json(
        { error: "product_id, vendor_name, and price are required" },
        { status: 400 }
      )
    }

    const result = await reserveFirstEdition(
      product_id,
      vendor_name,
      parseFloat(price),
      product_data,
      supabase
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, details: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      reserve: result,
      message: result.message,
    })
  } catch (error: any) {
    console.error("Error in POST /api/admin/first-edition-reserves/create:", error)
    return NextResponse.json(
      { error: "Failed to create reserve", message: error.message },
      { status: 500 }
    )
  }
}
