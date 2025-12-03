import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logEmail } from "@/lib/crm/log-email"

/**
 * Resend Webhook Handler
 * Receives inbound emails from Resend
 * Configure this URL in Resend Dashboard: https://your-domain.com/api/webhooks/resend
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    console.log("[Resend Webhook] Received event:", JSON.stringify(body, null, 2))

    // Resend webhook structure for inbound emails
    // https://resend.com/docs/dashboard/webhooks
    const eventType = body.type // 'email.received', 'email.delivered', etc.
    const data = body.data

    // Only process inbound email events
    if (eventType !== "email.received") {
      console.log(`[Resend Webhook] Ignoring event type: ${eventType}`)
      return NextResponse.json({ success: true })
    }

    // Extract email data
    const fromEmail = data.from?.email || data.from
    const toEmail = data.to?.[0] || data.to
    const subject = data.subject || ""
    const textContent = data.text || ""
    const htmlContent = data.html || ""
    const messageId = data.message_id || data.id

    if (!fromEmail || !toEmail) {
      console.log("[Resend Webhook] Missing from or to email")
      return NextResponse.json({ success: true })
    }

    console.log(`[Resend Webhook] Processing inbound email from ${fromEmail} to ${toEmail}`)

    // Log email to CRM
    await logEmail({
      customerEmail: fromEmail,
      subject: subject,
      content: textContent || htmlContent || "",
      direction: "inbound",
      externalId: messageId,
      metadata: {
        to: toEmail,
        html: htmlContent,
        raw: data,
      },
    })

    console.log(`[Resend Webhook] Successfully processed inbound email from ${fromEmail}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Resend Webhook] Error processing webhook:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

