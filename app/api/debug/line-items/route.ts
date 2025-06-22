import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Check if table exists and get sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from("order_line_items")
      .select("*")
      .limit(10)

    // Get unique order_id values to see the pattern
    const { data: orderIds, error: orderIdError } = await supabase
      .from("order_line_items")
      .select("order_id, shopify_order_id")
      .limit(20)

    // Check what orders exist in the orders table
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("id, shopify_id, order_number")
      .limit(10)

    return NextResponse.json({
      success: true,
      lineItemsTable: {
        count: sampleData?.length || 0,
        error: sampleError?.message,
        sample: sampleData?.[0],
        allSamples: sampleData
      },
      orderRelationships: {
        count: orderIds?.length || 0,
        error: orderIdError?.message,
        samples: orderIds?.slice(0, 5)
      },
      ordersTable: {
        count: ordersData?.length || 0,
        error: ordersError?.message,
        samples: ordersData?.slice(0, 5)
      }
    })
  } catch (error: any) {
    console.error("Debug line items error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
} 