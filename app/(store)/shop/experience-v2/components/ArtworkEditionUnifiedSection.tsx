'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * One framed block for collector-facing edition copy + scarcity (detail / accordion).
 */
export function ArtworkEditionUnifiedSection({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-neutral-200/90 dark:border-[#2e2929]',
        'bg-neutral-50/60 dark:bg-[#181414]/90',
        'px-4 py-4 sm:px-5 sm:py-4',
        className
      )}
      aria-label="Edition information"
    >
      <div className="flex flex-col items-center gap-5 max-w-md mx-auto w-full">{children}</div>
    </section>
  )
}
