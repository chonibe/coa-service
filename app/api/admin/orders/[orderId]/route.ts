import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(token)
  if (!adminSession?.email) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()
  
  try {
    const { orderId } = params

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        name,
        created_at,
        order_line_items (
          line_item_id,
          order_id,
          title,
          quantity,
          price,
          image_url,
          nfc_tag_id,
          nfc_claimed_at,
          certificate_url
        )
      `,
      )
      .eq("id", orderId)
      .single()

    if (orderError) {
      console.error("Error fetching order:", orderError)
      return NextResponse.json({ success: false, message: "Failed to fetch order" }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
    }

    const transformedOrder = {
      id: order.id,
      name: order.name,
      created_at: order.created_at,
      line_items: order.order_line_items,
    }

    return NextResponse.json({
      success: true,
      order: transformedOrder,
    })
  } catch (error: any) {
    console.error("Error in order API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
} 