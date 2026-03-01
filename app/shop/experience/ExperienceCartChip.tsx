'use client'

import { useExperienceOrder } from './ExperienceOrderContext'
import { cn } from '@/lib/utils'

/** Shopping bag / cart icon matching Mixtiles photo-styler-cta style */
function CartBagIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 18 17"
      className={cn('w-4 h-4 shrink-0', className)}
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
  const { total, itemCount, openOrderBar } = useExperienceOrder()

  const formattedPrice = total > 0 ? `$${total.toFixed(2)}` : '$0.00'

  const isLight = variant === 'light'

  return (
    <button
      type="button"
      onClick={openOrderBar}
      data-testid="photo-styler-cta-button"
      aria-label={`View cart – ${formattedPrice} (${itemCount} items)`}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:scale-[1.02] cursor-pointer',
        isLight
          ? 'bg-white/90 hover:bg-white text-neutral-900 border border-neutral-200/60'
          : 'bg-black/65 hover:bg-black/80 text-white border border-white/10 backdrop-blur-sm',
        className
      )}
    >
      <span className="inline-flex items-center gap-2">
        <span className="text-base font-semibold tabular-nums">{formattedPrice}</span>
        <CartBagIcon />
      </span>
    </button>
  )
}
