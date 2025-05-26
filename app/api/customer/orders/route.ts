import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    if (!supabase) {
      return new NextResponse("Database connection error", { status: 500 })
    }

    // Get customer ID from headers
    const customerId = request.headers.get('X-Customer-ID')
    if (!customerId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Fetch orders from Supabase
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id,
        name,
        created_at,
        total_price,
        financial_status,
        line_items:order_line_items (
          line_item_id,
          title,
          quantity,
          price,
          image_url,
          nfc_tag_id,
          nfc_claimed_at,
          certificate_url,
          edition_number,
          edition_total
        )
      `)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return new NextResponse("Failed to fetch orders", { status: 500 })
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Error in orders API:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 