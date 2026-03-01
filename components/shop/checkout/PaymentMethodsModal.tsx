'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PaymentStep } from './PaymentStep'
import { PayPalButton } from './PayPalButton'

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

export interface PaymentMethodsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartLineItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  itemCount: number
  customerEmail?: string
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
  onPaymentMethodChange?: (type: string) => void
}

export function PaymentMethodsModal({
  open,
  onOpenChange,
  items,
  subtotal,
  discount,
  shipping,
  total,
  itemCount,
  customerEmail,
  shippingAddress,
  onSuccess,
  onError,
  onPaymentMethodChange,
}: PaymentMethodsModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          forceMount
          className={cn(
            'fixed inset-x-0 bottom-0 top-0 z-[101] flex flex-col bg-white',
            'max-h-[100dvh] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            'sm:data-[state=closed]:slide-out-to-bottom-4 sm:data-[state=open]:slide-in-from-bottom-4'
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              data-testid="payment-dialog-close-button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="flex-1" aria-hidden />
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              data-testid="add-credit-card-done-button"
              className="text-sm font-medium text-pink-600 hover:text-pink-700"
            >
              Done
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4" data-testid="stripe-payment-element-loaded">
            <PayPalButton
              items={items}
              total={total}
              shippingAddress={shippingAddress}
              onSuccess={onSuccess}
              onError={onError}
            />
            {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-neutral-500">Or pay with card</span>
                </div>
              </div>
            )}
            <PaymentStep
              compact
              formId="checkout-payment-form"
              items={items}
              subtotal={subtotal}
              discount={discount}
              shipping={shipping}
              total={total}
              itemCount={itemCount}
              customerEmail={customerEmail}
              shippingAddress={shippingAddress}
              onSuccess={onSuccess}
              onError={onError}
              onPaymentMethodChange={onPaymentMethodChange}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
