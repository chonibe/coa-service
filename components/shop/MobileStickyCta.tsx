import Link from 'next/link'

type MobileStickyCtaProps = {
  href: string
  label: string
  /** Optional override for the aria-label so screen readers get full context. */
  ariaLabel?: string
}

/**
 * Fixed bottom CTA shown only on mobile. Respects iOS safe-area.
 * Rendered as a server component to avoid shipping unnecessary JS.
 */
export function MobileStickyCta({ href, label, ariaLabel }: MobileStickyCtaProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[120] flex justify-center px-4 py-3 md:hidden"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <Link
        href={href}
        prefetch={false}
        aria-label={ariaLabel ?? label}
        className="flex min-h-[52px] w-full max-w-md items-center justify-center rounded-lg bg-[#ffba94] px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-[#171515] shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#e09060]"
      >
        {label}
      </Link>
    </div>
  )
}
