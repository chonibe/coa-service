'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ScrollingAnnouncementBar, 
  defaultAnnouncementMessages,
  Header,
  Footer,
  CartDrawer,
  SearchDrawer,
  MobileMenuDrawer,
  type SearchResult,
} from '@/components/impact'
import { CartProvider, useCart } from '@/lib/shop/CartContext'
import { formatPrice, type ShopifyProduct } from '@/lib/shopify/storefront-client'

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
 */

// Navigation items for the header menu
const shopNavigation = [
  { 
    label: 'Shop', 
    href: '/shop',
    children: [
      { label: 'All Artworks', href: '/shop' },
      { label: 'New Releases', href: '/shop?collection=new-releases' },
      { label: 'Best Sellers', href: '/shop?collection=best-sellers' },
      { label: 'Street Lamp', href: '/shop/street_lamp' },
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
  { label: 'Contact', href: '/contact' },
]

// Footer sections
const footerSections = [
  {
    title: 'Street Collector',
    links: [
      { label: 'Search', href: '/shop?search=true' },
      { label: 'Artist Submissions', href: '/artist-submissions' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Terms of Service', href: '/policies/terms-of-service' },
      { label: 'Shipping Policy', href: '/policies/shipping-policy' },
      { label: 'Refund Policy', href: '/policies/refund-policy' },
      { label: 'Privacy Policy', href: '/policies/privacy-policy' },
      { label: 'Contact', href: '/contact' },
    ],
  },
]

// Social links
const socialLinks: Array<{ platform: 'facebook' | 'instagram'; href: string }> = [
  { platform: 'facebook', href: 'https://facebook.com/streetcollector' },
  { platform: 'instagram', href: 'https://instagram.com/thestreetcollector' },
]

// Legal links for footer bottom
const legalLinks = [
  { label: 'Refund policy', href: '/policies/refund-policy' },
  { label: 'Privacy policy', href: '/policies/privacy-policy' },
  { label: 'Terms of service', href: '/policies/terms-of-service' },
  { label: 'Shipping policy', href: '/policies/shipping-policy' },
  { label: 'Contact information', href: '/contact' },
]

// Inner layout with access to cart context
function ShopLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const cart = useCart()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  
  // Handle search
  const handleSearch = useCallback(async (query: string): Promise<{ products: SearchResult[]; collections: SearchResult[] }> => {
    try {
      const response = await fetch(`/api/shop/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      
      // Transform products to SearchResult format
      const products: SearchResult[] = (data.products || []).map((p: ShopifyProduct) => ({
        id: p.id,
        handle: p.handle,
        title: p.title,
        type: 'product' as const,
        image: p.featuredImage ? { url: p.featuredImage.url, altText: p.featuredImage.altText || undefined } : undefined,
        price: formatPrice(p.priceRange.minVariantPrice),
        vendor: p.vendor,
      }))
      
      // Transform collections
      const collections: SearchResult[] = (data.collections || []).map((c: any) => ({
        id: c.id,
        handle: c.handle,
        title: c.title,
        type: 'collection' as const,
        image: c.image ? { url: c.image.url, altText: c.image.altText || undefined } : undefined,
      }))
      
      return { products, collections }
    } catch (error) {
      console.error('Search error:', error)
      return { products: [], collections: [] }
    }
  }, [])
  
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
  
  // Handle account click
  const handleAccountClick = useCallback(() => {
    router.push('/shop/account')
  }, [router])
  
  // Build cart object for CartDrawer (convert from our format to Shopify format)
  const cartForDrawer = {
    id: 'local-cart',
    totalQuantity: cart.itemCount,
    cost: {
      subtotalAmount: { amount: cart.subtotal.toString(), currencyCode: 'USD' },
      totalAmount: { amount: cart.total.toString(), currencyCode: 'USD' },
    },
    lines: {
      edges: cart.items.map(item => ({
        node: {
          id: item.id,
          quantity: item.quantity,
          merchandise: {
            id: item.variantId,
            title: item.variantTitle || 'Default Title',
            image: item.image ? { url: item.image, altText: item.title } : null,
            price: { amount: item.price.toString(), currencyCode: 'USD' },
            product: {
              id: item.productId,
              title: item.title,
              handle: item.handle,
            },
          },
        },
      })),
    },
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Scrolling Announcement Bar */}
      <ScrollingAnnouncementBar 
        messages={defaultAnnouncementMessages}
        speed={25}
      />
      
      {/* Header */}
      <Header 
        navigation={shopNavigation}
        logoHref="/shop/home"
        cartCount={cart.itemCount}
        onCartClick={() => cart.toggleCart(true)}
        onSearchClick={() => setSearchOpen(true)}
        onLoginClick={handleAccountClick}
        onMenuClick={() => setMobileMenuOpen(true)}
      />
      
      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cart.isOpen}
        onClose={() => cart.toggleCart(false)}
        cart={cartForDrawer as any}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        loading={cartLoading}
        orderNotes={cart.orderNotes}
        onOrderNotesChange={cart.setOrderNotes}
      />
      
      {/* Search Drawer */}
      <SearchDrawer
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearch={handleSearch}
        placeholder="Search artworks, artists..."
      />
      
      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navigation={shopNavigation}
        logoSrc="https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Logo_a395ed7f-3980-4407-80d0-70c343848544.png?v=1764246238"
        onSearchClick={() => {
          setMobileMenuOpen(false)
          setSearchOpen(true)
        }}
        onAccountClick={handleAccountClick}
      />
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <Footer
        sections={footerSections}
        socialLinks={socialLinks}
        newsletterEnabled={true}
        newsletterTitle="Sign up for new stories and personal offers"
        newsletterDescription=""
        aboutTitle="About The Street Lamp"
        aboutText="In a world where art is often consumed on screens, The Street Lamp bridges the gap between the digital and the real, bringing art back into the physical world to be truly felt and experienced."
        tagline=""
        legalLinks={legalLinks}
        showPaymentIcons={true}
      />
    </div>
  )
}

// Main layout with CartProvider wrapper
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <ShopLayoutInner>
        {children}
      </ShopLayoutInner>
    </CartProvider>
  )
}
