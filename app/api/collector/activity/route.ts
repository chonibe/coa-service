import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyCollectorSessionToken } from "@/lib/collector-session"

// ============================================================================
// Collector Activity Feed API
//
// Aggregates events from existing tables into a time-sorted activity feed:
// - Purchases (from orders)
// - NFC Scans (from order_line_items_v2.nfc_claimed_at)
// - Certificates Ready (from order_line_items_v2.certificate_url)
// - Credits earned (from collector_ledger_entries)
// ============================================================================

interface ActivityEvent {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  imageUrl?: string
  action?: {
    label: string
    href: string
  }
  seen?: boolean
}

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const collectorSession = verifyCollectorSessionToken(
    request.cookies.get("collector_session")?.value
  )
  const customerId =
    collectorSession?.shopifyCustomerId ||
    request.cookies.get("shopify_customer_id")?.value
  const email = collectorSession?.email

  if (!customerId && !email) {
    return NextResponse.json(
      { success: false, message: "Missing customer session", events: [] },
      { status: 401 }
    )
  }

  try {
    const events: ActivityEvent[] = []

    // 1. Recent orders → purchase events
    const orderQuery = supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        processed_at,
        total_price,
        order_line_items_v2 (
          id,
          name,
          img_url,
          price,
          nfc_claimed_at,
          certificate_url,
          certificate_token,
          vendor_name
        )
      `
      )
      .order("processed_at", { ascending: false })
      .limit(20)

    if (customerId) {
      orderQuery.eq("customer_id", customerId)
    } else if (email) {
      orderQuery.eq("customer_email", email)
    }

    const { data: orders } = await orderQuery

    if (orders) {
      for (const order of orders) {
        const totalPrice = order.total_price || 0
        const creditsEarned = Math.round(totalPrice * 10)
        const itemCount = (order.order_line_items_v2 as any[])?.length || 0
        const firstItem = (order.order_line_items_v2 as any[])?.[0]

        // Purchase event
        events.push({
          id: `purchase-${order.id}`,
          type: "purchase",
          title: `You purchased ${itemCount} artwork${itemCount !== 1 ? "s" : ""}`,
          description: `Order #${order.order_number} — earned ${creditsEarned} credits`,
          timestamp: order.processed_at,
          imageUrl: firstItem?.img_url || undefined,
          action: {
            label: "View collection",
            href: "/collector/collection",
          },
        })

        // Credits earned event (separate for visibility)
        if (creditsEarned > 0) {
          events.push({
            id: `credits-${order.id}`,
            type: "credits_earned",
            title: `Earned ${creditsEarned} credits`,
            description: `From your $${totalPrice.toFixed(2)} purchase`,
            timestamp: order.processed_at,
          })
        }

        // NFC scan events (from line items)
        if (order.order_line_items_v2) {
          for (const item of order.order_line_items_v2 as any[]) {
            if (item.nfc_claimed_at) {
              events.push({
                id: `nfc-${item.id}`,
                type: "nfc_scan",
                title: `Authenticated "${item.name}"`,
                description: `NFC verified — earned 500 credits`,
                timestamp: item.nfc_claimed_at,
                imageUrl: item.img_url || undefined,
              })
            }

            // Certificate ready events
            if (item.certificate_url) {
              events.push({
                id: `cert-${item.id}`,
                type: "certificate_ready",
                title: `Certificate ready for "${item.name}"`,
                description: `Your certificate of authenticity is available`,
                timestamp: order.processed_at,
                imageUrl: item.img_url || undefined,
                action: {
                  label: "View certificate",
                  href: item.certificate_url,
                },
              })
            }
          }
        }
      }
    }

    // 2. Sort all events by timestamp (newest first)
    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // 3. Limit to 50 events
    const limitedEvents = events.slice(0, 50)

    return NextResponse.json({
      success: true,
      events: limitedEvents,
      total: limitedEvents.length,
    })
  } catch (error: any) {
    console.error("[Activity API] Error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch activity", events: [] },
      { status: 500 }
    )
  }
}
