import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    // Check if the user is authenticated
    const adminSession = request.cookies.get("admin_session")
    if (!adminSession) {
      console.log("No admin session found")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Create Supabase client with service role key
    const supabase = createClient()

    // Fetch line items from the database
    const { data: lineItems, error } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching line items:", error)
      return NextResponse.json({ success: false, message: "Failed to fetch orders" }, { status: 500 })
    }

    // Group line items by order
    const orders = lineItems.reduce((acc: any, item: any) => {
      const orderName = item.order_name
      if (!acc[orderName]) {
        acc[orderName] = {
          id: item.order_id,
          name: orderName,
          created_at: item.created_at,
          line_items: [],
        }
      }
      acc[orderName].line_items.push(item)
      return acc
    }, {})

    // Convert to array and sort by creation date
    const ordersArray = Object.values(orders).sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({ success: true, orders: ordersArray })
  } catch (error: any) {
    console.error("Error in orders API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
} 