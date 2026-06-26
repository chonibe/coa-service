'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { loadExperienceCart } from '@/lib/shop/experience-cart-persistence'

function CartBagIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 18 17"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M1 1.055h2.56l1.74 9.56"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5.34 11.055h9.8l1.57-7.41H4.09z"
      />
      <path
        fill="currentColor"
        d="M7.34 16.035a1.49 1.49 0 1 0 0-2.98 1.49 1.49 0 0 0 0 2.98"
      />
      <path
        fill="currentColor"
        stroke="currentColor"
        d="M14.35 14.545a.99.99 0 1 1-1.98 0 .99.99 0 0 1 1.98 0Z"
      />
    </svg>
  )
}

export type ShopCollectionCartChipProps = {
  experienceHref: string
  className?: string
}

/**
 * Experience-styled cart chip for pages outside the experience shell.
 * Reads persisted collection count from localStorage and links to the experience route.
 */
export function ShopCollectionCartChip({ experienceHref, className }: ShopCollectionCartChipProps) {
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    const sync = () => {
      const snapshot = loadExperienceCart()
      setItemCount(snapshot.cartOrder.length + snapshot.lampQuantity)
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  const collapsedPadding = 5
  const iconSize = 14
  const collapsedWidth = iconSize + collapsedPadding * 2

  return (
    <Link
      href={experienceHref}
      data-testid="photo-styler-cta-button"
      aria-label={`View your collection (${itemCount} items)`}
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-md leading-none transition-colors hover:opacity-90 text-sm font-medium bg-[#047AFF] hover:bg-[#0366d6] text-white self-center shrink-0 !min-h-0',
        className
      )}
      style={{
        width: collapsedWidth,
        paddingLeft: collapsedPadding,
        paddingRight: collapsedPadding,
        paddingTop: 5,
        paddingBottom: 5,
      }}
    >
      <CartBagIcon className="!w-[14px] !h-[14px] !min-w-0 !min-h-0 shrink-0" />
      <span className="sr-only">
        {itemCount > 0 ? `${itemCount} items in collection` : 'Open collection'}
      </span>
    </Link>
  )
}
