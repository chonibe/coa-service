'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  getProduct,
  getCollection,
  formatPrice,
  isOnSale,
  getDiscountPercentage,
  type ShopifyProduct,
  type ShopifyProductVariant,
} from '@/lib/shopify/storefront-client'
import {
  Container,
  SectionWrapper,
  Button,
  Badge,
  ProductBadge,
  Card,
  ProductCard,
} from '@/components/impact'
import { ScrollingText } from '@/components/sections'
import {
  ProductGallery,
  ProductInfo,
  ProductAccordion,
  streetLampAccordionItems,
  artworkAccordionItems,
} from './components'

// =============================================================================
// PAGE COMPONENT (Client-side for interactivity)
// =============================================================================

export default function ProductPage() {
  // In Next.js 15+, use useParams hook for client components
  const params = useParams<{ handle: string }>()
  const [product, setProduct] = useState<ShopifyProduct | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ShopifyProductVariant | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [relatedProducts, setRelatedProducts] = useState<ShopifyProduct[]>([])
  const [apiError, setApiError] = useState<string | null>(null)

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/shop/products/${params?.handle}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          if (response.status === 404) {
            setProduct(null)
          } else {
            setApiError(errorData.error || 'Failed to load product')
          }
          setLoading(false)
          return
        }
        const data = await response.json()
        setProduct(data.product)
        
        // Set default variant
        if (data.product.variants.edges.length > 0) {
          const defaultVariant = data.product.variants.edges[0].node
          setSelectedVariant(defaultVariant)
          
          // Set default options
          const options: Record<string, string> = {}
          defaultVariant.selectedOptions.forEach((opt: { name: string; value: string }) => {
            options[opt.name] = opt.value
          })
          setSelectedOptions(options)
        }
        
        // Fetch related products
        if (data.product.productType) {
          const relatedResponse = await fetch(`/api/shop/products?type=${encodeURIComponent(data.product.productType)}&limit=4&exclude=${params.handle}`)
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json()
            setRelatedProducts(relatedData.products || [])
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProduct()
  }, [params.handle])

  // Update selected variant when options change
  useEffect(() => {
    if (!product) return
    
    const matchingVariant = product.variants.edges.find(({ node }) => {
      return node.selectedOptions.every(
        (opt) => selectedOptions[opt.name] === opt.value
      )
    })
    
    if (matchingVariant) {
      setSelectedVariant(matchingVariant.node)
    }
  }, [selectedOptions, product])

  // Handle option change
  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }))
  }

  // Handle checkout
  const handleCheckout = async () => {
    if (!selectedVariant || !product) return
    
    setCheckoutLoading(true)
    try {
      const response = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineItems: [
            {
              variantId: selectedVariant.id,
              quantity,
              productHandle: product.handle,
              productTitle: product.title,
              variantTitle: selectedVariant.title !== 'Default Title' ? selectedVariant.title : undefined,
              price: Math.round(parseFloat(selectedVariant.price.amount) * 100),
              compareAtPrice: selectedVariant.compareAtPrice
                ? Math.round(parseFloat(selectedVariant.compareAtPrice.amount) * 100)
                : undefined,
              imageUrl: selectedVariant.image?.url || product.featuredImage?.url,
            },
          ],
        }),
      })

      const { url, error } = await response.json()
      
      if (error) {
        alert(error)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <SectionWrapper spacing="md">
          <Container maxWidth="default">
            <div className="animate-pulse">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                <div className="aspect-square bg-[#f5f5f5] rounded-[24px]" />
                <div className="space-y-4">
                  <div className="h-8 bg-[#f5f5f5] rounded w-3/4" />
                  <div className="h-6 bg-[#f5f5f5] rounded w-1/4" />
                  <div className="h-24 bg-[#f5f5f5] rounded" />
                </div>
              </div>
            </div>
          </Container>
        </SectionWrapper>
      </main>
    )
  }

  // API Error state
  if (apiError) {
    return (
      <main className="min-h-screen bg-white">
        <SectionWrapper spacing="md" background="default">
          <Container maxWidth="default">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f83a3a]/10 rounded-full mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f83a3a" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 className="font-heading text-impact-h2 xl:text-impact-h2-lg font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-4">
                Product Unavailable
              </h1>
              <p className="text-[#1a1a1a]/60 mb-6 max-w-md mx-auto">
                Unable to load this product. This may be due to a configuration issue with the store.
              </p>
              <p className="text-sm text-[#f83a3a] mb-6 font-mono bg-[#f83a3a]/5 py-2 px-4 rounded-lg inline-block">
                {apiError}
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link href="/shop">
                  <Button variant="primary">Back to Shop</Button>
                </Link>
              </div>
            </div>
          </Container>
        </SectionWrapper>
      </main>
    )
  }

  // Not found state
  if (!product) {
    notFound()
  }

  const images = product.images.edges.map(({ node }) => node)
  const onSale = isOnSale(product)
  const discount = onSale ? getDiscountPercentage(product) : 0
  const currentImage = images[currentImageIndex] || product.featuredImage
  
  // Determine if this is the Street Lamp product
  const isStreetLamp = params?.handle === 'street_lamp'
  
  // Get appropriate accordion items
  const accordionItems = isStreetLamp ? streetLampAccordionItems : artworkAccordionItems

  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <SectionWrapper spacing="none" paddingX="gutter" background="default">
        <Container maxWidth="default">
          <nav className="flex items-center gap-2 py-4 text-sm">
            <Link href="/shop" className="text-[#1a1a1a]/60 hover:text-[#1a1a1a]">
              Shop
            </Link>
            <span className="text-[#1a1a1a]/30">/</span>
            <span className="text-[#1a1a1a]">{product.title}</span>
          </nav>
        </Container>
      </SectionWrapper>

      {/* Product Details */}
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="default">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Gallery - Using new component */}
            <ProductGallery
              images={images.map((img, idx) => ({
                id: `img-${idx}`,
                src: img.url,
                alt: img.altText || `${product.title} - Image ${idx + 1}`,
              }))}
              productTitle={product.title}
            />

            {/* Product Info */}
            <div className="space-y-6">
              {/* Vendor */}
              {product.vendor && (
                <Link 
                  href={`/shop?collection=${product.vendor.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors"
                >
                  {product.vendor}
                </Link>
              )}

              {/* Title */}
              <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">
                {product.title}
              </h1>

              {/* Price */}
              <div className="space-y-1">
                <p className="text-sm text-[#1a1a1a]/60">Sale price</p>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-semibold ${onSale ? 'text-[#f83a3a]' : 'text-[#1a1a1a]'}`}>
                    {selectedVariant ? formatPrice(selectedVariant.price) : formatPrice(product.priceRange.minVariantPrice)}
                  </span>
                  {selectedVariant?.compareAtPrice && (
                    <span className="text-lg text-[#1a1a1a]/50 line-through">
                      {formatPrice(selectedVariant.compareAtPrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Variant Options - Pill Style Selector */}
              {product.options.map((option) => {
                if (option.values.length <= 1 && option.values[0] === 'Default Title') {
                  return null
                }
                
                return (
                  <div key={option.id} className="space-y-3">
                    <label className="text-sm font-medium text-[#1a1a1a]">
                      {option.name}: <span className="font-normal text-[#1a1a1a]/70">{selectedOptions[option.name]}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => {
                        const isSelected = selectedOptions[option.name] === value
                        return (
                          <button
                            key={value}
                            onClick={() => handleOptionChange(option.name, value)}
                            className={`
                              px-5 py-2.5 text-sm rounded-full border-2 transition-all font-medium
                              ${isSelected
                                ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
                                : 'border-[#1a1a1a]/20 bg-white text-[#1a1a1a] hover:border-[#1a1a1a]/50'
                              }
                            `}
                            aria-pressed={isSelected}
                          >
                            {value}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-sm text-[#1a1a1a]/60">Quantity:</label>
                <div className="flex items-center gap-2 w-fit">
                  <div className="flex items-center border border-[#1a1a1a]/20 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-[#1a1a1a]/5 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-[#1a1a1a]/5 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 8H12M8 4V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {/* Add to Cart */}
                <button
                  onClick={handleCheckout}
                  disabled={!product.availableForSale || !selectedVariant?.availableForSale || checkoutLoading}
                  className="w-full py-4 px-6 bg-[#f0c417] text-[#1a1a1a] font-semibold text-base rounded-full hover:bg-[#e0b415] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading 
                    ? 'Processing...' 
                    : !product.availableForSale || !selectedVariant?.availableForSale
                      ? 'Sold Out'
                      : 'Add to cart'
                  }
                </button>
                
                {/* Buy with Shop Pay */}
                <button className="w-full py-4 px-6 bg-[#5a31f4] text-white font-semibold text-base rounded-full hover:bg-[#4a21e4] transition-colors flex items-center justify-center gap-2">
                  Buy with <span className="font-bold italic">Shop</span><span className="text-xs align-super">Pay</span>
                </button>
                
                {/* More payment options */}
                <button className="w-full text-center text-sm text-[#1a1a1a]/60 underline hover:text-[#1a1a1a] transition-colors">
                  More payment options
                </button>
              </div>

              {/* Product Accordions */}
              <div className="pt-6 border-t border-[#1a1a1a]/10">
                <ProductAccordion items={accordionItems} />
              </div>
            </div>
          </div>
        </Container>
      </SectionWrapper>
      
      {/* Scrolling Text Banner */}
      <ScrollingText
        text="One Lamp, Endless Inspiration"
        textSize="large"
        scrollingSpeed={6}
        textColor="#1a1a1a"
      />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <SectionWrapper spacing="md" background="muted">
          <Container maxWidth="default">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">
                You May Also Like
              </h2>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full border border-[#1a1a1a]/20 flex items-center justify-center hover:border-[#1a1a1a]/40 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full border border-[#1a1a1a]/20 flex items-center justify-center hover:border-[#1a1a1a]/40 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => {
                const relatedImages = relatedProduct.images?.edges?.map(e => e.node) || []
                const secondImage = relatedImages[1]?.url
                
                return (
                  <ProductCard
                    key={relatedProduct.id}
                    title={relatedProduct.title}
                    price={formatPrice(relatedProduct.priceRange.minVariantPrice)}
                    image={relatedProduct.featuredImage?.url || ''}
                    secondImage={secondImage}
                    imageAlt={relatedProduct.featuredImage?.altText || relatedProduct.title}
                    href={`/shop/${relatedProduct.handle}`}
                    vendor={relatedProduct.vendor}
                    vendorHref={relatedProduct.vendor ? `/shop?collection=${relatedProduct.vendor.toLowerCase().replace(/\s+/g, '-')}` : undefined}
                    transparentBackground={true}
                    showQuickAdd={false}
                  />
                )
              })}
            </div>
          </Container>
        </SectionWrapper>
      )}
    </main>
  )
}
