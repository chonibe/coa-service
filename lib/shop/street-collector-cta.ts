import { cn } from '@/lib/utils'

/** Maroon primary CTA + keyboard focus (no blue/purple ring from global --ring). */
export const streetCollectorCtaClass = cn(
  'bg-experience-cta font-semibold transition-colors',
  'text-white dark:text-neutral-900',
  'hover:bg-experience-cta-hover',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-experience-cta/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
)

/** Compact top-bar CTA variant */
export const streetCollectorCtaCompactClass = cn(
  streetCollectorCtaClass,
  'inline-flex shrink-0 items-center justify-center rounded-md px-3 py-1.5 text-xs shadow-none sm:px-4 sm:py-2 sm:text-sm'
)

/** Standard section CTA (rounded-lg, min touch target) */
export const streetCollectorCtaLgClass = cn(
  streetCollectorCtaClass,
  'inline-flex min-h-[48px] items-center justify-center rounded-lg px-6 py-3 text-sm shadow-md'
)

/** Sticky mobile bar CTA */
export const streetCollectorCtaStickyClass = cn(
  streetCollectorCtaClass,
  'flex min-h-[52px] w-full max-w-md items-center justify-center rounded-lg px-5 py-3.5 text-sm shadow-lg'
)

/** Neutral focus for blue accent icon buttons (carousel arrows, etc.) */
export const streetCollectorAccentButtonFocusClass = cn(
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background'
)
