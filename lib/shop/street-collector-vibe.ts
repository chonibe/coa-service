import { cn } from '@/lib/utils'

/**
 * Rounded container: dark red shell + peach text on light page backgrounds.
 * Use with children that set explicit text colors (`text-[#FFBA94]` etc.).
 */
export const scMaroonCardClass = cn(
  'rounded-[28px] border border-[#FFBA94]/15 bg-[#3b0b0b]',
  'shadow-[0_24px_60px_rgba(59,11,11,0.38)]',
  'outline-none ring-0 ring-offset-0',
  'dark:border-[#ffba94]/10 dark:bg-[#2a1212] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]'
)

/** Glass price / meta chip on maroon */
export const scMaroonGlassChipClass = cn(
  'inline-flex max-w-[min(100%,22rem)] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-center font-semibold',
  'text-[11px] leading-snug text-[#FFBA94] sm:px-3.5 sm:py-2 sm:text-sm sm:leading-normal',
  'border border-[#FFBA94]/35 bg-white/[0.08] backdrop-blur-md backdrop-saturate-150',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
)
