import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/crm/customers/[id]/orders
 * Get order history for a specific customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const supabase = createClient()
  const { id } = await Promise.resolve(params)

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    // Get customer orders
    const { data: orders, error } = await supabase
      .from("crm_customer_orders")
      .select("*")
      .eq("customer_id", id)
      .order("order_date", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      orders: orders || [],
      count: orders?.length || 0,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching customer orders:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

