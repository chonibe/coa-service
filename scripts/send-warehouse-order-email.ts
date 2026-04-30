import 'dotenv/config'

import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { sendOrderConfirmationWithTracking } from '@/lib/notifications/order-confirmation'

function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

function resolveRecipient(): string {
  const arg = process.argv.find((value) => value.startsWith('--email='))
  return arg ? arg.replace('--email=', '').trim() : 'chonibe@gmail.com'
}

async function main() {
  const recipient = resolveRecipient()
  const client = createChinaDivisionClient()

  const start = getDateDaysAgo(45)
  const end = new Date().toISOString().split('T')[0]
  const orders = await client.getOrdersInfo(start, end, false)

  if (!orders.length) {
    throw new Error('No warehouse orders found in the selected date range')
  }

  const selectedOrder =
    orders.find((order) => order.ship_email?.toLowerCase() === recipient.toLowerCase()) || orders[0]

  const lineItems = (selectedOrder.info || [])
    .filter((item) => item.product_name || item.sku || item.sku_code)
    .slice(0, 8)
    .map((item) => ({
      name: item.product_name || item.sku || item.sku_code || 'Warehouse Item',
      quantity: Number(item.quantity || '1') || 1,
      price: '0.00',
    }))

  const customerName = `${selectedOrder.first_name || ''} ${selectedOrder.last_name || ''}`.trim() || 'Collector'
  const orderName = selectedOrder.order_id || selectedOrder.sys_order_id || `WH-${Date.now()}`
  const trackingToken =
    selectedOrder.sys_order_id ||
    selectedOrder.order_id ||
    selectedOrder.tracking_number ||
    `warehouse-${Date.now()}`

  const result = await sendOrderConfirmationWithTracking({
    orderName,
    customerName,
    customerEmail: recipient,
    trackingToken,
    lineItems,
    currency: '$',
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.thestreetcollector.com',
  })

  if (!result.success) {
    throw new Error(result.error || 'Failed to send warehouse-based email')
  }

  console.log(
    `[warehouse-order] sent real order email for order ${orderName} to ${recipient} (${result.messageId || 'no-message-id'})`
  )
}

main().catch((error) => {
  console.error('[warehouse-order] failed:', error)
  process.exit(1)
})

