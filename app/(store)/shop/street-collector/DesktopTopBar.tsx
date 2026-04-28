'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, Search, User, ShoppingBag } from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { cn } from '@/lib/utils'
import { useExperienceTheme } from '@/app/(store)/shop/experience-v2/ExperienceThemeContext'
import { useCart } from '@/lib/shop/CartContext'
import { streetCollectorLandingNav } from '@/content/street-collector'

/** Wide wordmark — matches slideout / brand */
const LANDING_WORDMARK_URL =
  'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_707.png?v=1767356535'

interface DesktopTopBarProps {
  text: string
  href: string
  logoUrl: string
  /** When true, no fixed positioning — parent provides the fixed stacking header (e.g. promo + bar). */
  embedded?: boolean
}

/**
 * Editorial top bar: wordmark, menu (theme + more), desktop center nav, search / account / cart.
 */
export function DesktopTopBar({ text, href, logoUrl: _logoUrl, embedded = false }: DesktopTopBarProps) {
  void _logoUrl
  const { theme: experienceTheme } = useExperienceTheme()
  const cart = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [SlideoutMenu, setSlideoutMenu] = useState<React.ComponentType<{
    open: boolean
    onClose: () => void
    theme?: 'light' | 'dark'
    authRedirectTo?: string
    showThemeToggle?: boolean
  }> | null>(null)

  useEffect(() => {
    if (menuOpen && !SlideoutMenu) {
      import('@/components/shop/navigation/ShopSlideoutMenu').then((m) =>
        setSlideoutMenu(() => m.ShopSlideoutMenu)
      )
    }
  }, [menuOpen, SlideoutMenu])

  const count = cart.itemCount

  return (
    <div
      className={cn(
        'relative z-0 w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/90',
        !embedded && 'md:fixed md:left-0 md:right-0 md:top-0 md:z-[120]'
      )}
      style={
        embedded ? undefined : { paddingTop: 'max(0rem, env(safe-area-inset-top, 0px))' }
      }
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/" aria-label="Street Collector Home" className="transition-opacity hover:opacity-90">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getProxiedImageUrl(LANDING_WORDMARK_URL)}
              alt="The Street Collector"
              width={180}
              height={32}
              className="h-6 w-auto sm:h-7"
            />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className={cn(
              'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-colors',
              'text-neutral-900 hover:bg-neutral-900/10 dark:text-neutral-100 dark:hover:bg-white/10'
            )}
          >
            <Menu size={22} strokeWidth={2.25} aria-hidden />
          </button>
          {SlideoutMenu && (
            <SlideoutMenu
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              theme={experienceTheme === 'dark' ? 'dark' : 'light'}
              showThemeToggle
              authRedirectTo="/"
            />
          )}
        </div>

        <nav className="hidden min-w-0 flex-1 justify-center px-2 lg:flex" aria-label="Primary links">
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 xl:gap-x-6">
            {streetCollectorLandingNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
                  className="whitespace-nowrap font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-800 transition-colors hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-1">
          <Link
            href="/shop/products"
            prefetch={false}
            className={cn(
              'hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-neutral-800 transition-colors hover:bg-neutral-900/5 sm:inline-flex dark:text-neutral-200 dark:hover:bg-white/10'
            )}
            aria-label="Browse products"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </Link>
          <Link
            href="/shop/account"
            prefetch={false}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-neutral-800 transition-colors hover:bg-neutral-900/5 dark:text-neutral-200 dark:hover:bg-white/10"
            aria-label="Account"
          >
            <User className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => cart.toggleCart(true)}
            className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-neutral-800 transition-colors hover:bg-neutral-900/5 dark:text-neutral-200 dark:hover:bg-white/10"
            aria-label={`Shopping bag${count > 0 ? `, ${count} items` : ''}`}
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[9px] font-bold text-white dark:bg-white dark:text-neutral-900">
                {count > 99 ? '99+' : count}
              </span>
            ) : null}
          </button>

          <Link
            href={href}
            prefetch={false}
            className="ml-1 hidden min-h-[40px] shrink-0 items-center justify-center border border-neutral-900 bg-neutral-900 px-3 py-2 font-sans text-[10px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800 sm:inline-flex dark:border-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 lg:ml-2"
          >
            {text}
          </Link>
        </div>
      </div>
    </div>
  )
}
