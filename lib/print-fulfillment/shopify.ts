import { SHOPIFY_ACCESS_TOKEN, SHOPIFY_SHOP } from "@/lib/env"
import type { PrintFulfillmentOrder } from "./types"

export function normalizeShopifyOrderForPrintFulfillment(order: any): PrintFulfillmentOrder {
  const lineItemsBySku = new Map<string, PrintFulfillmentOrder["lineItems"][number]>()

  for (const item of order.line_items || []) {
    const sku = String(item.sku || "").trim()
    if (!sku) continue

    const existing = lineItemsBySku.get(sku)
    if (existing) {
      existing.quantity += Number(item.quantity || 0)
      continue
    }

    lineItemsBySku.set(sku, {
      sku,
      title: item.title || item.name || sku,
      variantTitle: item.variant_title || null,
      quantity: Number(item.quantity || 0),
    })
  }

  return {
    id: String(order.id),
    name: order.name || `#${order.order_number || order.id}`,
    orderNumber: order.order_number || null,
    createdAt: order.created_at || order.processed_at || null,
    lineItems: Array.from(lineItemsBySku.values()).filter((item) => item.quantity > 0),
  }
}

export async function fetchShopifyOrderForPrintFulfillment(orderId: string): Promise<PrintFulfillmentOrder> {
  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error("Shopify credentials are not configured")
  }

  const response = await fetch(
    `https://${SHOPIFY_SHOP}/admin/api/2024-01/orders/${encodeURIComponent(orderId)}.json?status=any`,
    {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Shopify order fetch failed: ${response.status} ${body}`)
  }

  const json = await response.json()
  if (!json.order) throw new Error(`Shopify order ${orderId} was not found`)

  return normalizeShopifyOrderForPrintFulfillment(json.order)
}
