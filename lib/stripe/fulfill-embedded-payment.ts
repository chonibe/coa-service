/**
 * Shared logic for fulfilling an order after PaymentIntent confirmation.
 * Used by confirm-payment and create-order-from-payment APIs.
 */

import { shopifyFetch } from '@/lib/shopify-api'

interface ShippingAddressInput {
  fullName?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  postalCode?: string
  country?: string
  phoneNumber?: string
  email?: string
}

interface VariantItem {
  variantId: string
  quantity: number
  productHandle?: string
}

export async function createAndCompleteOrder(
  variants: VariantItem[],
  address: ShippingAddressInput,
  paymentIntentId: string,
  amountTotalCents: number,
  currency: string
): Promise<{ draftOrderId: string; orderId: string | null }> {
  const nameParts = (address.fullName || '').trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  const draftOrderData = {
    draft_order: {
      line_items: variants.map((v) => ({
        variant_id: parseInt(v.variantId, 10),
        quantity: v.quantity,
      })),
      customer: address.email ? { email: address.email } : undefined,
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        address1: address.addressLine1 || '',
        address2: address.addressLine2 || '',
        city: address.city || '',
        province: '',
        country: address.country || 'US',
        zip: address.postalCode || '',
        phone: address.phoneNumber || '',
      },
      billing_address: {
        first_name: firstName,
        last_name: lastName,
        address1: address.addressLine1 || '',
        address2: address.addressLine2 || '',
        city: address.city || '',
        province: '',
        country: address.country || 'US',
        zip: address.postalCode || '',
      },
      email: address.email || 'guest@checkout.local',
      note: `Stripe PaymentIntent: ${paymentIntentId}\nSource: Headless Storefront (Embedded)`,
      tags: 'headless,stripe-embedded',
      use_customer_default_address: false,
    },
  }

  const response = await shopifyFetch('draft_orders.json', {
    method: 'POST',
    body: JSON.stringify(draftOrderData),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Shopify draft order failed: ${errText}`)
  }

  const { draft_order } = await response.json()
  const completeResponse = await shopifyFetch(
    `draft_orders/${draft_order.id}/complete.json`,
    {
      method: 'PUT',
      body: JSON.stringify({ payment_pending: false }),
    }
  )

  if (!completeResponse.ok) {
    throw new Error('Failed to complete draft order')
  }

  const { draft_order: completedOrder } = await completeResponse.json()
  const orderId = completedOrder.order_id?.toString() || null
  return { draftOrderId: draft_order.id.toString(), orderId }
}
