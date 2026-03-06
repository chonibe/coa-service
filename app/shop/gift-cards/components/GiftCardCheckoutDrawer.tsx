'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Sheet } from '@/components/ui'
import { PaymentStep } from '@/components/shop/checkout/PaymentStep'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const fakeGiftCardItem = {
  productId: 'gift-card',
  variantId: 'gift-card',
  variantGid: 'gid://giftcard/gift-card',
  handle: 'gift-card',
  title: 'Gift Card',
  price: 0,
  quantity: 1,
}

export interface GiftCardCheckoutDrawerProps {
  open: boolean
  onClose: () => void
  clientSecret: string
  amountCents: number
  lineItemLabel: string
  customerEmail?: string
  onSuccess: (redirectUrl: string) => void
  onError: (message: string) => void
}

export function GiftCardCheckoutDrawer({
  open,
  onClose,
  clientSecret,
  amountCents,
  lineItemLabel,
  customerEmail,
  onSuccess,
  onError,
}: GiftCardCheckoutDrawerProps) {
  const amount = amountCents / 100
  const [paymentError, setPaymentError] = React.useState<string | null>(null)

  const handleSuccess = (redirectUrl: string) => {
    onSuccess(redirectUrl)
  }

  const handleError = (msg: string) => {
    setPaymentError(msg)
    onError(msg)
  }

  const handleClose = () => {
    setPaymentError(null)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      side="right"
      overlayClassName="z-[80]"
      className="!p-0 !max-w-md"
      theme="light"
    >
      <div className="flex flex-col h-full bg-white dark:bg-[#150000]">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 dark:border-white/10 px-4 py-4">
          <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">
            Complete payment
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 -m-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          <div className="rounded-lg border border-neutral-200 dark:border-white/10 p-4">
            <p className="text-sm font-medium text-neutral-900 dark:text-white">{lineItemLabel}</p>
            <p className="text-lg font-bold text-neutral-950 dark:text-white mt-1">
              ${amount.toFixed(2)}
            </p>
          </div>

          <PaymentStep
            compact
            formId="gift-card-payment-form"
            items={[{ ...fakeGiftCardItem, title: lineItemLabel, price: amount }]}
            subtotal={amount}
            discount={0}
            shipping={0}
            total={amount}
            itemCount={1}
            customerEmail={customerEmail}
            shippingAddress={{
              email: customerEmail ?? '',
              fullName: '',
              country: '',
              addressLine1: '',
              city: '',
              state: '',
              postalCode: '',
              phoneNumber: '',
            }}
            onSuccess={handleSuccess}
            onError={handleError}
            preloadedClientSecret={clientSecret}
          />

          {paymentError && (
            <p className="text-sm text-red-600 dark:text-red-400">{paymentError}</p>
          )}

          <Button
            type="submit"
            form="gift-card-payment-form"
            className="w-full py-4 text-base font-semibold"
          >
            Pay ${amount.toFixed(2)}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
