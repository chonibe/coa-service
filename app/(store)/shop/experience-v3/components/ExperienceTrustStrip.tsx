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
  /** horizontal: compact row (mobile bar above). stacked: vertical column (desktop beside bar). */
  variant?: 'horizontal' | 'stacked'
}

/**
 * Slim trust bar shown above experience product / checkout sticky bars.
 */
export function ExperienceTrustStrip({
  className,
  variant = 'horizontal',
}: ExperienceTrustStripProps) {
  const isStacked = variant === 'stacked'

  return (
    <div
      className={cn(
        isStacked
          ? 'rounded-lg border border-border/70 bg-card/95 px-3 py-2.5 text-left shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md'
          : 'border border-border/70 bg-card',
        className
      )}
      role="region"
      aria-label="Purchase guarantees"
    >
      <ul
        className={cn(
          'w-full',
          isStacked
            ? 'flex flex-col items-start gap-1'
            : 'mx-auto flex max-w-[1400px] items-stretch justify-center gap-1 px-3 py-2 sm:gap-4 sm:px-4'
        )}
      >
        {experienceV3Content.trustItems.map((item) => {
          const Icon = TRUST_ICONS[item.icon]
          return (
            <li
              key={item.icon}
              className={cn(
                'flex items-center gap-1.5',
                isStacked
                  ? 'justify-start'
                  : 'min-w-0 flex-1 justify-center sm:gap-2'
              )}
            >
              <Icon
                className={cn(
                  'shrink-0 text-experience-highlight',
                  isStacked ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'
                )}
                strokeWidth={1.75}
                aria-hidden
              />
              <span
                className={cn(
                  'font-medium leading-tight text-foreground/90',
                  isStacked
                    ? 'whitespace-nowrap text-xs'
                    : 'text-center text-[9px] leading-snug sm:text-[11px]'
                )}
              >
                {item.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
