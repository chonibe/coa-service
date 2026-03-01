'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type CheckoutButtonVariant = 'google_pay' | 'paypal' | 'default'

export interface CheckoutButtonProps {
  variant: CheckoutButtonVariant
  amount?: number
  disabled?: boolean
  onClick?: () => void
  className?: string
  children?: React.ReactNode
}

/** Google Pay mark - dark button style (white G + Pay on black) */
const GooglePayMark = () => (
  <svg viewBox="0 0 96 32" className="h-6 w-auto" aria-hidden>
    <path
      d="M26.4 12.3v-1.4h-4.6v2.8h2.6a1.6 1.6 0 0 1 1.1.4 1.3 1.3 0 0 1 .05 1.8l-.05.06c-.37.35-.88.55-1.4.54l-1.34 0v-5.2zm0-3v2.2h1.36c.3 0 .6-.11.8-.32a1.1 1.1 0 0 0-.8-1.88l-1.36 0v.03zm8.4 2.6c.52-.02 1.03.15 1.42.49.36.34.55.82.52 1.32v2.67h-.78v-.61h-.04a1.54 1.54 0 0 1-1.34.74 1.74 1.74 0 0 1-1.2-.43 1.33 1.33 0 0 1-.49-1.06 1.28 1.28 0 0 1 .49-1.07 2.2 2.2 0 0 1 1.36-.41c.41-.02.82.07 1.19.26v-.17a.9.9 0 0 0-.33-.72 1.13 1.13 0 0 0-.78-.3 1.24 1.24 0 0 0-1.06.57l-.72-.45a2 2 0 0 1 1.75-.85zm.84 2.84a.63.63 0 0 0 .27.53c.18.14.4.22.63.21.34 0 .67-.14.92-.38.24-.23.38-.55.38-.88a1.64 1.64 0 0 0-1.06-.3 1.37 1.37 0 0 0-.82.24.7.7 0 0 0-.31.58zm7.3-3l-2.7 6.23h-.84l1.02-2.18-1.78-4.05h.88l1.29 3.11 1.26-3.11h.88z"
      fill="currentColor"
    />
    <path d="M11.2 9c0-.24 0-.4-.08-.56h-3.36v1.4h1.92a1.68 1.68 0 0 1-.72 1.1v.9h1.17a3.55 3.55 0 0 0 1.08-2.67z" fill="#4285F4" />
    <path d="M7.6 10.1c-.16 0-.24 0-.4-.08v-1.44H6.1c-.32 0-.64.08-.88.32-.24.24-.4.56-.4.96s.16.72.4.96c.24.16.56.24.88.24h1.04v-1.44z" fill="#34A853" />
    <path d="M5.6 8.1a2.1 2.1 0 0 0 0 1.28v-.96H4.5a2 2 0 0 0 0 1.12l1.1-.9z" fill="#FBBC04" />
    <path d="M7.6 6.7c.48 0 .88.16 1.2.48l.88-.88c-.56-.48-1.28-.8-2.16-.8-1.2 0-2.32.64-2.88 1.6.56.08 1.12.24 1.52.48l1.04-.88z" fill="#EA4335" />
  </svg>
)

/** PayPal mark - official colors */
const PayPalMark = () => (
  <svg viewBox="0 0 60 16" className="h-5 w-auto" aria-hidden>
    <path
      fill="#003087"
      d="M7.4 1C6 1 4.9 2 4.5 3.5L2 14.8h2.1l1.4-8.5c.2-1 1-1.6 2-1.6 1.2 0 2 .9 2.2 2.1l.8 8h2.1l-.9-11.3C11.5 2.2 9.7 1 7.4 1z"
    />
    <path
      fill="#3086C8"
      d="M20 5.2c-.5-.6-1.3-1-2.3-1h-3.2c-.8 0-1.5.6-1.6 1.4L11 16h2.2l1.4-8.5c.1-.4.4-.6.8-.6h.5c1.1 0 1.9.7 2.1 1.7l.8 7.4h2.2l1.2-7.4c.1-.5 0-1-.2-1.4-.2-.3-.5-.5-.9-.6.6-.2 1-.5 1.2-1 .2-.4.2-.9 0-1.3z"
    />
  </svg>
)

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
              'bg-[#ffc439] text-[#003087] hover:bg-[#f5bb2a] hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-xl active:shadow-md transition-all duration-200 ease-out',
          }
        : {
            className:
              'bg-pink-500 text-white hover:bg-pink-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out',
          }

  const content =
    children ??
    (variant === 'google_pay' ? (
      <span className="flex items-center justify-center gap-2">
        <GooglePayMark />
        <span>{amount != null && amount > 0 ? `Pay $${amount.toFixed(2)}` : 'Pay'}</span>
      </span>
    ) : variant === 'paypal' ? (
      <span className="flex items-center justify-center gap-2">
        <PayPalMark />
        <span>
          {amount != null && amount > 0
            ? `Pay $${amount.toFixed(2)} with PayPal`
            : 'Check out with PayPal'}
        </span>
      </span>
    ) : (
      <span>Place Order{amount != null && amount > 0 ? ` $${amount.toFixed(2)}` : ''}</span>
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
