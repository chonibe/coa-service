'use client'

import { useId, useState } from 'react'
import { CircleHelp } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ExperienceMeaningHintProps = {
  /** Concise explanation shown when expanded (and as tooltip title on desktop). */
  explanation: string
  /** Accessible name for the control */
  label?: string
  className?: string
  /** Always show the explanation line (no toggle). Prefer on dense sticky bars. */
  alwaysVisible?: boolean
}

/**
 * Compact “What this means” control for Experience purchase signals.
 * Mobile-friendly expand; avoids relying on hover-only tooltips.
 */
export function ExperienceMeaningHint({
  explanation,
  label = 'What this means',
  className,
  alwaysVisible = false,
}: ExperienceMeaningHintProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  if (alwaysVisible) {
    return (
      <p
        className={cn(
          'text-[10px] leading-snug text-muted-foreground md:text-[11px]',
          className
        )}
      >
        {explanation}
      </p>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline md:text-[11px]"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <CircleHelp className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
        {label}
      </button>
      {open ? (
        <p
          id={panelId}
          className="mt-1 text-[10px] leading-snug text-muted-foreground md:text-[11px]"
          role="note"
        >
          {explanation}
        </p>
      ) : null}
    </div>
  )
}
