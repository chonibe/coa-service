import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createClient()

    // Try to use the function if it exists
    try {
      const { data, error } = await supabase.rpc("get_pending_vendor_payouts")

      if (error) {
        throw error
      }

      return NextResponse.json({ payouts: data })
    } catch (funcError) {
      console.error("Error using get_pending_vendor_payouts function:", funcError)

      // Fallback to direct query if function doesn't exist
      // Updated to filter by fulfillment_status = 'fulfilled' and use default 25% payout
      const { data, error } = await supabase.query(`
        WITH paid_line_items AS (
          SELECT DISTINCT line_item_id FROM vendor_payout_items WHERE payout_id IS NOT NULL
        ),
        vendor_sales AS (
          SELECT 
            oli.vendor_name,
            oli.line_item_id,
            oli.order_id,
            oli.product_id,
            oli.price,
            COALESCE(pvp.payout_amount, 25) AS payout_percentage,
            COALESCE(pvp.is_percentage, true) AS is_percentage,
            CASE 
              WHEN COALESCE(pvp.is_percentage, true) THEN (oli.price * COALESCE(pvp.payout_amount, 25) / 100)
              ELSE COALESCE(pvp.payout_amount, 0)
            END AS payout_amount
          FROM order_line_items oli
          LEFT JOIN product_vendor_payouts pvp ON oli.product_id = pvp.product_id AND oli.vendor_name = pvp.vendor_name
          WHERE 
            oli.status = 'active'
            AND oli.vendor_name IS NOT NULL
            AND oli.fulfillment_status = 'fulfilled'
            AND oli.line_item_id NOT IN (SELECT line_item_id FROM paid_line_items)
        ),
        vendor_totals AS (
          SELECT 
            vendor_name,
            SUM(payout_amount) AS amount,
            COUNT(DISTINCT line_item_id) AS product_count
          FROM vendor_sales
          GROUP BY vendor_name
        )
        SELECT 
          vt.vendor_name,
          vt.amount,
          vt.product_count,
          v.paypal_email,
          v.tax_id,
          v.tax_country,
          v.is_company,
          MAX(vp.payout_date) AS last_payout_date
        FROM vendor_totals vt
        LEFT JOIN vendors v ON vt.vendor_name = v.vendor_name
        LEFT JOIN vendor_payouts vp ON vt.vendor_name = vp.vendor_name AND vp.status = 'completed'
        WHERE vt.amount > 0
        GROUP BY 
          vt.vendor_name, 
          vt.amount, 
          vt.product_count, 
          v.paypal_email, 
          v.tax_id, 
          v.tax_country, 
          v.is_company
        ORDER BY vt.amount DESC
      `)

      if (error) {
        console.error("Error in fallback query:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ payouts: data })
    }
  } catch (error: any) {
    console.error("Error in pending payouts API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
