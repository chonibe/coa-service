import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { isValidPayPalEmail } from "@/lib/paypal/payouts"

/**
 * POST /api/vendor/payouts/[id]/retry
 *
 * Re-queues a failed payout for another admin review. We do not automatically
 * reversed-and-re-requested because the ledger withdrawal was already made
 * on the original request. Instead we simply flip status back to `requested`,
 * clear the failure reason, and let the admin pick it up again.
 *
 * Guards:
 *   - Only the owning vendor can retry.
 *   - Only payouts in status `failed` are retryable. Rejected payouts must be
 *     re-requested via the normal /redeem flow (the reversal has already
 *     restored the balance).
 *   - The vendor must have a valid PayPal email on file before we re-queue —
 *     otherwise the retry is useless.
 */
export async function POST(
  _request: NextRequest,
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

  try {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("paypal_email")
      .eq("vendor_name", vendorName)
      .single()

    if (!vendor?.paypal_email || !isValidPayPalEmail(vendor.paypal_email)) {
      return NextResponse.json(
        {
          error:
            "Add a valid PayPal email before retrying. Profile → Settings → Payment.",
          needsPaypalEmail: true,
        },
        { status: 400 }
      )
    }

    const { data: payout, error: fetchError } = await supabase
      .from("vendor_payouts")
      .select("id, vendor_name, amount, status, reference, failure_reason")
      .eq("id", payoutId)
      .maybeSingle()

    if (fetchError || !payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }
    if (payout.vendor_name !== vendorName) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }
    if (payout.status !== "failed") {
      return NextResponse.json(
        {
          error:
            payout.status === "rejected"
              ? "Rejected payouts can't be retried. Your balance was restored — request a new payout instead."
              : `This payout isn't in a retryable state (status: ${payout.status}).`,
          status: payout.status,
        },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from("vendor_payouts")
      .update({
        status: "requested",
        failure_reason: null,
        processed_at: null,
        updated_at: now,
        notes: `Retry requested by artist on ${now}`,
      })
      .eq("id", payoutId)
      .eq("status", "failed")

    if (updateError) {
      console.error("[payout/retry] update error:", updateError)
      return NextResponse.json(
        { error: `Failed to retry payout: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      payoutId,
      status: "requested",
      amount: Number(payout.amount) || 0,
      reference: payout.reference,
      message:
        "Your payout was re-queued for admin review. You'll get a note when it's processed.",
    })
  } catch (error: any) {
    console.error("[payout/retry] unexpected error:", error)
    return NextResponse.json(
      { error: error?.message || "Unexpected error" },
      { status: 500 }
    )
  }
}
