'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Container } from '@/components/impact/Container'
import { Search, ShoppingBag, User } from 'lucide-react'
import { StreetLampLogo } from './StreetLampLogo'
import type { NavItem } from '@/components/impact/Header'

/**
 * FullHeader - Large header shown before scroll threshold
 * 
 * Features:
 * - Integrated search bar
 * - Horizontal navigation menu
 * - Cart and account icons with counts
 * - GSAP scroll effects via parent component
 */

export interface FullHeaderProps {
  logo?: React.ReactNode
  logoSrc?: string
  logoHref?: string
  navigation?: NavItem[]
  cartCount?: number
  onCartClick?: () => void
  onSearchFocus?: () => void
  onAccountClick?: () => void
  searchPlaceholder?: string
  className?: string
}

const LOGO_LIGHT = 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Logo_a395ed7f-3980-4407-80d0-70c343848544.png?v=1764246238'

export const FullHeader = React.forwardRef<HTMLElement, FullHeaderProps>(
  (
    {
      logo,
      logoSrc = LOGO_LIGHT,
      logoHref = '/',
      navigation = [],
      cartCount = 0,
      onCartClick,
      onSearchFocus,
      onAccountClick,
      searchPlaceholder = 'Search artworks, artists...',
      className,
    },
    ref
  ) => {
    const [searchQuery, setSearchQuery] = React.useState('')

    return (
      <header
        ref={ref}
        className={cn(
          'w-full bg-[#390000] border-b border-[#ffba94]/10',
          className
        )}
      >
        <Container maxWidth="default" paddingX="gutter">
          {/* Top Row: Logo, Search, Actions */}
          <div className="flex items-center justify-between gap-4 py-4">
            {/* Logo */}
            <Link
              href={logoHref}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
              aria-label="Street Collector - Home"
            >
              {logo ? (
                logo
              ) : (
                <StreetLampLogo
                  color="#ffba94"
                  height={40}
                />
              )}
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full group">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={onSearchFocus}
                  placeholder={searchPlaceholder}
                  className={cn(
                    'w-full h-11 pl-11 pr-4',
                    'bg-[#ffba94]/10 hover:bg-[#ffba94]/15 focus:bg-[#ffba94]/20',
                    'border border-[#ffba94]/20 focus:border-[#ffba94]/40',
                    'rounded-full',
                    'text-[#ffba94] placeholder:text-[#ffba94]/50',
                    'transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-[#ffba94]/30'
                  )}
                />
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ffba94]/50 group-hover:text-[#ffba94]/70 transition-colors"
                  size={18}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Search Icon - Mobile */}
              <button
                type="button"
                onClick={onSearchFocus}
                className="md:hidden p-2.5 text-[#ffba94] hover:text-white hover:bg-[#ffba94]/10 rounded-full transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Account */}
              <button
                type="button"
                onClick={onAccountClick}
                className="p-2.5 text-[#ffba94] hover:text-white hover:bg-[#ffba94]/10 rounded-full transition-colors"
                aria-label="Account"
              >
                <User size={20} />
              </button>

              {/* Cart */}
              <button
                type="button"
                onClick={onCartClick}
                className="relative p-2.5 text-[#ffba94] hover:text-white hover:bg-[#ffba94]/10 rounded-full transition-colors"
                aria-label={`Shopping cart${cartCount > 0 ? ` with ${cartCount} items` : ''}`}
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-[#f0c417] text-[#1a1a1a] rounded-full">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-1 pb-3" aria-label="Main navigation">
            {navigation.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        </Container>
      </header>
    )
  }
)
FullHeader.displayName = 'FullHeader'

/**
 * NavLink Component
 */
interface NavLinkProps {
  item: NavItem
}

function NavLink({ item }: NavLinkProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const hasChildren = item.children && item.children.length > 0

  if (hasChildren) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 px-4 py-2',
            'text-[#ffba94] hover:text-white hover:bg-[#ffba94]/10',
            'font-medium text-sm',
            'rounded-lg transition-colors duration-200'
          )}
        >
          {item.label}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={cn(
              'transition-transform duration-200',
              isHovered && 'rotate-180'
            )}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Dropdown */}
        {isHovered && (
          <div className="absolute top-full left-0 pt-2 z-50">
            <div className="bg-[#390000] border border-[#ffba94]/20 rounded-xl shadow-xl py-2 min-w-[200px]">
              {item.children!.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block px-4 py-2.5 text-sm text-[#ffba94] hover:text-white hover:bg-[#ffba94]/10 transition-colors"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'px-4 py-2',
        'text-[#ffba94] hover:text-white hover:bg-[#ffba94]/10',
        'font-medium text-sm',
        'rounded-lg transition-colors duration-200'
      )}
    >
      {item.label}
    </Link>
  )
}
