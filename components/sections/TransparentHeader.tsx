'use client'

import { useRef } from 'react'
import { Header } from '@/components/impact'
import { useSmoothHeaderScroll } from '@/lib/animations/navigation-animations'
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

  // Use smooth header scroll hook for smooth color transitions
  useSmoothHeaderScroll(headerRef, 80)

  return (
    <div
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300`}
      style={{
        '--nav-color': 'white',
      } as React.CSSProperties}
    >
      <Header
        ref={headerRef}
        navigation={navigation}
        logoHref={logoHref}
        cartCount={cartCount}
        onCartClick={onCartClick}
        className={`transition-colors duration-300`}
        style={{
          '--icon-color': 'var(--nav-color)',
        } as React.CSSProperties}
      />
      
      <style jsx global>{`
        /* Smooth header background and text color transitions */
        .fixed.top-0[style*="--nav-color"] {
          background-color: rgba(255, 255, 255, var(--bg-opacity, 0));
          color: var(--nav-color);
        }
        
        /* Override header icon colors with smooth transition */
        .fixed.top-0 svg {
          color: var(--nav-color);
          stroke: var(--nav-color);
          transition: color 0.3s ease, stroke 0.3s ease;
        }
        
        /* Smooth logo color transition */
        .fixed.top-0 img {
          filter: brightness(0) invert(var(--logo-invert, 1));
          transition: filter 0.3s ease;
        }
        
        /* Smooth navigation link transitions */
        .fixed.top-0 a {
          color: var(--nav-color);
          transition: color 0.3s ease;
        }
        
        /* Smooth cart badge transitions */
        .fixed.top-0 [class*="badge"] {
          transition: background-color 0.3s ease, color 0.3s ease;
        }
      `}</style>
    </div>
  )
}
