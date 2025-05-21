import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, message: "Database connection error" }, { status: 500 })
    }

    // Get all orders with basic details
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        name,
        created_at,
        customer_id,
        customers (
          name,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
      return NextResponse.json({ success: false, message: "Failed to fetch orders" }, { status: 500 })
    }

    // Transform the data to include customer information
    const transformedOrders = orders.map(order => ({
      id: order.id,
      name: order.name,
      created_at: order.created_at,
      customer: order.customers ? {
        name: order.customers.name,
        email: order.customers.email
      } : null
    }))

    return NextResponse.json({
      success: true,
      orders: transformedOrders
    })
  } catch (error: any) {
    console.error("Error in orders API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
} 