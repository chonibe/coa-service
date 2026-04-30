import 'dotenv/config'

import { sendOrderConfirmationWithTracking } from '@/lib/notifications/order-confirmation'

async function main() {
  const recipient = 'chonibe@gmail.com'
  const orderName = `#SL-${Date.now().toString().slice(-6)}`

  const result = await sendOrderConfirmationWithTracking({
    orderName,
    customerName: 'Choni',
    customerEmail: recipient,
    trackingToken: `real-preview-${Date.now()}`,
    lineItems: [
      { name: 'Street Lamp x Midnight Echoes', quantity: 1, price: '395.00' },
    ],
    totalPrice: '395.00',
    currency: '$',
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.thestreetcollector.com',
  })

  if (!result.success) {
    throw new Error(result.error || 'Failed to send real order email')
  }

  console.log(`[real-order] sent to ${recipient} with order ${orderName} (${result.messageId || 'no-message-id'})`)
}

main().catch((error) => {
  console.error('[real-order] failed:', error)
  process.exit(1)
})

