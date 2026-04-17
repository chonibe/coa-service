import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

/**
 * GET /api/vendor/payouts
 *
 * Returns the vendor's real payouts. Attaches line items for every status
 * (including `requested` / `processing`) so the UI can disclose what's locked
 * in a pending request. Clients read available balance from /api/vendors/balance;
 * this endpoint never returns a synthetic "pending" row.
 *
 * Shape:
 *   {
 *     payouts: Array<{
 *       id, amount, status, date (ISO), display_date (pre-formatted),
 *       reference, invoice_number, payout_batch_id,
 *       rejection_reason, failure_reason, processed_at, canceled_at,
 *       products, items: [...]
 *     }>
 *   }
 */
export async function GET() {
  const supabase = createClient()

  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: payouts, error } = await supabase
      .from("vendor_payouts")
      .select("*")
      .eq("vendor_name", vendorName)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[payouts] fetch error:", error)
      return NextResponse.json({ error: "Failed to load payouts" }, { status: 500 })
    }

    const rows = payouts || []
    if (rows.length === 0) {
      return NextResponse.json({ payouts: [] })
    }

    const formatted = await Promise.all(
      rows.map(async (payout: any) => {
        const { data: payoutItems } = await supabase
          .from("vendor_payout_items")
          .select(`
            line_item_id,
            amount,
            payout_reference,
            marked_at,
            marked_by,
            order_line_items_v2 (
              name,
              created_at,
              product_id
            )
          `)
          .eq("payout_id", payout.id)

        const items = await Promise.all(
          (payoutItems || []).map(async (item: any) => {
            const lineItem = item.order_line_items_v2
            if (!lineItem) return null
            const { data: product } = await supabase
              .from("products")
              .select("name, product_id")
              .or(`product_id.eq.${lineItem.product_id},id.eq.${lineItem.product_id}`)
              .maybeSingle()
            return {
              item_name: product?.name || lineItem.name || `Product ${lineItem.product_id}`,
              date: lineItem.created_at,
              amount: item.amount,
              payout_reference: item.payout_reference || payout.reference,
              marked_at: item.marked_at,
              marked_by: item.marked_by,
              is_paid: payout.status === "completed" || payout.status === "paid",
            }
          })
        )

        const isoDate: string = payout.payout_date || payout.created_at
        const displayDate = isoDate
          ? new Date(isoDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : ""

        return {
          id: payout.id,
          amount: Number(payout.amount) || 0,
          status: payout.status,
          date: isoDate, // ISO for filtering/sorting
          display_date: displayDate, // pre-formatted for quick rendering
          products: payout.product_count || 0,
          reference: payout.reference,
          invoice_number: payout.invoice_number,
          payout_batch_id: payout.payout_batch_id,
          rejection_reason: payout.rejection_reason || null,
          failure_reason: payout.failure_reason || null,
          processed_at: payout.processed_at || null,
          canceled_at: payout.canceled_at || null,
          items: items.filter((i) => i !== null),
        }
      })
    )

    return NextResponse.json({ payouts: formatted })
  } catch (error) {
    console.error("[payouts] unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
