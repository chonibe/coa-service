'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Footer } from '@/components/impact'
import { AffiliatePersistence } from './shop/components/AffiliatePersistence'
import { CartProvider, useCart } from '@/lib/shop/CartContext'
import { WishlistProvider } from '@/lib/shop/WishlistContext'
import { ShopAuthProvider } from '@/lib/shop/ShopAuthContext'
import { footerSections as syncedFooterSections } from '@/content/shopify-content'
import { BackBar } from '@/components/shop/navigation/BackBar'
import { ChatIconScrollReveal } from '@/components/shop/navigation/ChatIconScrollReveal'
import { LocalCartDrawer } from '@/components/impact/LocalCartDrawer'
import { LandingThemeProvider } from '@/components/shop/street-collector/LandingThemeProvider'
import { cn } from '@/lib/utils'

/**
 * Store Layout — wraps landing (/) and shop (/shop/*)
 * Ensures Footer, Cart, BackBar/ChatIcon are shown on both routes.
 */

const hasUsefulFooterSections =
  Array.isArray(syncedFooterSections) &&
  syncedFooterSections.length > 0 &&
  syncedFooterSections.some((s: { links?: unknown[] }) => s.links && s.links.length > 0)

const footerSections = hasUsefulFooterSections
  ? syncedFooterSections
  : [
      {
        title: 'FOLLOW US',
        links: [
          { label: 'Instagram', href: 'https://instagram.com/thestreetcollector' },
          { label: 'Facebook', href: 'https://facebook.com/streetcollector' },
          { label: 'TikTok', href: 'https://www.tiktok.com/@street_collector_' },
          { label: 'Pinterest', href: 'https://pinterest.com/thestreetcollector' },
        ],
      },
      {
        title: 'RESOURCES',
        links: [
          { label: 'FAQ', href: '/shop/faq' },
          { label: 'For Business', href: '/shop/for-business' },
          { label: 'Affiliate program', href: '/shop/collab' },
          { label: 'Artist Submissions', href: '/shop/artist-submissions' },
        ],
      },
      {
        title: 'TERMS & CONDITIONS',
        links: [
          { label: 'Terms of Service', href: '/policies/terms-of-service' },
          { label: 'Shipping Policy', href: '/policies/shipping-policy' },
          { label: 'Refund Policy', href: '/policies/refund-policy' },
          { label: 'Privacy Policy', href: '/policies/privacy-policy' },
          { label: 'Contact', href: '/shop/contact' },
        ],
      },
    ]

function StoreLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => setHasMounted(true), [])
  const isExperiencePage = pathname?.startsWith('/shop/experience') || pathname?.startsWith('/experience')
  const isLandingPage = pathname === '/'
  const isStreetCollectorPage = pathname?.startsWith('/shop/street-collector')
  /** Full-bleed dark landing layouts (own nav); includes /shop/home-v2 and /shop/home-v2/gsap */
  const isHomeV2Page = pathname?.startsWith('/shop/home-v2')
  const isLandingOrStreetCollector =
    isLandingPage || isStreetCollectorPage || isHomeV2Page
  /** `/` and `/shop/street-collector` — theme toggle + coordinated light/dark (not home-v2). */
  const needsLandingTheme =
    pathname === '/' || pathname?.startsWith('/shop/street-collector')
  /** Chat icon: hero pages only — not home-v2 (fixed nav + CTA already occupy the top bar). */
  const showLandingChatIcon = isLandingPage || isStreetCollectorPage
  const pathnameReady = hasMounted && pathname != null && pathname !== ''
  const cart = useCart()

  const handleCheckout = useCallback(async () => {
    if (cart.isEmpty) return
    try {
      const response = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineItems: cart.items.map(item => ({
            variantId: item.variantId,
            shopifyProductId: item.productId,
            quantity: item.quantity,
            productHandle: item.handle,
            productTitle: item.title,
            variantTitle: item.variantTitle,
            price: Math.round(cart.effectiveUnitUsd(item) * 100),
            imageUrl: item.image,
          })),
          creditsToUse: cart.creditsToUse,
          orderNotes: cart.orderNotes,
        }),
      })
      const { url, error } = await response.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    }
  }, [cart])

  const handleUpdateQuantity = useCallback(async (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      cart.removeItem(lineId)
    } else {
      cart.updateQuantity(lineId, quantity)
    }
  }, [cart])

  const handleRemoveItem = useCallback(async (id: string) => {
    cart.removeItem(id)
  }, [cart])

  const handleNewsletterSubmit = useCallback(async (email: string) => {
    const res = await fetch('/api/shop/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'Signup failed')
  }, [])

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col',
        needsLandingTheme && 'bg-white dark:bg-neutral-950',
        isLandingOrStreetCollector && !needsLandingTheme && 'bg-[#171515]'
      )}
    >
      <Suspense fallback={null}>
        <AffiliatePersistence />
      </Suspense>
      {pathnameReady && !isLandingOrStreetCollector && <BackBar href="/" label="Back" />}
      {pathnameReady && showLandingChatIcon && <ChatIconScrollReveal />}
      {hasMounted && !isExperiencePage && (
        <LocalCartDrawer
          isOpen={cart.isOpen}
          onClose={() => cart.toggleCart(false)}
          items={cart.items ?? []}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
          getDisplayUnitPrice={cart.effectiveUnitUsd}
          subtotal={cart.subtotal}
          total={cart.total}
          creditsToUse={cart.creditsToUse}
          creditsDiscount={cart.creditsDiscount}
        />
      )}
      <main
        id="main-content"
        className={cn(
          needsLandingTheme
            ? 'flex-none max-md:!pb-0 bg-white dark:bg-neutral-950'
            : isLandingOrStreetCollector
              ? 'flex-none bg-[#171515] max-md:!pb-0'
              : 'flex-1'
        )}
      >
        {needsLandingTheme ? <LandingThemeProvider>{children}</LandingThemeProvider> : children}
      </main>
      <Footer
        sections={footerSections}
        newsletterEnabled={true}
        newsletterTitle="Stay in the loop."
        newsletterDescription=""
        onNewsletterSubmit={handleNewsletterSubmit}
        tagline=""
        legalLinks={[]}
        showPaymentIcons={true}
        className={cn(isLandingOrStreetCollector && '-mt-4 sm:-mt-5')}
      />
    </div>
  )
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <ShopAuthProvider>
          <StoreLayoutInner>{children}</StoreLayoutInner>
        </ShopAuthProvider>
      </WishlistProvider>
    </CartProvider>
  )
}
