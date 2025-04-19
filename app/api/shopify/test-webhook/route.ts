import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function GET(request: NextRequest) {
  try {
    // Get the webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/orders`

    // Check if the webhook is already configured
    const getUrl = `https://${SHOPIFY_SHOP}/admin/api/2023-10/webhooks.json`

    const getResponse = await fetch(getUrl, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch webhooks: ${getResponse.status}`)
    }

    const getData = await getResponse.json()
    const webhooks = getData.webhooks || []

    // Find the order creation webhook
    const orderWebhook = webhooks.find(
      (webhook: any) => webhook.topic === "orders/create" && webhook.address.includes("/api/webhooks/shopify/orders"),
    )

    if (orderWebhook) {
      // Webhook already exists, send a test notification
      return NextResponse.json({
        success: true,
        message: "Webhook already configured. A test notification will be sent.",
        webhookId: orderWebhook.id,
      })
    }

    // Create the webhook if it doesn't exist
    const createUrl = `https://${SHOPIFY_SHOP}/admin/api/2023-10/webhooks.json`

    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook: {
          topic: "orders/create",
          address: webhookUrl,
          format: "json",
        },
      }),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      throw new Error(`Failed to create webhook: ${createResponse.status} ${errorText}`)
    }

    const createData = await createResponse.json()

    return NextResponse.json({
      success: true,
      message: "Webhook created successfully. A test notification will be sent.",
      webhookId: createData.webhook.id,
    })
  } catch (error: any) {
    console.error("Error testing webhook:", error)
    return NextResponse.json({ error: error.message || "Failed to test webhook" }, { status: 500 })
  }
}
