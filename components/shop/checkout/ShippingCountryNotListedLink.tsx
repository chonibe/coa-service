'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { buildShippingOutreachMailtoHref } from '@/lib/shop/shipping-outreach-mailto'

export type ShippingCountryNotListedLinkProps = {
  customerEmail?: string
  orderSummary?: string
  /** Matches AddressModal experience `dark` theme */
  variant?: 'default' | 'dark'
  className?: string
  /** Optional classes for the anchor (e.g. drawer dark mode link color) */
  linkClassName?: string
}

/**
 * Opens the user’s mail client with a prefilled request to ship outside the published country list.
 */
export function ShippingCountryNotListedLink({
  customerEmail,
  orderSummary,
  variant = 'default',
  className,
  linkClassName,
}: ShippingCountryNotListedLinkProps) {
  const href = React.useMemo(
    () => buildShippingOutreachMailtoHref({ customerEmail, orderSummary }),
    [customerEmail, orderSummary]
  )

  return (
    <p
      className={cn(
        'text-xs leading-relaxed',
        variant === 'dark' ? 'text-[#b89090]' : 'text-neutral-500',
        className
      )}
    >
      <a
        href={href}
        className={cn(
          'underline underline-offset-2 font-medium',
          variant === 'dark'
            ? 'text-[#60A5FA] hover:text-[#93C5FD]'
            : 'text-[#047AFF] hover:opacity-90',
          linkClassName
        )}
      >
        Don&apos;t see your country?
      </a>{' '}
      Email us with your order details and we&apos;ll try to arrange shipping for you.
    </p>
  )
}
