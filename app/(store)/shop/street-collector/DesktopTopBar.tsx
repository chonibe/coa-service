'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { useTheme } from 'next-themes'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { cn } from '@/lib/utils'
import { streetCollectorCtaCompactClass } from '@/lib/shop/street-collector-cta'

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
  const { resolvedTheme } = useTheme()
  const menuTheme = resolvedTheme === 'light' ? 'light' : 'dark'
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
        ? 'relative z-0 flex w-full items-center justify-between border-b border-border bg-background px-3 py-1.5 shadow-none [filter:none] sm:px-4'
        : 'fixed top-0 left-0 right-0 z-[120] hidden md:flex items-center justify-between border-b border-border bg-background px-3 py-1.5 shadow-none [filter:none] sm:px-4'}
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
          className="inline-flex items-center justify-center p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu size={20} className="shrink-0" />
        </button>
        {SlideoutMenu && (
          <SlideoutMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            theme={menuTheme}
            authRedirectTo="/"
          />
        )}
      </div>
      <Link
        href={href}
        prefetch={false}
        className={cn(streetCollectorCtaCompactClass, 'shadow-none hover:opacity-90')}
      >
        {text}
      </Link>
    </div>
  )
}
