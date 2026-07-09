'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { cn } from '@/lib/utils'
import { ShopChatButton } from './ShopChatButton'
import type { ShopSlideoutMenuProps } from './ShopSlideoutMenu'

const ROUND_LOGO_URL = 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_707.png?v=1767356535'

export type ShopUnifiedTopBarProps = {
  centerContent?: ReactNode
  /** Rendered after chat icon (e.g. experience or collection cart chip). */
  rightSlot?: ReactNode
  /** Extra controls before chat (e.g. edition watchlist toggle on experience). */
  headerTrailingContent?: ReactNode
  showChatIcon?: boolean
  hideRight?: boolean
  /** `embedded` — in-flow header (experience layout). `fixed` — fixed to viewport top. */
  position?: 'embedded' | 'fixed'
  className?: string
  menuTheme?: 'light' | 'dark'
  menuProps?: Omit<ShopSlideoutMenuProps, 'open' | 'onClose' | 'theme'>
  /** Controlled slideout menu state (experience auth context). */
  menuOpen?: boolean
  onMenuOpenChange?: (open: boolean) => void
}

/**
 * Canonical shop header: hamburger + optional center control + chat + cart slot.
 * Used by Experience V3 (`ExperienceSlideoutMenu`) and Explore Artists.
 */
export function ShopUnifiedTopBar({
  centerContent,
  rightSlot,
  headerTrailingContent,
  showChatIcon = true,
  hideRight = false,
  position = 'embedded',
  className,
  menuTheme = 'dark',
  menuProps,
  menuOpen: controlledMenuOpen,
  onMenuOpenChange,
}: ShopUnifiedTopBarProps) {
  const pathname = usePathname()
  const [internalMenuOpen, setInternalMenuOpen] = useState(false)
  const menuOpen = controlledMenuOpen ?? internalMenuOpen
  const setMenuOpen = onMenuOpenChange ?? setInternalMenuOpen
  const [SlideoutMenu, setSlideoutMenu] = useState<typeof import('./ShopSlideoutMenu').ShopSlideoutMenu | null>(
    null
  )

  const ensureSlideoutMenuLoaded = useCallback(() => {
    if (SlideoutMenu) return
    import('./ShopSlideoutMenu').then((m) => setSlideoutMenu(() => m.ShopSlideoutMenu))
  }, [SlideoutMenu])

  useEffect(() => {
    if (menuOpen && !SlideoutMenu) {
      ensureSlideoutMenuLoaded()
    }
  }, [menuOpen, SlideoutMenu, ensureSlideoutMenuLoaded])

  useEffect(() => {
    const id = window.setTimeout(() => ensureSlideoutMenuLoaded(), 150)
    return () => window.clearTimeout(id)
  }, [ensureSlideoutMenuLoaded])

  const header = (
    <header
      className={cn(
        'shrink-0 relative flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6',
        'bg-background border-b border-border safe-area-inset-top',
        position === 'fixed' && 'fixed top-0 left-0 right-0 z-[122]',
        position === 'embedded' && 'sticky top-0 z-[122]',
        className
      )}
    >
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/"
          aria-label="Street Collector - Home"
          className="hidden md:inline-flex items-center justify-center p-2 -m-2 transition-opacity hover:opacity-80"
        >
          <img
            src={getProxiedImageUrl(ROUND_LOGO_URL)}
            alt="Street Collector"
            width={32}
            height={32}
            className="w-8 h-8 object-contain shrink-0"
          />
        </Link>
        <button
          type="button"
          onClick={() => {
            ensureSlideoutMenuLoaded()
            setMenuOpen(true)
          }}
          onMouseEnter={ensureSlideoutMenuLoaded}
          onTouchStart={ensureSlideoutMenuLoaded}
          aria-label="Open menu"
          className="inline-flex items-center justify-center p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          <Menu size={24} className="shrink-0" />
        </button>
      </div>

      <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center pointer-events-none">
        {centerContent ? (
          <div className="pointer-events-auto z-10">{centerContent}</div>
        ) : (
          <Link
            href="/"
            aria-label="Street Collector - Home"
            className="pointer-events-auto inline-flex items-center justify-center p-2 -m-2 transition-opacity hover:opacity-80 z-10 md:hidden"
          >
            <img
              src={getProxiedImageUrl(ROUND_LOGO_URL)}
              alt="Street Collector"
              width={32}
              height={32}
              className="w-8 h-8 object-contain shrink-0"
            />
          </Link>
        )}
      </div>

      {!hideRight && (
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {headerTrailingContent}
          {showChatIcon ? <ShopChatButton variant="experience" /> : null}
          {rightSlot}
        </div>
      )}
    </header>
  )

  return (
    <>
      {header}
      {SlideoutMenu ? (
        <SlideoutMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          theme={menuTheme}
          authRedirectTo={menuProps?.authRedirectTo ?? (pathname || '/shop/explore-artists')}
          logoHref={menuProps?.logoHref ?? '/'}
          {...menuProps}
        />
      ) : null}
    </>
  )
}
