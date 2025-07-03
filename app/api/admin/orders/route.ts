import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'

export async function GET(request: NextRequest) {
  try {
    // Check for admin session cookie
    const adminSession = request.cookies.get("admin_session")
    if (!adminSession) {
      console.log("No admin session found")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(
            getSupabaseUrl(),
            getSupabaseKey('service')
          ), 
      getSupabaseKey('service')
    )

    // Fetch line items from the database
    const { data: lineItems, error } = await supabase
      .from("order_line_items_v2")
      .select(`
        id,
        order_id,
        order_name,
        name,
        description,
        price,
        quantity,
        vendor_name,
        status,
        created_at,
        img_url,
        edition_number,
        edition_total,
        nfc_tag_id,
        nfc_claimed_at
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching line items:", error)
      return NextResponse.json({ success: false, message: "Failed to fetch orders" }, { status: 500 })
    }

    if (!lineItems || !Array.isArray(lineItems)) {
      console.error("No line items returned or invalid data structure")
      return NextResponse.json({ success: false, message: "No orders found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, orders: lineItems })
  } catch (error: any) {
    console.error("Error in orders route:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
} 