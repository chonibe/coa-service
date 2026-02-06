'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ScrollingAnnouncementBar, 
  defaultAnnouncementMessages,
  Footer,
} from '@/components/impact'
import { CartProvider, useCart } from '@/lib/shop/CartContext'
import { WishlistProvider, useWishlist } from '@/lib/shop/WishlistContext'
import { formatPrice, type ShopifyProduct } from '@/lib/shopify/storefront-client'
import { 
  mainNavigation as syncedMainNavigation, 
  footerSections as syncedFooterSections 
} from '@/content/shopify-content'
import { ShopNavigation } from '@/components/shop/navigation'
import { LocalCartDrawer } from '@/components/impact/LocalCartDrawer'
import { WishlistDrawer } from '@/components/shop/navigation'

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
      { label: 'New Releases', href: '/shop/products?collection=new-releases' },
      { label: 'Best Sellers', href: '/shop/products?collection=best-sellers' },
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

// Use default navigation (synced navigation from Shopify is incomplete)
// TODO: Update main-menu in Shopify to match this structure, then re-run sync script
const shopNavigation = defaultNavigation

// Use synced footer sections from Shopify, with fallback to default
const footerSections = syncedFooterSections.length > 0 ? syncedFooterSections : [
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
  const wishlist = useWishlist()
  const [cartLoading, setCartLoading] = useState(false)
  const [navModalOpen, setNavModalOpen] = useState(false)
  const [wishlistDrawerOpen, setWishlistDrawerOpen] = useState(false)
  const [recommendedProducts, setRecommendedProducts] = useState<Array<{
    id: string
    title: string
    handle: string
    price: string
    compareAtPrice?: string
    image: string
    vendor: string
  }>>([])
  
  // Fetch recommendations for cart drawer
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/shop/collections/new-releases')
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
  }, [])
  
  // Handle wishlist drawer toggle
  const handleWishlistClick = useCallback(() => {
    setWishlistDrawerOpen((prev) => !prev)
    if (!wishlistDrawerOpen) {
      setNavModalOpen(false)
      cart.toggleCart(false)
    }
  }, [wishlistDrawerOpen, cart])
  
  // Handle cart drawer toggle
  const handleViewCart = useCallback(() => {
    cart.toggleCart(true)
    setNavModalOpen(false)
    setWishlistDrawerOpen(false)
  }, [cart])
  
  // Handle navigation modal toggle
  const handleNavModalToggle = useCallback(() => {
    setNavModalOpen((prev) => !prev)
    if (!navModalOpen) {
      cart.toggleCart(false)
      setWishlistDrawerOpen(false)
    }
  }, [navModalOpen, cart])
  
  // Handle adding recommended products to cart
  const onAddRecommendedToCart = useCallback(async (productId: string) => {
    const product = recommendedProducts.find(p => p.id === productId) || 
                    wishlist.items.find(item => item.id === productId)
    
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
  }, [recommendedProducts, wishlist.items, cart])
  
  // Handle adding wishlist items to cart
  const onAddToCart = useCallback(async (productId: string) => {
    await onAddRecommendedToCart(productId)
  }, [onAddRecommendedToCart])
  
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
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#2c4bce] focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to content
      </a>
      
      {/* Scrolling Announcement Bar */}
      <ScrollingAnnouncementBar 
        messages={defaultAnnouncementMessages}
        speed={25}
      />
      
      {/* Shop Navigation */}
      <ShopNavigation
        isModalOpen={navModalOpen}
        onModalToggle={handleNavModalToggle}
        onViewCart={handleViewCart}
        onWishlistClick={handleWishlistClick}
      />
      
      {/* Cart Drawer with Recommendations */}
      <LocalCartDrawer
        isOpen={cart.isOpen}
        onClose={() => cart.toggleCart(false)}
        cart={cartForDrawer as any}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        loading={cartLoading}
        orderNotes={cart.orderNotes}
        onOrderNotesChange={cart.setOrderNotes}
        recommendedProducts={recommendedProducts}
        onAddRecommendedToCart={onAddRecommendedToCart}
      />
      
      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={wishlistDrawerOpen}
        onClose={() => setWishlistDrawerOpen(false)}
        onAddToCart={onAddToCart}
      />
      
      {/* Main Content */}
      <main id="main-content" className="flex-1">
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

// Main layout with CartProvider and WishlistProvider wrappers
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <WishlistProvider>
        <ShopLayoutInner>
          {children}
        </ShopLayoutInner>
      </WishlistProvider>
    </CartProvider>
  )
}
