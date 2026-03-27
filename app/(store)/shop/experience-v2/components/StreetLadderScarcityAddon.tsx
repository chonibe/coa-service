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
      {block.subcopy ? (
        <p className="text-[11px] text-center text-neutral-600 dark:text-[#c4b4b4] leading-snug px-1">
          {block.subcopy}
        </p>
      ) : null}
      {block.nextStepChip ? (
        <div className="flex justify-center px-1">
          <span className={NEXT_CHIP_CLASS}>{block.nextStepChip}</span>
        </div>
      ) : null}
    </div>
  )
}

/** Compact two-line caption for watchlist carousel thumbnails. */
export function StreetLadderStripCaption({
  block,
  className,
}: {
  block: StreetLadderForScarcity
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-0.5 max-w-[6.5rem] text-center', className)}>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-[#9a8a8a] leading-tight line-clamp-2">
        {block.stageLabel}
      </p>
      {block.listActive && block.listPricePrimary && block.listPricePrimary !== 'Free' ? (
        <span className="text-[10px] font-semibold tabular-nums text-neutral-800 dark:text-neutral-100 leading-tight">
          {block.listPricePrimary}
        </span>
      ) : null}
      {block.nextStepChip ? (
        <span
          className={cn(
            NEXT_CHIP_CLASS,
            '!text-[9px] !py-px !px-1.5 leading-tight line-clamp-2 whitespace-normal'
          )}
        >
          {block.nextStepChip}
        </span>
      ) : null}
    </div>
  )
}
