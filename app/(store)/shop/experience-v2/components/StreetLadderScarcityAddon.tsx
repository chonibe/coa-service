'use client'

import { cn } from '@/lib/utils'
import type { StreetLadderForScarcity } from '@/lib/shop/experience-street-ladder-display'
import { EXPERIENCE_PURCHASE_HINTS } from '@/lib/shop/experience-purchase-hints'
import { ExperienceMeaningHint } from './ExperienceMeaningHint'

const NEXT_CHIP_CLASS =
  'inline-flex max-w-full min-w-0 justify-center items-center rounded-md px-2 py-0.5 border border-border bg-muted text-[11px] leading-tight text-foreground font-medium normal-case tracking-normal text-center tabular-nums'

export function StreetLadderScarcityAddon({
  block,
  className,
}: {
  block: StreetLadderForScarcity
  className?: string
}) {
  const showLadderHint = Boolean(
    block.nextStepChip ||
      (block.listActive && block.listPricePrimary && block.listPricePrimary !== 'Free')
  )

  return (
    <div
      className={cn(
        'mt-3 w-full space-y-2 border-t border-border pt-3.5',
        className
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground text-center">
        {block.stageLabel}
      </p>
      {block.listActive && block.listPricePrimary && block.listPricePrimary !== 'Free' ? (
        <div className="flex justify-center items-baseline gap-1.5 flex-wrap">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {block.listPricePrimary}
          </span>
          {block.listPriceCompareAt ? (
            <span className="text-[11px] line-through text-muted-foreground tabular-nums">
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
      {showLadderHint ? (
        <ExperienceMeaningHint
          explanation={EXPERIENCE_PURCHASE_HINTS.ladder}
          className="flex flex-col items-center text-center"
        />
      ) : null}
    </div>
  )
}
