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
      const { data, error } = await supabase.rpc("get_pending_line_items_for_vendor", {
        vendor_name_param: vendorName,
      })

      if (error) {
        throw error
      }

      return NextResponse.json({ lineItems: data })
    } catch (funcError) {
      console.error("Error using get_pending_line_items_for_vendor function:", funcError)

      // Fallback to direct query if function doesn't exist
      const { data, error } = await supabase.query(
        `
        WITH paid_line_items AS (
          SELECT line_item_id FROM vendor_payout_items
        )
        SELECT 
          li.id AS line_item_id,
          li.order_id,
          o.name AS order_name,
          li.product_id,
          p.title AS product_title,
          li.price,
          li.created_at,
          COALESCE(pvp.payout_amount, 10) AS payout_amount,
          COALESCE(pvp.is_percentage, true) AS is_percentage
        FROM line_items li
        JOIN products p ON li.product_id = p.id
        JOIN vendors v ON p.vendor_id = v.id
        JOIN orders o ON li.order_id = o.id
        LEFT JOIN product_vendor_payouts pvp ON p.id = pvp.product_id
        WHERE v.name = $1
        AND li.id NOT IN (SELECT line_item_id FROM paid_line_items)
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
