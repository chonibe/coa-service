'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Footer } from '@/components/impact'
import { AffiliatePersistence } from './components/AffiliatePersistence'
import { CartProvider, useCart } from '@/lib/shop/CartContext'
import { WishlistProvider } from '@/lib/shop/WishlistContext'
import { ShopAuthProvider } from '@/lib/shop/ShopAuthContext'
import { formatPrice, type ShopifyProduct } from '@/lib/shopify/storefront-client'
import { 
  mainNavigation as syncedMainNavigation, 
  footerSections as syncedFooterSections 
} from '@/content/shopify-content'
import { homepageContent } from '@/content/homepage'
import { BackBar } from '@/components/shop/navigation/BackBar'
import { ChatIconScrollReveal } from '@/components/shop/navigation/ChatIconScrollReveal'
import { LocalCartDrawer } from '@/components/impact/LocalCartDrawer'
import type { SearchResult } from '@/components/impact/SearchDrawer'
import { cn } from '@/lib/utils'

/**
 * Shop Layout
 * 
 * Wraps all shop pages with:
 * - Cart provider for state management
 * - Scrolling announcement bar at the top
 * - Site header with navigation, search, account, cart
 * - Cart drawer (slideout)
 * - Search drawer
 * - Page content
 * - Site footer with newsletter and links
 * 
 * Navigation is now dynamically loaded from Shopify via content/shopify-content.ts
 * Run scripts/sync-shopify-content.ts to update the navigation from Shopify
 */

// Default navigation menu with proper structure
const defaultNavigation = [
  { 
    label: 'Shop', 
    href: '/shop/products',
    children: [
      { label: 'All Artworks', href: '/shop/products' },
      { label: 'New Releases', href: `/shop/products?collection=${homepageContent.newReleases.collectionHandle}` },
      { label: 'Best Sellers', href: `/shop/products?collection=${homepageContent.bestSellers.collectionHandle}` },
      { label: 'Street Lamp', href: '/shop/street_lamp' },
      { label: 'Customize Your Lamp', href: '/experience' },
    ]
  },
  { 
    label: 'Artists', 
    href: '/shop/artists',
    children: [
      { label: 'All Artists', href: '/shop/artists' },
      { label: 'Featured Artists', href: '/shop/artists?featured=true' },
    ]
  },
  { label: 'About', href: '/about' },
  { label: 'For Business', href: '/shop/for-business' },
  { label: 'Contact', href: '/shop/contact' },
]

// Use default navigation (synced navigation from Shopify is incomplete)
// TODO: Update main-menu in Shopify to match this structure, then re-run sync script
const shopNavigation = defaultNavigation

// Use synced footer sections from Shopify when they have links, else fallback to default
// Sync: scripts/sync-shopify-content.ts — uses footer/footer-menu from theme
const hasUsefulFooterSections =
  Array.isArray(syncedFooterSections) &&
  syncedFooterSections.length > 0 &&
  syncedFooterSections.some((s) => s.links && s.links.length > 0)

const footerSections = hasUsefulFooterSections
  ? syncedFooterSections
  : [
      {
        title: 'FOLLOW US',
        links: [
          { label: 'Instagram', href: 'https://instagram.com/thestreetcollector' },
          { label: 'Facebook', href: 'https://facebook.com/streetcollector' },
          { label: 'TikTok', href: 'https://tiktok.com/@thestreetcollector' },
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

// Inner layout with access to cart context
function ShopLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isExperiencePage = pathname?.startsWith('/shop/experience') || pathname?.startsWith('/experience')
  const isStreetCollectorPage = pathname?.startsWith('/shop/street-collector')
  const cart = useCart()
  const [cartLoading, setCartLoading] = useState(false)
  const [recommendedProducts, setRecommendedProducts] = useState<Array<{
    id: string
    title: string
    handle: string
    price: string
    compareAtPrice?: string
    image: string
    vendor: string
  }>>([])
  
  // Fetch recommendations for cart drawer (skip on experience page - it has its own OrderBar)
  useEffect(() => {
    if (isExperiencePage) return
    const fetchRecommendations = async () => {
      try {
        const response = await fetch(`/api/shop/collections/${homepageContent.newReleases.collectionHandle}`)
        if (response.ok) {
          const data = await response.json()
          setRecommendedProducts(data.products || [])
        } else {
          // Fallback products
          setRecommendedProducts([
            {
              id: 'fallback-1',
              title: 'New Release Vinyl',
              handle: 'new-release',
              price: '$29.99',
              image: '/placeholder.jpg',
              vendor: 'Various Artists'
            }
          ])
        }
      } catch (error) {
        console.error('[Shop Layout] Failed to fetch recommendations:', error)
        setRecommendedProducts([])
      }
    }
    fetchRecommendations()
  }, [isExperiencePage])
  
  // Handle adding recommended products to cart
  const onAddRecommendedToCart = useCallback(async (productId: string) => {
    const product = recommendedProducts.find(p => p.id === productId)
    
    if (!product) {
      console.error('[Cart Recommendations] Product not found:', productId)
      return
    }
    
    await cart.addItem({
      variantId: productId,
      quantity: 1,
      productTitle: product.title,
      productHandle: product.handle,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: product.image,
      vendor: product.vendor || 'Unknown'
    })
  }, [recommendedProducts, cart])
  
  // Handle cart checkout
  const handleCheckout = useCallback(async () => {
    if (cart.isEmpty) return
    
    setCartLoading(true)
    try {
      const response = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineItems: cart.items.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity,
            productHandle: item.handle,
            productTitle: item.title,
            variantTitle: item.variantTitle,
            price: Math.round(item.price * 100), // Convert to cents
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
    } finally {
      setCartLoading(false)
    }
  }, [cart.items, cart.creditsToUse, cart.isEmpty])
  
  // Handle cart item quantity update
  const handleUpdateQuantity = useCallback(async (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      cart.removeItem(lineId)
    } else {
      cart.updateQuantity(lineId, quantity)
    }
  }, [cart])
  
  // Handle cart item remove
  const handleRemoveItem = useCallback(async (lineId: string) => {
    cart.removeItem(lineId)
  }, [cart])

  // Newsletter signup - sends to Shopify customer list with marketing consent
  const handleNewsletterSubmit = useCallback(async (email: string) => {
    const res = await fetch('/api/shop/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'Signup failed')
  }, [])
  
  // Shop search: call API and map to SearchResult shape for nav search drawer
  const handleSearch = useCallback(async (query: string): Promise<{ products: SearchResult[]; collections: SearchResult[] }> => {
    if (!query?.trim()) return { products: [], collections: [] }
    try {
      const res = await fetch(`/api/shop/search?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      const products: SearchResult[] = (data.products || []).map((p: { id: string; handle: string; title: string; featuredImage?: { url: string; altText?: string } | null; priceRange?: { minVariantPrice?: { amount: string } }; vendor?: string }) => ({
        id: p.id,
        handle: p.handle,
        title: p.title,
        type: 'product' as const,
        image: p.featuredImage ? { url: p.featuredImage.url, altText: p.featuredImage.altText } : undefined,
        price: p.priceRange?.minVariantPrice?.amount,
        vendor: p.vendor,
      }))
      const collections: SearchResult[] = (data.collections || []).map((c: { id: string; handle: string; title: string; image?: { url: string; altText?: string } | null }) => ({
        id: c.id,
        handle: c.handle,
        title: c.title,
        type: 'collection' as const,
        image: c.image ? { url: c.image.url, altText: c.image.altText } : undefined,
      }))
      return { products, collections }
    } catch {
      return { products: [], collections: [] }
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={null}>
        <AffiliatePersistence />
      </Suspense>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#047AFF] focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to content
      </a>
      
      {/* Minimal back bar on all shop pages except street-collector */}
      {!isStreetCollectorPage && <BackBar href="/" label="Back" />}
      {/* Chat icon in top-right when scrolled past hero (street-collector has no BackBar) */}
      {isStreetCollectorPage && <ChatIconScrollReveal />}
      
      {/* Cart Drawer - hidden on experience page (has its own OrderBar) */}
      {!isExperiencePage && (
        <LocalCartDrawer
          isOpen={cart.isOpen}
          onClose={() => cart.toggleCart(false)}
          items={cart.items ?? []}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
          subtotal={cart.subtotal}
          total={cart.total}
          creditsToUse={cart.creditsToUse}
          creditsDiscount={cart.creditsDiscount}
        />
      )}
      
      {/* Main Content */}
      <main
        id="main-content"
        className={cn('flex-1', isStreetCollectorPage && 'bg-[#F5F5F5]')}
      >
        {children}
      </main>
      
      {/* Footer */}
      <Footer
        sections={footerSections}
        newsletterEnabled={true}
        newsletterTitle="Sign up for new stories and personal offers"
        newsletterDescription=""
        onNewsletterSubmit={handleNewsletterSubmit}
        tagline=""
        legalLinks={[]}
        showPaymentIcons={true}
      />
    </div>
  )
}

// Main layout with CartProvider and WishlistProvider wrappers
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <WishlistProvider>
        <ShopAuthProvider>
          <ShopLayoutInner>
            {children}
          </ShopLayoutInner>
        </ShopAuthProvider>
      </WishlistProvider>
    </CartProvider>
  )
}
