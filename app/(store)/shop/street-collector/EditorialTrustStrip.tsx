'use client'

import { cn } from '@/lib/utils'

export function EditorialTrustStrip({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <div
      className={cn(
        'border-y border-neutral-200/90 bg-neutral-50/80 dark:border-white/10 dark:bg-neutral-900/50',
        className
      )}
      role="region"
      aria-label="Highlights"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col divide-y divide-neutral-200/80 dark:divide-white/10 sm:flex-row sm:divide-x sm:divide-y-0">
        {items.map((label) => (
          <div
            key={label}
            className="flex flex-1 items-center justify-center px-4 py-3 text-center sm:py-3.5 md:px-6"
          >
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-800 dark:text-neutral-300 sm:text-[11px]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
