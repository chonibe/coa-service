'use client'

import { Package, RotateCcw, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStorePageContent } from '@/lib/content/site-content'

const experienceV3Content = getStorePageContent('experienceV3')

const TRUST_ICONS = {
  shipping: Package,
  returns: RotateCcw,
  guarantee: Shield,
} as const

export type ExperienceTrustStripProps = {
  className?: string
}

/**
 * Slim trust bar shown above experience product / checkout sticky bars.
 */
export function ExperienceTrustStrip({ className }: ExperienceTrustStripProps) {
  return (
    <div
      className={cn(
        'border-b border-border/60 bg-muted/50 backdrop-blur-sm',
        className
      )}
      role="region"
      aria-label="Purchase guarantees"
    >
      <ul className="mx-auto flex w-full max-w-[1400px] items-stretch justify-center gap-1 px-3 py-2 sm:gap-4 sm:px-4">
        {experienceV3Content.trustItems.map((item) => {
          const Icon = TRUST_ICONS[item.icon]
          return (
            <li
              key={item.icon}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 sm:gap-2"
            >
              <Icon
                className="h-3.5 w-3.5 shrink-0 text-experience-highlight/90 sm:h-4 sm:w-4"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="truncate text-[9px] font-medium leading-tight text-muted-foreground sm:text-[11px]">
                {item.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
