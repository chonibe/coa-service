import Link from 'next/link'
import { cn } from '@/lib/utils'
import { streetCollectorCtaStickyClass } from '@/lib/shop/street-collector-cta'

type MobileStickyCtaProps = {
  href: string
  label: string
  /** Optional override for the aria-label so screen readers get full context. */
  ariaLabel?: string
  /**
   * When `"md"` (default): visible below Tailwind `md` (<768px), matching typical phone breakpoints.
   * When `"960"`: visible at max-width 960px so it aligns with landing CSS breakpoints.
   */
  breakpoint?: 'md' | '960'
}

/**
 * Fixed bottom CTA shown only on mobile. Respects iOS safe-area.
 * Rendered as a server component to avoid shipping unnecessary JS.
 */
export function MobileStickyCta({ href, label, ariaLabel, breakpoint = 'md' }: MobileStickyCtaProps) {
  const visibilityClasses =
    breakpoint === '960'
      ? 'hidden max-[960px]:flex'
      : 'flex md:hidden'

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[120] justify-center px-4 py-3 ${visibilityClasses}`}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <Link
        href={href}
        prefetch={false}
        aria-label={ariaLabel ?? label}
        className={cn(streetCollectorCtaStickyClass, 'uppercase tracking-[0.12em]')}
      >
        {label}
      </Link>
    </div>
  )
}
