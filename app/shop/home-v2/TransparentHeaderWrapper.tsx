'use client'

import { useCart } from '@/lib/shop/CartContext'
import { TransparentHeader } from '@/components/sections/TransparentHeader'

const shopNavigation = [
  { label: 'Shop', href: '/shop' },
  { label: 'Artists', href: '/shop/artists' },
  { label: 'About', href: '/about' },
]

export function TransparentHeaderWrapper() {
  return (
    <>
      <style jsx global>{`
        /* Hide the default header on home-v2 page */
        body:has([data-page="home-v2"]) header:not(.transparent-header-overlay) {
          display: none !important;
        }
        
        /* Remove top padding from main so hero video starts at top */
        [data-page="home-v2"] {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
        
        /* Ensure hero video section starts at absolute top */
        [data-page="home-v2"] > section:first-child,
        [data-page="home-v2"] > div:first-child {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
      `}</style>
      
      <TransparentHeader
        navigation={shopNavigation}
        logoHref="/shop/home"
      />
    </>
  )
}
