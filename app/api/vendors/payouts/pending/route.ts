import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'
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
      const { data, error } = await supabase.query(`
        WITH paid_line_items AS (
          SELECT line_item_id FROM vendor_payout_items
        ),
        vendor_sales AS (
          SELECT 
            v.name AS vendor_name,
            li.id AS line_item_id,
            li.order_id,
            li.product_id,
            li.price,
            COALESCE(pvp.payout_amount, 10) AS payout_percentage,
            COALESCE(pvp.is_percentage, true) AS is_percentage,
            CASE 
              WHEN COALESCE(pvp.is_percentage, true) THEN (li.price * COALESCE(pvp.payout_amount, 10) / 100)
              ELSE COALESCE(pvp.payout_amount, 0)
            END AS payout_amount
          FROM line_items li
          JOIN products p ON li.product_id = p.id
          JOIN vendors v ON p.vendor_id = v.id
          LEFT JOIN product_vendor_payouts pvp ON p.id = pvp.product_id
          WHERE li.id NOT IN (SELECT line_item_id FROM paid_line_items)
        ),
        vendor_totals AS (
          SELECT 
            vendor_name,
            SUM(payout_amount) AS amount,
            COUNT(*) AS product_count
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
        JOIN vendors v ON vt.vendor_name = v.name
        LEFT JOIN vendor_payouts vp ON vt.vendor_name = vp.vendor_name
        GROUP BY 
          vt.vendor_name, 
          vt.amount, 
          vt.product_count, 
          v.paypal_email, 
          v.tax_id, 
          v.tax_country, 
          v.is_company
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
