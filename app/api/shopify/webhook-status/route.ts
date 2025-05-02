import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Check if the webhook is configured in Shopify
    const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/webhooks.json`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch webhooks: ${response.status}`)
    }

    const data = await response.json()
    const webhooks = data.webhooks || []

    // Find the order creation webhook
    const orderWebhook = webhooks.find(
      (webhook: any) => webhook.topic === "orders/create" && webhook.address.includes("/api/webhooks/shopify/orders"),
    )

    // Get the last webhook received timestamp from the database
    const { data: webhookData, error: webhookError } = await supabase
      .from("webhook_logs")
      .select("*")
      .eq("type", "shopify_order")
      .order("created_at", { ascending: false })
      .limit(1)

    if (webhookError) {
      console.error("Error fetching webhook logs:", webhookError)
    }

    let lastReceived = null
    if (webhookData && webhookData.length > 0) {
      lastReceived = webhookData[0].created_at
    }

    return NextResponse.json({
      isActive: !!orderWebhook,
      url: orderWebhook?.address || null,
      lastReceived,
    })
  } catch (error: any) {
    console.error("Error fetching webhook status:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch webhook status" }, { status: 500 })
  }
}
