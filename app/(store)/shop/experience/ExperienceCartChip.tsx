'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useExperienceOrder } from './ExperienceOrderContext'
import { cn } from '@/lib/utils'

/** Shopping bag / cart icon matching Mixtiles photo-styler-cta style */
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

export function ExperienceCartChip({
  className,
  variant = 'light',
}: {
  className?: string
  variant?: 'light' | 'dark'
}) {
  const { total, itemCount, openOrderBar, orderBarProps, promoDiscount } = useExperienceOrder()
  const prevLampQuantity = useRef(0)
  const [hasExpanded, setHasExpanded] = useState(false)
  const lampQuantity = orderBarProps?.lampQuantity ?? 0

  const displayTotal = Math.max(0, total - (promoDiscount ?? 0))
  const formattedPrice = displayTotal > 0 ? `$${displayTotal.toFixed(2)}` : ''
  const showPrice = hasExpanded && total > 0

  useEffect(() => {
    if (lampQuantity > prevLampQuantity.current && lampQuantity >= 1) {
      setHasExpanded(true)
    }
    prevLampQuantity.current = lampQuantity
  }, [lampQuantity])

  // Stay expanded once we have items (e.g. from quiz state with empty cart)
  useEffect(() => {
    if (itemCount > 0) setHasExpanded(true)
  }, [itemCount])

  const iconSize = 14
  const collapsedPadding = 5
  const collapsedWidth = iconSize + collapsedPadding * 2

  return (
    <motion.button
      type="button"
      onClick={openOrderBar}
      data-testid="photo-styler-cta-button"
      aria-label={formattedPrice ? `View cart – ${formattedPrice} (${itemCount} items)` : `View cart (${itemCount} items)`}
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-md leading-none transition-colors hover:opacity-90 cursor-pointer text-sm font-medium bg-[#047AFF] hover:bg-[#0366d6] text-white self-center shrink-0 !min-h-0 -mx-1',
        className
      )}
      initial={false}
      animate={{
        width: showPrice ? 'auto' : collapsedWidth,
        paddingLeft: showPrice ? 10 : collapsedPadding,
        paddingRight: showPrice ? 10 : collapsedPadding,
        paddingTop: 5,
        paddingBottom: 5,
      }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <span className="inline-flex items-center justify-center min-w-0">
        <AnimatePresence mode="sync">
          {showPrice && (
            <motion.span
              key="price"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="font-bold tabular-nums whitespace-nowrap shrink-0 mr-1.5"
            >
              {formattedPrice}
            </motion.span>
          )}
        </AnimatePresence>
        <CartBagIcon className="!w-[14px] !h-[14px] !min-w-0 !min-h-0 shrink-0" />
      </span>
    </motion.button>
  )
}
