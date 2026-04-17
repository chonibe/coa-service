import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { reversePayoutWithdrawal } from "@/lib/banking/payout-reversal"
import { invalidateVendorBalanceCache } from "@/lib/vendor-balance-calculator"

/**
 * POST /api/vendor/payouts/[id]/cancel
 *
 * Allows an artist to cancel their own payout while it is still in the
 * `requested` state (before admin approval). Any later state (processing,
 * completed, rejected, failed, canceled) is no-op safe.
 *
 * Flow:
 *   1. Auth → resolve vendor from cookie
 *   2. Fetch payout → verify ownership + status === 'requested'
 *   3. Flip payout.status = 'canceled' with canceled_at/canceled_by/cancel_reason
 *   4. Reverse the ledger withdrawal (idempotent)
 *   5. Invalidate balance cache
 *
 * Response body mirrors /redeem so the client can optimistically patch its
 * cached list without a refetch.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const payoutId = Number(params.id)
  if (!Number.isFinite(payoutId) || payoutId <= 0) {
    return NextResponse.json({ error: "Invalid payout id" }, { status: 400 })
  }

  let reason: string | undefined
  try {
    const body = await request.json().catch(() => ({}))
    if (typeof body?.reason === "string" && body.reason.trim().length > 0) {
      reason = body.reason.trim().slice(0, 500)
    }
  } catch {
    // Body is optional — a missing body is fine.
  }

  try {
    const { data: payout, error: fetchError } = await supabase
      .from("vendor_payouts")
      .select("id, vendor_name, amount, status, reference")
      .eq("id", payoutId)
      .maybeSingle()

    if (fetchError) {
      console.error("[payout/cancel] fetch error:", fetchError)
      return NextResponse.json({ error: "Could not load payout" }, { status: 500 })
    }

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    if (payout.vendor_name !== vendorName) {
      // Do not leak existence of other vendors' payouts.
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    if (payout.status !== "requested") {
      return NextResponse.json(
        {
          error:
            "This payout can no longer be canceled. Contact support if you need to dispute it.",
          status: payout.status,
        },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from("vendor_payouts")
      .update({
        status: "canceled",
        canceled_at: now,
        canceled_by: vendorName,
        cancel_reason: reason ?? "Canceled by artist",
        updated_at: now,
      })
      .eq("id", payoutId)
      .eq("status", "requested") // Optimistic concurrency guard

    if (updateError) {
      console.error("[payout/cancel] update error:", updateError)
      return NextResponse.json(
        { error: `Failed to cancel payout: ${updateError.message}` },
        { status: 500 }
      )
    }

    const reversal = await reversePayoutWithdrawal(
      vendorName,
      payoutId,
      Number(payout.amount) || 0,
      supabase
    )

    if (!reversal.success) {
      // The payout row is already flipped to `canceled` — we don't roll that
      // back because the artist would otherwise see their cancel silently
      // fail. Instead we log for manual reconciliation and surface a soft
      // warning. The balance will be off-by-one until an admin reconciles.
      console.error(
        "[payout/cancel] ledger reversal failed after status flip:",
        reversal.error,
        { payoutId, vendorName }
      )
    }

    invalidateVendorBalanceCache(vendorName)

    return NextResponse.json({
      success: true,
      payoutId,
      amount: Number(payout.amount) || 0,
      status: "canceled",
      reference: payout.reference,
      newBalance: reversal.newUsdBalance,
      reversalOk: reversal.success,
      message:
        "Your payout request was canceled. The amount has been returned to your available balance.",
    })
  } catch (error: any) {
    console.error("[payout/cancel] unexpected error:", error)
    return NextResponse.json(
      { error: error?.message || "Unexpected error" },
      { status: 500 }
    )
  }
}
