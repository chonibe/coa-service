'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'

interface DesktopTopBarProps {
  text: string
  href: string
  logoUrl: string
  /** When true, no fixed positioning — parent provides the fixed stacking header (e.g. promo + bar). */
  embedded?: boolean
}

/**
 * Desktop top bar with logo, menu, and CTA (md+). Always visible — no full-width hero above the fold.
 */
export function DesktopTopBar({ text, href, logoUrl, embedded = false }: DesktopTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [SlideoutMenu, setSlideoutMenu] = useState<React.ComponentType<{
    open: boolean
    onClose: () => void
    theme?: 'light' | 'dark'
    authRedirectTo?: string
  }> | null>(null)

  useEffect(() => {
    if (menuOpen && !SlideoutMenu) {
      import('@/components/shop/navigation/ShopSlideoutMenu').then((m) =>
        setSlideoutMenu(() => m.ShopSlideoutMenu)
      )
    }
  }, [menuOpen, SlideoutMenu])

  return (
    <div
      className={embedded
        ? 'relative z-0 flex w-full items-center justify-between border-b border-neutral-200/60 bg-white/80 px-3 py-1.5 backdrop-blur-md dark:border-white/10 dark:bg-[#171515]/80 sm:px-4'
        : 'fixed top-0 left-0 right-0 z-[120] hidden md:flex items-center justify-between border-b border-neutral-200/60 bg-white/80 px-3 py-1.5 backdrop-blur-md dark:border-white/10 dark:bg-[#171515]/80 sm:px-4'}
      style={
        embedded
          ? undefined
          : { paddingTop: 'max(0.375rem, env(safe-area-inset-top, 0px))' }
      }
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/"
          aria-label="Street Collector Home"
          className="inline-flex items-center justify-center p-1 -m-1 transition-transform hover:scale-105"
        >
          <img
            src={getProxiedImageUrl(logoUrl)}
            alt=""
            width={24}
            height={24}
            className="shrink-0 w-6 h-6 object-contain"
          />
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="inline-flex items-center justify-center p-1 -m-1 text-neutral-600 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white transition-colors"
        >
          <Menu size={20} className="shrink-0" />
        </button>
        {SlideoutMenu && (
          <SlideoutMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            theme="light"
            authRedirectTo="/"
          />
        )}
      </div>
      <Link
        href={href}
        prefetch={false}
        className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#047AFF] px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-[#0366d6] hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
      >
        {text}
      </Link>
    </div>
  )
}
