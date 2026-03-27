'use client'

import { cn } from '@/lib/utils'
import type { StreetLadderForScarcity } from '@/lib/shop/experience-street-ladder-display'

const NEXT_CHIP_CLASS =
  'inline-flex max-w-full min-w-0 justify-center items-center rounded-md px-2 py-0.5 border border-neutral-200 dark:border-white/10 bg-neutral-50/95 dark:bg-white/5 text-[11px] leading-tight text-neutral-700 dark:text-neutral-200 font-medium normal-case tracking-normal text-center tabular-nums'

export function StreetLadderScarcityAddon({
  block,
  className,
}: {
  block: StreetLadderForScarcity
  className?: string
}) {
  return (
    <div
      className={cn(
        'mt-3 pt-3 border-t border-neutral-200/80 dark:border-white/10 space-y-1.5 w-full',
        className
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-[#9a8a8a] text-center">
        {block.stageLabel}
      </p>
      {block.listActive && block.listPricePrimary && block.listPricePrimary !== 'Free' ? (
        <div className="flex justify-center items-baseline gap-1.5 flex-wrap">
          <span className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-white">
            {block.listPricePrimary}
          </span>
          {block.listPriceCompareAt ? (
            <span className="text-[11px] line-through text-neutral-400 dark:text-neutral-500 tabular-nums">
              {block.listPriceCompareAt}
            </span>
          ) : null}
        </div>
      ) : null}
      {block.nextStepChip ? (
        <div className="flex justify-center px-1">
          <span className={NEXT_CHIP_CLASS}>{block.nextStepChip}</span>
        </div>
      ) : null}
    </div>
  )
}
