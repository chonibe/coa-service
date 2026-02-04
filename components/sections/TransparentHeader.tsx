'use client'

import { useState, useRef, useCallback } from 'react'
import { Header } from '@/components/impact'
import { useSmoothHeaderScroll } from '@/lib/animations/navigation-animations'
import { SearchDrawer } from '@/components/impact'
import { MobileMenuDrawer } from '@/components/impact'
import type { NavigationLink } from '@/components/impact'

interface TransparentHeaderProps {
  navigation: NavigationLink[]
  logoHref?: string
  cartCount?: number
  onCartClick?: () => void
}

export function TransparentHeader({
  navigation,
  logoHref = '/shop/home',
  cartCount = 0,
  onCartClick,
}: TransparentHeaderProps) {
  const headerRef = useRef<HTMLElement>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Use smooth header scroll hook for smooth color transitions
  useSmoothHeaderScroll(headerRef, 80)

  const handleSearchClick = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const handleMenuClick = useCallback(() => {
    setIsMobileMenuOpen(true)
  }, [])

  return (
    <>
      <Header
        ref={headerRef}
        navigation={navigation}
        logoHref={logoHref}
        cartCount={cartCount}
        onCartClick={onCartClick}
        onSearchClick={handleSearchClick}
        onMenuClick={handleMenuClick}
        className="transparent-header-overlay transition-all duration-300"
        style={{
          '--nav-color': 'white',
        } as React.CSSProperties}
      />

      {/* Search Drawer */}
      <SearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navigation={navigation}
      />
      
      <style jsx global>{`
        /* Transparent header overlay styling */
        header.transparent-header-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background-color: transparent;
          transition: background-color 0.3s ease;
        }
        
        /* Smooth header background and text color transitions */
        header.transparent-header-overlay[style*="--nav-color"] {
          color: var(--nav-color);
        }
        
        /* Override header icon colors with smooth transition */
        header.transparent-header-overlay svg {
          color: var(--nav-color);
          stroke: var(--nav-color);
          transition: color 0.3s ease, stroke 0.3s ease;
        }
        
        /* Smooth logo color transition */
        header.transparent-header-overlay img {
          filter: brightness(0) invert(1);
          transition: filter 0.3s ease;
        }
        
        /* Smooth navigation link transitions */
        header.transparent-header-overlay a {
          color: var(--nav-color);
          transition: color 0.3s ease;
        }
        
        /* Smooth cart badge transitions */
        header.transparent-header-overlay [class*="badge"] {
          transition: background-color 0.3s ease, color 0.3s ease;
        }
      `}</style>
    </>
  )
}
