import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { sendInvoiceEmail } from "@/lib/invoices/email-service"
import { notifyPayoutProcessed, notifyPayoutFailed } from "@/lib/notifications/payout-notifications"

/**
 * POST /api/admin/payouts/email-logs/[id]/resend
 * Resend a failed email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await guardAdminRequest()

    const supabase = createClient()
    const { data: log, error: logError } = await supabase
      .from("email_log")
      .select("*")
      .eq("id", parseInt(params.id))
      .single()

    if (logError || !log) {
      return NextResponse.json({ error: "Email log not found" }, { status: 404 })
    }

    // Resend based on email type
    if (log.email_type === "invoice" && log.metadata?.payout_id) {
      const result = await sendInvoiceEmail(log.metadata.payout_id, log.metadata.vendor_name)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    } else if (log.email_type === "payout_processed" && log.metadata) {
      await notifyPayoutProcessed(log.metadata.vendor_name, log.metadata)
    } else if (log.email_type === "payout_failed" && log.metadata) {
      await notifyPayoutFailed(log.metadata.vendor_name, log.metadata)
    } else {
      return NextResponse.json({ error: "Cannot resend this email type" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to resend email" },
      { status: 500 }
    )
  }
}

