import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

interface DatabaseProduct {
  name: string
}

interface DatabaseOrder {
  order_number: string
}

interface DatabaseOrderLineItem {
  id: string
  quantity: number
  product: DatabaseProduct
  order: DatabaseOrder
}

interface TransformedLineItem {
  id: string
  productName: string
  orderNumber: string
  quantity: number
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

    // Fetch unpaired line items
    const { data, error: dbError } = await supabase
      .from("order_line_items")
      .select(`
        id,
        quantity,
        product:products (
          name
        ),
        order:orders (
          order_number
        )
      `)
      .is("nfc_tag_id", null) // Only get items without NFC tags
      .order("created_at", { ascending: false })
      .returns<DatabaseOrderLineItem[]>()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { error: "Failed to fetch unpaired items" },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json<TransformedLineItem[]>([])
    }

    // Transform the data to match our frontend interface
    const transformedItems: TransformedLineItem[] = data.map(item => ({
      id: item.id,
      productName: item.product?.name || "Unknown Product",
      orderNumber: item.order?.order_number || "Unknown Order",
      quantity: item.quantity || 1
    }))

    return NextResponse.json(transformedItems)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 