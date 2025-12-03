import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { evaluateWebhookFilter } from "@/lib/crm/webhook-filter-evaluator"
import crypto from "crypto"

/**
 * CRM Webhook Delivery Handler
 * Receives CRM events and delivers them to subscribed webhooks with filtering
 */

export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    const { type, event, payload } = body

    // Support both 'type' and 'event' for backward compatibility
    const eventType = type || event

    if (!eventType || !payload) {
      return NextResponse.json(
        { error: "type/event and payload are required" },
        { status: 400 }
      )
    }

    // Find all active webhook subscriptions for this event
    const { data: subscriptions, error: subError } = await supabase
      .from("crm_webhook_subscriptions")
      .select("*")
      .eq("active", true)
      .contains("events", [eventType])

    if (subError) {
      throw subError
    }

    if (!subscriptions || subscriptions.length === 0) {
      // No subscriptions, return success
      return NextResponse.json({ success: true, delivered: 0 })
    }

    // Deliver to each subscription (with filtering)
    const deliveryPromises = subscriptions.map(async (subscription) => {
      // Evaluate filter if present
      if (subscription.filter) {
        const passesFilter = evaluateWebhookFilter(subscription.filter, payload)
        if (!passesFilter) {
          // Filter doesn't match, skip this subscription
          return { subscriptionId: subscription.id, delivered: false, reason: "filtered" }
        }
      }

      // Sign payload with webhook secret
      const signature = crypto
        .createHmac("sha256", subscription.secret)
        .update(JSON.stringify(payload))
        .digest("hex")

      // Deliver webhook
      try {
        const response = await fetch(subscription.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Attio-Signature": signature,
            "Attio-Signature": signature, // Support both headers
            "X-Webhook-Event": eventType,
          },
          body: JSON.stringify({
            type: eventType,
            event: eventType, // Backward compatibility
            payload,
            timestamp: new Date().toISOString(),
          }),
        })

        if (response.ok) {
          return { subscriptionId: subscription.id, delivered: true }
        } else {
          return {
            subscriptionId: subscription.id,
            delivered: false,
            reason: `HTTP ${response.status}`,
          }
        }
      } catch (error: any) {
        console.error(
          `[CRM Webhook] Error delivering to ${subscription.url}:`,
          error
        )
        return {
          subscriptionId: subscription.id,
          delivered: false,
          reason: error.message,
        }
      }
    })

    const results = await Promise.all(deliveryPromises)
    const deliveredCount = results.filter((r) => r.delivered).length

    return NextResponse.json({
      success: true,
      delivered: deliveredCount,
      total: subscriptions.length,
      results,
    })
  } catch (error: any) {
    console.error("[CRM Webhook] Error processing webhook:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

