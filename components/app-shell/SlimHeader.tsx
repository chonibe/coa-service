'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Search, Bell, ShoppingBag, Gem } from 'lucide-react'

// ============================================================================
// App Shell Slim Header
//
// 56px maroon header matching shop brand identity.
// Logo left, utility icons right.
// Hides on scroll down, shows on scroll up (like Instagram).
// ============================================================================

/** Logo URLs from Shopify CDN */
const LOGO_LIGHT = 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Logo_a395ed7f-3980-4407-80d0-70c343848544.png?v=1764246238'

export interface SlimHeaderProps {
  /** Show the cart icon (typically for collectors) */
  showCart?: boolean
  /** Show the search icon */
  showSearch?: boolean
  /** Show the notifications bell */
  showNotifications?: boolean
  /** Cart item count */
  cartCount?: number
  /** Notification count */
  notificationCount?: number
  /** Credit balance to display (collector gamification) */
  creditBalance?: number | null
  /** Callback when search icon is tapped */
  onSearchClick?: () => void
  /** Callback when bell icon is tapped */
  onNotificationClick?: () => void
  /** Callback when cart icon is tapped */
  onCartClick?: () => void
  /** Callback when credits badge is tapped */
  onCreditsClick?: () => void
  /** Link for the logo */
  logoHref?: string
  className?: string
}

export function SlimHeader({
  showCart = true,
  showSearch = true,
  showNotifications = true,
  cartCount = 0,
  notificationCount = 0,
  creditBalance = null,
  onSearchClick,
  onNotificationClick,
  onCartClick,
  onCreditsClick,
  logoHref = '/',
  className,
}: SlimHeaderProps) {
  const [isVisible, setIsVisible] = React.useState(true)
  const lastScrollY = React.useRef(0)
  const ticking = React.useRef(false)

  React.useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY

          if (currentScrollY < 10) {
            // Always show when near top
            setIsVisible(true)
          } else if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
            // Scrolling down & past threshold — hide
            setIsVisible(false)
          } else if (currentScrollY < lastScrollY.current) {
            // Scrolling up — show
            setIsVisible(true)
          }

          lastScrollY.current = currentScrollY
          ticking.current = false
        })
        ticking.current = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-app-chrome',
        'pt-[var(--app-safe-top)]',
        'transition-transform duration-300 ease-out',
        isVisible ? 'translate-y-0' : '-translate-y-full',
        className
      )}
    >
      <div className="flex items-center justify-between h-[var(--app-header-height)] px-4">
        {/* Logo */}
        <Link
          href={logoHref}
          className="flex items-center shrink-0"
          aria-label="Home"
        >
          <img
            src={LOGO_LIGHT}
            alt="Street Collector"
            className="h-7 w-auto object-contain"
          />
        </Link>

        {/* Utility Icons */}
        <div className="flex items-center gap-1">
          {/* Credits Badge */}
          {creditBalance !== null && (
            <button
              onClick={onCreditsClick}
              className={cn(
                'flex items-center gap-1 mr-1',
                'h-7 px-2.5 rounded-full',
                'bg-impact-secondary/90 text-impact-secondary-text',
                'text-xs font-bold font-body',
                'hover:bg-impact-secondary active:scale-95',
                'transition-all duration-200'
              )}
              aria-label={`${creditBalance} credits`}
            >
              <Gem className="w-3 h-3" />
              <span>{creditBalance >= 1000 ? `${(creditBalance / 1000).toFixed(1)}k` : creditBalance}</span>
            </button>
          )}

          {/* Search */}
          {showSearch && (
            <button
              onClick={onSearchClick}
              className={cn(
                'flex items-center justify-center',
                'w-10 h-10 rounded-full',
                'text-app-chrome-text',
                'hover:bg-white/10 active:bg-white/15',
                'transition-colors duration-200'
              )}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {/* Notifications */}
          {showNotifications && (
          <button
            onClick={onNotificationClick}
            className={cn(
              'relative flex items-center justify-center',
              'w-10 h-10 rounded-full',
              'text-app-chrome-text',
              'hover:bg-white/10 active:bg-white/15',
              'transition-colors duration-200'
            )}
            aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span
                className={cn(
                  'absolute top-1.5 right-1.5',
                  'min-w-[1rem] h-4 px-1',
                  'flex items-center justify-center',
                  'bg-impact-error text-white',
                  'text-[10px] font-bold leading-none',
                  'rounded-full'
                )}
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
          )}

          {/* Cart (optional) */}
          {showCart && (
            <button
              onClick={onCartClick}
              className={cn(
                'relative flex items-center justify-center',
                'w-10 h-10 rounded-full',
                'text-app-chrome-text',
                'hover:bg-white/10 active:bg-white/15',
                'transition-colors duration-200'
              )}
              aria-label={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span
                  className={cn(
                    'absolute top-1.5 right-1.5',
                    'min-w-[1rem] h-4 px-1',
                    'flex items-center justify-center',
                    'bg-impact-secondary text-impact-secondary-text',
                    'text-[10px] font-bold leading-none',
                    'rounded-full'
                  )}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
