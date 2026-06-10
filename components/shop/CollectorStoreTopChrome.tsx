'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, Moon, Sun } from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { cn } from '@/lib/utils'
import { useLandingAppearance } from '@/app/(store)/shop/street-collector/LandingThemeProvider'
import { streetLampProductPath } from '@/lib/shop/street-lamp-handle'
import { streetCollectorContent } from '@/content/street-collector'

const HOME_LOGO_URL =
  'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/logo_1.png?v=1773229683&width=64&height=64'

const NAV = [
  { href: '/shop/drops', label: 'Drops' },
  { href: '/shop/artists', label: 'Artists' },
  { href: '/shop/reserve', label: 'The Reserve' },
  { href: streetLampProductPath(), label: 'The Lamp' },
] as const

const DEFAULT_TRUST_PROMO = streetCollectorContent.meetTheLamp.trustMicroItems.join(' · ')

export type CollectorStoreTopChromeProps = {
  /**
   * Thin promo strip above the nav.
   * Omit or `undefined` to use the default shipping/trust line from `street-collector` content.
   * Pass `''` to hide the strip (layout height shrinks — use matching spacer on the page).
   */
  promoLine?: string
  /**
   * When true, only the inner nav row is rendered (parent supplies fixed wrapper + promo).
   * When false, this component is `fixed` top and includes optional `promoLine`.
   */
  embedded?: boolean
}

export function CollectorStoreTopChrome({
  promoLine,
  embedded = false,
}: CollectorStoreTopChromeProps) {
  const pathname = usePathname() || ''
  const landingAppearance = useLandingAppearance()
  const resolvedPromo =
    promoLine === undefined ? DEFAULT_TRUST_PROMO : promoLine.trim() === '' ? null : promoLine
  const [menuOpen, setMenuOpen] = useState(false)
  const [SlideoutMenu, setSlideoutMenu] = useState<React.ComponentType<{
    open: boolean
    onClose: () => void
    theme?: 'light' | 'dark'
    authRedirectTo?: string
    logoHref?: string
  }> | null>(null)

  useEffect(() => {
    if (menuOpen && !SlideoutMenu) {
      import('@/components/shop/navigation/ShopSlideoutMenu').then((m) =>
        setSlideoutMenu(() => m.ShopSlideoutMenu)
      )
    }
  }, [menuOpen, SlideoutMenu])

  const promoBlock =
    resolvedPromo != null ? (
      <div
        className="flex w-full items-center justify-center border-b border-stone-200/90 bg-white/95 px-3 py-1.5 text-center text-[10px] font-medium leading-snug text-balance text-stone-600 dark:border-white/[0.08] dark:bg-[#0f0e0e] dark:text-[#FFBA94]/75 sm:text-[11px] md:text-xs"
        style={
          embedded
            ? undefined
            : { paddingTop: 'max(0.25rem, env(safe-area-inset-top, 0px))' }
        }
        role="region"
        aria-label="Shipping, guarantee, and returns"
      >
        {resolvedPromo}
      </div>
    ) : null

  const navRow = (
    <div
      className={cn(
        'flex w-full flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 bg-white/90 px-3 py-2 backdrop-blur-md dark:border-white/10 dark:bg-[#171515]/90 sm:px-4',
        embedded ? 'relative z-0' : 'relative'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:flex-none">
        <Link
          href="/shop/street-collector"
          className="-m-1 inline-flex shrink-0 items-center gap-2 rounded-md p-1 text-sm font-medium tracking-tight text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/70 dark:text-[#FFBA94] dark:focus-visible:ring-[#FFBA94]/40"
          aria-label="Street Collector home"
        >
          <img
            src={getProxiedImageUrl(HOME_LOGO_URL)}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 object-contain"
          />
          <span className="hidden sm:inline">Street Collector</span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="inline-flex md:hidden items-center justify-center rounded-md p-1.5 text-stone-600 hover:bg-stone-100 dark:text-[#FFBA94]/80 dark:hover:bg-white/10"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
        {SlideoutMenu && (
          <SlideoutMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            theme={landingAppearance?.appearance === 'dark' ? 'dark' : 'light'}
            authRedirectTo={pathname || '/shop/street-collector'}
            logoHref="/shop/street-collector"
          />
        )}
        <nav
          className="hidden md:flex items-center gap-5 text-sm text-stone-600 dark:text-[#FFBA94]/75"
          aria-label="Shop"
        >
          {NAV.map(({ href, label }) => {
            const active =
              href === '/shop/artists'
                ? pathname.startsWith('/shop/artists')
                : pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={cn(
                  'rounded-md px-1 py-0.5 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/70 dark:hover:text-[#FFBA94] dark:focus-visible:ring-[#FFBA94]/40',
                  active && 'font-medium text-stone-900 dark:text-[#FFBA94]'
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {landingAppearance ? (
          <button
            type="button"
            onClick={landingAppearance.toggleAppearance}
            aria-label={
              landingAppearance.appearance === 'dark'
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-300/80 bg-white/90 text-stone-800 dark:border-white/15 dark:bg-[#201c1c]/80 dark:text-[#FFBA94]"
          >
            {landingAppearance.appearance === 'dark' ? (
              <Sun className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        ) : null}
        <Link
          href="/shop/account"
          prefetch={false}
          className="hidden rounded-md px-1 py-0.5 text-sm text-stone-600 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/70 dark:text-[#FFBA94]/70 dark:hover:text-[#FFBA94] dark:focus-visible:ring-[#FFBA94]/40 sm:inline"
        >
          Sign in
        </Link>
        <Link
          href="/shop/artists"
          prefetch={false}
          className="inline-flex items-center justify-center rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-[#FFBA94] dark:text-[#171515] dark:focus-visible:ring-[#FFBA94] dark:focus-visible:ring-offset-[#171515] sm:px-4 sm:text-sm"
        >
          Follow artists
        </Link>
      </div>
    </div>
  )

  if (embedded) {
    return (
      <>
        {promoBlock}
        {navRow}
      </>
    )
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[122] flex flex-col"
      style={resolvedPromo ? undefined : { paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {promoBlock}
      {navRow}
    </div>
  )
}
