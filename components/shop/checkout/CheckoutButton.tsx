'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { GooglePayMark, PAYPAL_LOGO_URL } from './PaymentButtonAssets'

export type CheckoutButtonVariant = 'google_pay' | 'paypal' | 'default'

export interface CheckoutButtonProps {
  variant: CheckoutButtonVariant
  amount?: number
  disabled?: boolean
  onClick?: () => void
  className?: string
  children?: React.ReactNode
}

export function CheckoutButton({
  variant,
  amount,
  disabled,
  onClick,
  className,
  children,
}: CheckoutButtonProps) {
  const config =
    variant === 'google_pay'
      ? {
          className:
            'bg-black text-white hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-xl active:shadow-md transition-all duration-200 ease-out',
        }
      : variant === 'paypal'
        ? {
            className:
              'bg-neutral-200 hover:bg-neutral-300 active:scale-[0.98] transition-all duration-200 ease-out border border-neutral-300',
          }
        : {
            className:
              'bg-pink-500 text-white hover:bg-pink-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out',
          }

  const content =
    children ??
    (variant === 'google_pay' ? (
      <GooglePayMark />
    ) : variant === 'paypal' ? (
      <span className="flex items-center justify-center w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PAYPAL_LOGO_URL}
          alt="Pay with PayPal"
          className="h-6 w-auto object-contain"
        />
      </span>
    ) : (
      <span>Place Order</span>
    ))

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid="place-order-button"
      className={cn(
        'w-full py-3.5 rounded-lg text-base font-semibold flex items-center justify-center gap-2 mt-4',
        'transition-all duration-200',
        disabled
          ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
          : config.className,
        className
      )}
    >
      {content}
    </button>
  )
}
