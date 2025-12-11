import { SHOPIFY_ACCESS_TOKEN, SHOPIFY_SHOP } from '@/lib/env'
import { safeJsonParse } from '@/lib/shopify-api'

const API_VERSION = '2024-01'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function shopifyFetch2024(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  const fullUrl = url.startsWith('https')
    ? url
    : `https://${SHOPIFY_SHOP}/admin/api/${API_VERSION}/${url}`

  const headers = {
    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    })

    if (response.status === 429 && retries > 0) {
      const retryAfter = Number.parseInt(response.headers.get('Retry-After') || '1', 10)
      await delay(retryAfter * 1000)
      return shopifyFetch2024(url, options, retries - 1)
    }

    return response
  } catch (error) {
    if (retries > 0) {
      await delay(1000)
      return shopifyFetch2024(url, options, retries - 1)
    }
    throw error
  }
}

interface FulfillmentOrder {
  id: number
  status: string
  line_items: Array<{
    id: number
    remaining_quantity: number
    quantity: number
  }>
}

export async function getFulfillmentOrders(orderId: string): Promise<FulfillmentOrder[]> {
  const response = await shopifyFetch2024(`orders/${orderId}/fulfillment_orders.json`, {
    method: 'GET',
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch fulfillment orders: ${response.status} ${text}`)
  }
  const data = await safeJsonParse(response)
  return data.fulfillment_orders || []
}

export async function createFulfillmentWithTracking(params: {
  orderId: string
  trackingNumber: string
  trackingUrl?: string
  trackingCompany?: string
}): Promise<any> {
  const fulfillmentOrders = await getFulfillmentOrders(params.orderId)
  const openFulfillmentOrder = fulfillmentOrders.find((fo) =>
    ['open', 'in_progress'].includes((fo.status || '').toLowerCase()),
  )

  if (!openFulfillmentOrder) {
    return { skipped: true, reason: 'No open fulfillment orders available' }
  }

  const lineItems =
    openFulfillmentOrder.line_items?.map((li) => ({
      fulfillment_order_line_item_id: li.id,
      quantity: li.remaining_quantity || li.quantity || 0,
    })) || []

  const response = await shopifyFetch2024(
    `fulfillment_orders/${openFulfillmentOrder.id}/fulfillments.json`,
    {
      method: 'POST',
      body: JSON.stringify({
        fulfillment: {
          notify_customer: false,
          tracking_info: {
            number: params.trackingNumber,
            url: params.trackingUrl || null,
            company: params.trackingCompany || 'ChinaDivision',
          },
          line_items_by_fulfillment_order: [
            {
              fulfillment_order_id: openFulfillmentOrder.id,
              fulfillment_order_line_items: lineItems,
            },
          ],
        },
      }),
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to create fulfillment: ${response.status} ${text}`)
  }

  return safeJsonParse(response)
}

