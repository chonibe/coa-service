/**
 * PayPal Payouts API integration
 * Handles batch payout creation and status checking
 */

import { createPayPalClient } from './client'

export interface PayPalPayoutItem {
  recipient_type: 'EMAIL' | 'PHONE' | 'PAYPAL_ID'
  amount: {
    value: string
    currency: string
  }
  receiver: string
  note?: string
  sender_item_id?: string
}

export interface PayPalPayoutRequest {
  sender_batch_header: {
    sender_batch_id: string
    email_subject: string
    email_message?: string
  }
  items: PayPalPayoutItem[]
}

export interface PayPalPayoutResponse {
  batch_header: {
    payout_batch_id: string
    batch_status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'CANCELED' | 'DENIED'
    sender_batch_header: {
      sender_batch_id: string
      email_subject: string
      email_message?: string
    }
  }
  links?: Array<{
    href: string
    rel: string
    method: string
  }>
}

export interface PayPalPayoutStatus {
  batch_header: {
    payout_batch_id: string
    batch_status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'CANCELED' | 'DENIED'
    amount: {
      value: string
      currency: string
    }
    fees: {
      value: string
      currency: string
    }
    payout_batch_fee?: {
      value: string
      currency: string
    }
    sender_batch_header: {
      sender_batch_id: string
      email_subject: string
    }
    time_created?: string
    time_completed?: string
  }
  items?: Array<{
    payout_item_id: string
    transaction_id?: string
    transaction_status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNCLAIMED' | 'RETURNED' | 'ONHOLD' | 'BLOCKED' | 'REFUNDED' | 'REVERSED'
    payout_item_fee?: {
      value: string
      currency: string
    }
    payout_batch_id: string
    payout_item?: {
      recipient_type: string
      amount: {
        value: string
        currency: string
      }
      receiver: string
      note?: string
      sender_item_id?: string
    }
    time_processed?: string
    errors?: {
      name: string
      message: string
      information_link?: string
    }
  }>
  links?: Array<{
    href: string
    rel: string
    method: string
  }>
}

/**
 * Create a batch payout via PayPal Payouts API
 */
export async function createPayPalPayout(
  items: Array<{
    email: string
    amount: number
    currency?: string
    note?: string
    senderItemId?: string
  }>
): Promise<PayPalPayoutResponse> {
  const client = createPayPalClient()
  
  // Generate unique batch ID
  const senderBatchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
  
  const currency = items[0]?.currency || 'USD'
  
  const payoutRequest: PayPalPayoutRequest = {
    sender_batch_header: {
      sender_batch_id: senderBatchId,
      email_subject: 'Your payout from COA Service',
      email_message: 'You have received a payout. Thank you for your partnership!',
    },
    items: items.map((item) => ({
      recipient_type: 'EMAIL',
      amount: {
        value: item.amount.toFixed(2),
        currency,
      },
      receiver: item.email,
      note: item.note || `Payout for ${item.amount.toFixed(2)} ${currency}`,
      sender_item_id: item.senderItemId,
    })),
  }

  const response = await client.request<PayPalPayoutResponse>(
    '/v1/payments/payouts',
    {
      method: 'POST',
      body: JSON.stringify(payoutRequest),
    }
  )

  return response
}

/**
 * Get the status of a payout batch
 */
export async function getPayPalPayoutStatus(payoutBatchId: string): Promise<PayPalPayoutStatus> {
  const client = createPayPalClient()
  
  const response = await client.request<PayPalPayoutStatus>(
    `/v1/payments/payouts/${payoutBatchId}`,
    {
      method: 'GET',
    }
  )

  return response
}

/**
 * Validate PayPal email format
 */
export function isValidPayPalEmail(email: string): boolean {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return false
  }
  
  // PayPal emails should be valid email addresses
  // Additional validation can be added here if needed
  return true
}

