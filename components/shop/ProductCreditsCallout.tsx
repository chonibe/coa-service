'use client'

/**
 * Product Credits Callout
 * 
 * Shows "Earn X credits" or "Use X credits to save $Y" on product pages.
 * Visible to all users (entices guests to create accounts).
 * 
 * @module components/shop/ProductCreditsCallout
 * @see lib/banking/types.ts - CREDITS_PER_DOLLAR constant
 * @see app/shop/[handle]/page.tsx - Mounted on product pages
 */

import { Coins } from 'lucide-react'
import { cn } from '@/lib/utils'

const CREDITS_PER_DOLLAR = 10

interface ProductCreditsCalloutProps {
  /** Product price in USD (dollars, not cents) */
  price: number
  /** User's available credit balance (0 if not authenticated) */
  availableCredits?: number
  /** Additional CSS classes */
  className?: string
}

export function ProductCreditsCallout({
  price,
  availableCredits = 0,
  className,
}: ProductCreditsCalloutProps) {
  if (price <= 0) return null

  const creditsEarned = Math.round(price * CREDITS_PER_DOLLAR)
  const maxCreditsUsable = Math.min(availableCredits, creditsEarned)
  const savings = maxCreditsUsable * 0.10 // $0.10 per credit

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
      'bg-amber-50 border border-amber-200/60',
      className
    )}>
      <Coins className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <div className="flex-1">
        {availableCredits > 0 && maxCreditsUsable > 0 ? (
          <span className="text-amber-800">
            Use <strong>{maxCreditsUsable.toLocaleString()} credits</strong> to save <strong>${savings.toFixed(2)}</strong>
          </span>
        ) : (
          <span className="text-amber-800">
            Earn <strong>{creditsEarned.toLocaleString()} credits</strong> with this purchase
          </span>
        )}
      </div>
    </div>
  )
}

export default ProductCreditsCallout
