'use client'

import * as React from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ''

interface CartLineItem {
  productId: string
  variantId: string
  variantGid: string
  handle: string
  title: string
  price: number
  quantity: number
  image?: string
}

export interface PayPalButtonProps {
  items: CartLineItem[]
  total: number
  shippingAddress: {
    email?: string
    fullName?: string
    country?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    postalCode?: string
    phoneNumber?: string
  }
  onSuccess: (redirectUrl: string) => void
  onError: (message: string) => void
  disabled?: boolean
}

const BASE_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export function PayPalButton({
  items,
  total,
  shippingAddress,
  onSuccess,
  onError,
  disabled,
}: PayPalButtonProps) {
  if (!paypalClientId) return null

  const hasAddress = Boolean(shippingAddress?.email)

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        intent: 'capture',
        currency: 'USD',
      }}
    >
      <PayPalButtons
        style={{
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
          height: 44,
        }}
        disabled={disabled || items.length === 0 || total <= 0 || !hasAddress}
        createOrder={async () => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(
              'sc_paypal_pending',
              JSON.stringify({ items, shippingAddress })
            )
          }
          const res = await fetch('/api/checkout/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items,
              returnUrl: `${BASE_URL}/shop/checkout/paypal-return`,
              cancelUrl: `${BASE_URL}/shop/experience`,
              shippingAddress,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Could not create PayPal order')
          return data.orderId
        }}
        onApprove={async (data) => {
          if (!data.orderID) {
            onError('No order ID from PayPal')
            return
          }
          if (!hasAddress) {
            onError('Shipping address is required')
            return
          }
          try {
            const res = await fetch('/api/checkout/paypal/capture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderID,
                shippingAddress,
                items: items.map((i) => ({
                  variantId: i.variantId.replace('gid://shopify/ProductVariant/', ''),
                  quantity: i.quantity,
                  productHandle: i.handle,
                })),
              }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Capture failed')
            if (result.redirectUrl) onSuccess(result.redirectUrl)
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Payment failed')
          }
        }}
        onError={(err) => {
          onError(err?.message || 'PayPal error')
        }}
      />
    </PayPalScriptProvider>
  )
}
