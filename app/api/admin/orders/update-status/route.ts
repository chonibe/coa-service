import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(adminSessionToken)
    if (!adminSession?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()
    const body = await request.json()
    const { orderIds, cancelled, archived, financial_status, shopify_order_status } = body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "orderIds array is required" },
        { status: 400 }
      )
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (cancelled !== undefined) {
      if (cancelled) {
        updates.cancelled_at = new Date().toISOString()
        // If marking as cancelled, also set financial_status to voided
        updates.financial_status = "voided"
      } else {
        updates.cancelled_at = null
      }
    }

    if (archived !== undefined) {
      updates.archived = archived
    }

    if (financial_status !== undefined) {
      updates.financial_status = financial_status
    }

    if (shopify_order_status !== undefined) {
      updates.shopify_order_status = shopify_order_status
    }

    // Update orders
    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .in("id", orderIds)
      .select("id, order_number")

    if (error) {
      console.error("Error updating orders:", error)
      return NextResponse.json(
        { success: false, message: "Failed to update orders", error: error.message },
        { status: 500 }
      )
    }

    // If orders were marked as cancelled, also update line items to inactive
    if (cancelled === true) {
      const { error: lineItemsError } = await supabase
        .from("order_line_items_v2")
        .update({ 
          status: "inactive",
          updated_at: new Date().toISOString()
        })
        .in("order_id", orderIds)
        .eq("status", "active")

      if (lineItemsError) {
        console.error("Error updating line items:", lineItemsError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${data?.length || 0} order(s)`,
      updated: data?.length || 0,
      orderIds: data?.map((o) => o.id) || [],
    })
  } catch (error: any) {
    console.error("Error in update-status route:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

