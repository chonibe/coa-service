import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

interface OrderLineItem {
  id: string
  quantity: number
  product: {
    name: string
  } | null
  order: {
    order_number: string
  } | null
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch unpaired items
    const { data: items, error: fetchError } = await supabase
      .from("order_line_items_v2")
      .select(`
        id,
        product:products (
          name
        ),
        order:orders (
          order_number
        ),
        quantity
      `)
      .is("nfc_tag_id", null)
      .eq("nfc_pairing_status", "pending")
      .order("created_at", { ascending: false })
      .returns<OrderLineItem[]>()

    if (fetchError) {
      console.error("Error fetching unpaired items:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch unpaired items" },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedItems = (items || []).map(item => ({
      id: item.id,
      productName: item.product?.name || "Unknown Product",
      orderNumber: item.order?.order_number || "Unknown Order",
      quantity: item.quantity
    }))

    return NextResponse.json({ items: transformedItems })
  } catch (error) {
    console.error("Error in unpaired items endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 