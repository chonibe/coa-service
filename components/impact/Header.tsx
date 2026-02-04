'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Container } from './Container'
import { useScrollHeader, useCartBadgeAnimation } from '@/lib/animations/useScrollHeader'

/**
 * Impact Theme Header
 * 
 * Matches the exact styling from the Shopify Impact theme:
 * - Background: #390000 (dark maroon)
 * - Text color: #ffba94 (peach/salmon accent)
 * - Layout: Menu (left), Logo (center), Search/Login/Cart (right)
 * - Height: 64px mobile, 80px desktop
 * 
 * Enhanced with GSAP scroll effects:
 * - Progressive backdrop blur on scroll
 * - Logo scale animation (1 → 0.85)
 * - Hide/show on scroll direction
 * - Cart badge pop animation
 */

// Default logo URLs from Shopify CDN
const LOGO_LIGHT = 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Logo_a395ed7f-3980-4407-80d0-70c343848544.png?v=1764246238'

export interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

export interface HeaderProps {
  logo?: React.ReactNode
  logoSrc?: string
  logoHref?: string
  navigation?: NavItem[]
  cartCount?: number
  onCartClick?: () => void
  onSearchClick?: () => void
  onLoginClick?: () => void
  onMenuClick?: () => void
  className?: string
  /** Enable scroll-based effects (blur, logo scale, hide/show) */
  enableScrollEffects?: boolean
  /** Hide header when scrolling down */
  hideOnScroll?: boolean
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  (
    {
      logo,
      logoSrc = LOGO_LIGHT, // Default to Street Collector logo
      logoHref = '/',
      navigation = [],
      cartCount = 0,
      onCartClick,
      onSearchClick,
      onLoginClick,
      onMenuClick,
      className,
      enableScrollEffects = true,
      hideOnScroll = false,
    },
    ref
  ) => {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
    const prevCartCount = React.useRef(cartCount)
    
    // Scroll effects hook
    const { 
      headerRef, 
      logoRef, 
      isScrolled, 
      isHidden,
      scrollProgress 
    } = useScrollHeader({
      threshold: 80,
      hideOnScroll,
      progressiveBlur: enableScrollEffects,
      logoScale: enableScrollEffects,
      minLogoScale: 0.85,
    })
    
    // Cart badge animation hook
    const { badgeRef, triggerPop, triggerPulse } = useCartBadgeAnimation()
    
    // Trigger badge animation when cart count changes
    React.useEffect(() => {
      if (cartCount > prevCartCount.current) {
        triggerPop()
      } else if (cartCount !== prevCartCount.current && cartCount > 0) {
        triggerPulse()
      }
      prevCartCount.current = cartCount
    }, [cartCount, triggerPop, triggerPulse])
    
    // Merge refs
    const mergedRef = React.useMemo(() => {
      return (node: HTMLElement | null) => {
        // Set external ref
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
        // Set internal ref for scroll effects
        ;(headerRef as React.MutableRefObject<HTMLElement | null>).current = node
      }
    }, [ref, headerRef])
    
    return (
      <header
        ref={mergedRef}
        className={cn(
          'sticky top-0 z-50',
          'bg-[#390000]', // Impact theme header background
          'border-b border-[#ffba94]/10',
          // Scroll-based hide/show transition
          hideOnScroll && 'transition-transform duration-300',
          isHidden && hideOnScroll && '-translate-y-full',
          // Add subtle shadow when scrolled
          isScrolled && 'shadow-lg shadow-black/20',
          className
        )}
        style={enableScrollEffects ? {
          // Initial backdrop filter (will be animated by GSAP)
          backdropFilter: `blur(${scrollProgress * 20}px) saturate(${100 + scrollProgress * 80}%)`,
          WebkitBackdropFilter: `blur(${scrollProgress * 20}px) saturate(${100 + scrollProgress * 80}%)`,
        } : undefined}
      >
        <Container maxWidth="default" paddingX="gutter">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left: Menu button */}
            <div className="flex items-center gap-2 min-w-fit">
              <button
                type="button"
                className="p-2 -ml-2 text-[#ffba94] hover:text-white transition-colors"
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen)
                  onMenuClick?.()
                }}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {mobileMenuOpen ? (
                    <path
                      d="M6 6L18 18M6 18L18 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  ) : (
                    <path
                      d="M4 6H20M4 12H20M4 18H20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
              </button>
            </div>
            
            {/* Center: Logo - Script style logo from live site */}
            <Link
              href={logoHref}
              className="absolute left-1/2 transform -translate-x-1/2 hover:opacity-80 transition-opacity"
              aria-label="Street Collector - Home"
            >
              <span 
                ref={logoRef as React.RefObject<HTMLSpanElement>}
                className="inline-block origin-center"
              >
                {logo ? (
                  logo
                ) : logoSrc ? (
                  <img 
                    src={logoSrc} 
                    alt="Street Collector" 
                    className="h-6 sm:h-8 lg:h-10 w-auto"
                  />
                ) : (
                  <span className="font-heading text-xl sm:text-2xl font-semibold tracking-[-0.02em] whitespace-nowrap text-[#ffba94]">
                    Street Collector
                  </span>
                )}
              </span>
            </Link>
            
            {/* Right: Icons (Search, Login, Cart) */}
            <div className="flex items-center gap-0.5 sm:gap-1 min-w-[100px] sm:min-w-[120px] justify-end">
              {/* Search button */}
              <button
                type="button"
                className="p-2.5 text-[#ffba94] hover:text-white transition-colors rounded-full hover:bg-[#ffba94]/10"
                onClick={onSearchClick}
                aria-label="Search"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 16L20 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              
              {/* Login/Account button */}
              <button
                type="button"
                className="p-2.5 text-[#ffba94] hover:text-white transition-colors rounded-full hover:bg-[#ffba94]/10"
                onClick={onLoginClick}
                aria-label="Account"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M4 20C4 17 7 14 12 14C17 14 20 17 20 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              
              {/* Cart button - Shopping bag icon */}
              <button
                type="button"
                className="relative p-2.5 text-[#ffba94] hover:text-white transition-colors rounded-full hover:bg-[#ffba94]/10"
                onClick={onCartClick}
                aria-label={`Shopping cart${cartCount > 0 ? ` with ${cartCount} items` : ''}`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Shopping bag icon */}
                  <path
                    d="M6 6H18L19 20H5L6 6Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 6V5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5V6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                
                {/* Cart count badge - yellow accent with pop animation */}
                {cartCount > 0 && (
                  <span 
                    ref={badgeRef as React.RefObject<HTMLSpanElement>}
                    className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-[#f0c417] text-[#1a1a1a] rounded-full"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </Container>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#ffba94]/10">
            <Container maxWidth="default" paddingX="gutter">
              <nav className="py-4 space-y-1">
                {navigation.map((item) => (
                  <MobileNavLink key={item.href} item={item} />
                ))}
              </nav>
            </Container>
          </div>
        )}
      </header>
    )
  }
)
Header.displayName = 'Header'

/**
 * Desktop Nav Link
 */
interface NavLinkProps {
  item: NavItem
}

function NavLink({ item }: NavLinkProps) {
  const [open, setOpen] = React.useState(false)
  const hasChildren = item.children && item.children.length > 0
  
  if (hasChildren) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button
          type="button"
          className={cn(
            'flex items-center gap-1 px-4 py-2',
            'text-[#ffba94] hover:text-white',
            'font-body text-sm font-medium',
            'transition-colors duration-200'
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
              open && 'rotate-180'
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
        {open && (
          <div className="absolute top-full left-0 pt-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#390000] border border-[#ffba94]/10 rounded-lg shadow-lg py-2 min-w-[200px]">
              {item.children!.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block px-4 py-2 text-sm text-[#ffba94] hover:text-white hover:bg-[#ffba94]/10 transition-colors"
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
        'text-[#ffba94] hover:text-white',
        'font-body text-sm font-medium',
        'transition-colors duration-200'
      )}
    >
      {item.label}
    </Link>
  )
}

/**
 * Mobile Nav Link
 */
function MobileNavLink({ item }: NavLinkProps) {
  const [open, setOpen] = React.useState(false)
  const hasChildren = item.children && item.children.length > 0
  
  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'flex items-center justify-between w-full py-3',
            'text-[#ffba94] hover:text-white',
            'font-body text-base font-medium',
            'transition-colors duration-200'
          )}
        >
          {item.label}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={cn(
              'transition-transform duration-200',
              open && 'rotate-180'
            )}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        
        {open && (
          <div className="pl-4 pb-2 space-y-1">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className="block py-2 text-sm text-[#ffba94]/80 hover:text-white transition-colors"
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  return (
    <Link
      href={item.href}
      className={cn(
        'block py-3',
        'text-[#ffba94] hover:text-white',
        'font-body text-base font-medium',
        'transition-colors duration-200'
      )}
    >
      {item.label}
    </Link>
  )
}

/**
 * Announcement Bar - optional top bar
 */
export interface AnnouncementBarProps {
  message: string
  link?: {
    text: string
    href: string
  }
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

const AnnouncementBar = React.forwardRef<HTMLDivElement, AnnouncementBarProps>(
  ({ message, link, dismissible, onDismiss, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-[#2c4bce] text-white py-2 px-4',
          'text-center text-sm',
          className
        )}
      >
        <Container maxWidth="default" paddingX="gutter">
          <div className="flex items-center justify-center gap-2">
            <p>
              {message}
              {link && (
                <>
                  {' '}
                  <Link
                    href={link.href}
                    className="underline underline-offset-2 hover:no-underline"
                  >
                    {link.text}
                  </Link>
                </>
              )}
            </p>
            {dismissible && (
              <button
                type="button"
                onClick={onDismiss}
                className="p-1 hover:opacity-70 transition-opacity"
                aria-label="Dismiss"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </Container>
      </div>
    )
  }
)
AnnouncementBar.displayName = 'AnnouncementBar'

export { Header, AnnouncementBar }
