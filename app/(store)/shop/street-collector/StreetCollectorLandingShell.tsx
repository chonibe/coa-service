'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useExperienceTheme } from '@/app/(store)/shop/experience-v2/ExperienceThemeContext'
import { cn } from '@/lib/utils'

const DesktopTopBar = dynamic(
  () => import('./DesktopTopBar').then((m) => ({ default: m.DesktopTopBar }))
)

const HOME_LOGO_URL =
  'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/logo_1.png?v=1773229683&width=64&height=64'

type StreetCollectorLandingShellProps = {
  trustPromoLine: string
  ctaText: string
  ctaHref: string
  children: React.ReactNode
}

/**
 * Fixed chrome: promo strip + logo / menu row on all breakpoints; mobile sticky blue CTA at bottom.
 */
export function StreetCollectorLandingShell({
  trustPromoLine,
  ctaText,
  ctaHref,
  children,
}: StreetCollectorLandingShellProps) {
  const { theme } = useExperienceTheme()
  const isDark = theme === 'dark'

  const promoBar = isDark
    ? 'border-white/[0.08] bg-[#0f0e0e] text-[#FFBA94]/75'
    : 'border-stone-200/90 bg-white/95 text-stone-600 shadow-sm backdrop-blur-md'

  return (
    <div className="w-full pb-16 md:pb-0">
      <div className="fixed top-0 left-0 right-0 z-[122] flex flex-col">
        <div
          className={cn(
            'flex w-full items-center justify-center border-b px-3 py-1 text-center text-[11px] font-medium leading-tight tracking-wide sm:text-xs sm:py-1.5',
            promoBar
          )}
          style={{ paddingTop: 'max(0.375rem, env(safe-area-inset-top, 0px))' }}
          role="region"
          aria-label="Shipping, guarantee, and returns"
        >
          {trustPromoLine}
        </div>
        <DesktopTopBar embedded text={ctaText} href={ctaHref} logoUrl={HOME_LOGO_URL} />
      </div>
      <div
        className="md:hidden shrink-0"
        style={{ height: 'calc(5.25rem + env(safe-area-inset-top, 0px))' }}
        aria-hidden
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-[120] flex justify-center px-4 py-4 md:hidden"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <Link
          href={ctaHref}
          prefetch={false}
          className="flex min-h-[52px] w-full max-w-md items-center justify-center border border-neutral-900 bg-neutral-900 px-5 py-3.5 font-sans text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition-colors hover:bg-neutral-800 dark:border-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {ctaText}
        </Link>
      </div>

      {children}
    </div>
  )
}
