import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { vendorName } = await request.json()

    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Try to use the function if it exists
    try {
      const { data, error } = await supabase.rpc("get_vendor_pending_line_items", {
        p_vendor_name: vendorName,
      })

      if (error) {
        throw error
      }

      return NextResponse.json({ lineItems: data })
    } catch (funcError) {
      console.error("Error using get_vendor_pending_line_items function:", funcError)

      // Fallback to direct query if function doesn't exist
      // Updated to filter by fulfillment_status = 'fulfilled' and use default 25% payout
      const { data, error } = await supabase.query(
        `
        WITH paid_line_items AS (
          SELECT DISTINCT line_item_id FROM vendor_payout_items WHERE payout_id IS NOT NULL
        )
        SELECT 
          oli.line_item_id,
          oli.order_id,
          oli.order_name,
          oli.product_id,
          p.title AS product_title,
          COALESCE(oli.price, 0) AS price,
          oli.created_at,
          COALESCE(pvp.payout_amount, 25) AS payout_amount,
          COALESCE(pvp.is_percentage, true) AS is_percentage,
          oli.fulfillment_status
        FROM order_line_items_v2 oli
        LEFT JOIN products p ON oli.product_id = p.id
        LEFT JOIN product_vendor_payouts pvp ON oli.product_id = pvp.product_id AND oli.vendor_name = pvp.vendor_name
        WHERE 
          oli.status = 'active'
          AND oli.vendor_name = $1
          AND oli.fulfillment_status = 'fulfilled'
          AND oli.line_item_id NOT IN (SELECT line_item_id FROM paid_line_items)
        ORDER BY oli.order_id, oli.created_at DESC
      `,
        [vendorName],
      )

      if (error) {
        console.error("Error in fallback query:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ lineItems: data })
    }
  } catch (error: any) {
    console.error("Error in pending line items API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
