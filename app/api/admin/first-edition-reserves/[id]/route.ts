import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { getReserveById, cancelReserve } from "@/lib/first-edition-reserve"

/**
 * GET /api/admin/first-edition-reserves/[id]
 * Get details of a specific first edition reserve
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const supabase = createClient()
    const reserve = await getReserveById(params.id, supabase)

    if (!reserve) {
      return NextResponse.json(
        { error: "Reserve not found" },
        { status: 404 }
      )
    }

    // Enrich with product and order details
    const { data: product } = await supabase
      .from("products")
      .select("name, img_url, image_url, description")
      .or(`product_id.eq.${reserve.product_id},id.eq.${reserve.product_id}`)
      .maybeSingle()

    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", reserve.order_id)
      .maybeSingle()

    const { data: lineItem } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("id", reserve.line_item_id)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      reserve: {
        ...reserve,
        product: product
          ? {
              name: product.name,
              image: product.img_url || product.image_url,
              description: product.description,
            }
          : null,
        order: order || null,
        line_item: lineItem || null,
      },
    })
  } catch (error: any) {
    console.error("Error in GET /api/admin/first-edition-reserves/[id]:", error)
    return NextResponse.json(
      { error: "Failed to fetch reserve", message: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/first-edition-reserves/[id]/cancel
 * Cancel a first edition reserve
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const supabase = createClient()
    const result = await cancelReserve(params.id, supabase)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error: any) {
    console.error("Error in POST /api/admin/first-edition-reserves/[id]/cancel:", error)
    return NextResponse.json(
      { error: "Failed to cancel reserve", message: error.message },
      { status: 500 }
    )
  }
}
