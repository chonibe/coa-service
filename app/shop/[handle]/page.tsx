'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import {
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
  ProductCard,
  Stack,
  Inline,
  FlexContainer,
} from '@/components/impact'
import { ScrollingText } from '@/components/sections'
import { ScrollReveal } from '@/components/blocks'
import { VinylProductCard } from '@/components/shop'
import { useCart } from '@/lib/shop/CartContext'
import {
  ProductGallery,
  ProductAccordion,
  streetLampAccordionItems,
  artworkAccordionItems,
  StickyBuyBar,
  ProductSeriesInfo,
  EditionInfo,
} from './components'

// =============================================================================
// PAGE COMPONENT (Client-side for interactivity)
// =============================================================================

export default function ProductPage() {
  const params = useParams<{ handle: string }>()
  const cart = useCart()
  const [product, setProduct] = useState<ShopifyProduct | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ShopifyProductVariant | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartButtonState, setCartButtonState] = useState<'idle' | 'loading' | 'success'>('idle')
  const [relatedProducts, setRelatedProducts] = useState<ShopifyProduct[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [seriesInfo, setSeriesInfo] = useState<any>(null)
  const [editionInfo, setEditionInfo] = useState<any>(null)
  const [collectorProgress, setCollectorProgress] = useState<any>(null)
  
    // For sticky buy bar
  const buyButtonRef = useRef<HTMLButtonElement>(null)

  // For carousel scrolling
  const carouselRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

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
        setSeriesInfo(data.seriesInfo || null)
        setEditionInfo(data.editionInfo || null)
        setCollectorProgress(data.collectorProgress || null)
        
        // Debug logging
        console.log('Product data loaded:', {
          hasSeriesInfo: !!data.seriesInfo,
          seriesInfo: data.seriesInfo,
          hasEditionInfo: !!data.editionInfo,
          editionInfo: data.editionInfo,
          hasCollectorProgress: !!data.collectorProgress
        })
        
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
        
        // Fetch related products from the same collection/vendor
        const relatedResponse = await fetch(`/api/shop/products?limit=8&exclude=${params?.handle}`)
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json()
          setRelatedProducts(relatedData.products || [])
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProduct()
  }, [params?.handle])

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

  // Handle add to cart with enhanced states
  const handleAddToCart = () => {
    if (!selectedVariant || !product) return
    
    setCartButtonState('loading')
    setAddingToCart(true)
    
    // Add to cart using context
    cart.addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      handle: product.handle,
      title: product.title,
      variantTitle: selectedVariant.title !== 'Default Title' ? selectedVariant.title : undefined,
      price: parseFloat(selectedVariant.price.amount),
      quantity,
      image: selectedVariant.image?.url || product.featuredImage?.url,
      artistName: product.vendor,
    })
    
    // Show success state
    setTimeout(() => {
      setCartButtonState('success')
      setAddingToCart(false)
    }, 400)
    
    // Return to idle after showing success
    setTimeout(() => {
      setCartButtonState('idle')
    }, 2000)
  }

  // Carousel scroll handlers
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return
    const scrollAmount = carouselRef.current.clientWidth * 0.8
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  // Touch swipe handlers for carousel
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      scrollCarousel('right')
    } else if (isRightSwipe) {
      scrollCarousel('left')
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
              <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-4">
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
  
  // Determine if this is the Street Lamp product
  const isStreetLamp = params?.handle === 'street_lamp'
  
  // Get appropriate accordion items
  const accordionItems = isStreetLamp ? streetLampAccordionItems : artworkAccordionItems

  return (
    <main className="min-h-screen bg-white">
      {/* Sticky Buy Bar */}
      <StickyBuyBar
        productTitle={product.title}
        price={selectedVariant ? formatPrice(selectedVariant.price) : formatPrice(product.priceRange.minVariantPrice)}
        compareAtPrice={selectedVariant?.compareAtPrice ? formatPrice(selectedVariant.compareAtPrice) : undefined}
        image={selectedVariant?.image?.url || product.featuredImage?.url}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
        disabled={!product.availableForSale || !selectedVariant?.availableForSale}
        loading={addingToCart}
        targetElementId="main-add-to-cart"
      />
      
      {/* Product Details */}
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="default">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Gallery */}
            <ProductGallery
              images={images.map((img, idx) => ({
                id: `img-${idx}`,
                src: img.url,
                alt: img.altText || `${product.title} - Image ${idx + 1}`,
              }))}
              productTitle={product.title}
            />

            {/* Product Info */}
            <ScrollReveal animation="fadeUp" duration={0.6}>
            <div className="space-y-6">
              {/* Vendor/Artist link */}
              {product.vendor && (
                <Link 
                  href={`/shop/artists/${encodeURIComponent(product.vendor.toLowerCase().replace(/\s+/g, '-'))}`}
                  className="text-sm text-[#1a1a1a]/60 hover:text-[#2c4bce] transition-colors uppercase tracking-wider"
                >
                  {product.vendor}
                </Link>
              )}

              {/* Title */}
              <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">
                {product.title}
              </h1>

              {/* Series Info */}
              {seriesInfo && (
                <ProductSeriesInfo 
                  series={seriesInfo}
                  collectorProgress={collectorProgress}
                />
              )}

              {/* Edition Info */}
              {editionInfo && (editionInfo.edition_size || editionInfo.total_editions) && (
                <EditionInfo
                  editionSize={editionInfo.edition_size}
                  totalEditions={editionInfo.total_editions}
                />
              )}

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

              {/* Stock Status & Shipping Info */}
              <div className="space-y-2 text-sm">
                {/* Stock status */}
                {product.availableForSale && selectedVariant?.availableForSale && (
                  <div className="flex items-center gap-2 text-[#0a8754]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.3337 4L6.00033 11.3333L2.66699 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>In stock</span>
                  </div>
                )}
                {!product.availableForSale && (
                  <div className="flex items-center gap-2 text-[#f83a3a]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 4V8M8 11H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Out of stock</span>
                  </div>
                )}
                
                {/* Shipping info */}
                <p className="text-[#1a1a1a]/60">
                  Free shipping on orders over $75
                </p>
                
                {/* SKU */}
                {selectedVariant?.sku && (
                  <p className="text-[#1a1a1a]/50">
                    SKU: {selectedVariant.sku}
                  </p>
                )}
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
                {/* Add to Cart - Enhanced with state transitions */}
                <button
                  ref={buyButtonRef}
                  id="main-add-to-cart"
                  onClick={handleAddToCart}
                  disabled={!product.availableForSale || !selectedVariant?.availableForSale || cartButtonState !== 'idle'}
                  className={`
                    w-full py-4 px-6 font-semibold text-base rounded-full 
                    flex items-center justify-center gap-2 min-h-[44px]
                    transition-all duration-300 ease-out
                    disabled:cursor-not-allowed
                    ${cartButtonState === 'idle' && 'bg-[#f0c417] text-[#1a1a1a] hover:bg-[#e0b415] active:scale-[0.98]'}
                    ${cartButtonState === 'loading' && 'bg-[#f0c417] text-[#1a1a1a] scale-[0.98]'}
                    ${cartButtonState === 'success' && 'bg-[#0a8754] text-white scale-105'}
                    ${(!product.availableForSale || !selectedVariant?.availableForSale) && 'opacity-50'}
                  `}
                >
                  {cartButtonState === 'loading' && (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  )}
                  
                  {cartButtonState === 'success' && (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-in zoom-in duration-200">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Added to cart!
                    </>
                  )}
                  
                  {cartButtonState === 'idle' && (
                    <>
                      {!product.availableForSale || !selectedVariant?.availableForSale ? (
                        'Sold Out'
                      ) : (
                        'Add to cart'
                      )}
                    </>
                  )}
                </button>
                
                {/* Tax & Shipping Notice */}
                <p className="text-xs text-center text-[#1a1a1a]/60">
                  Taxes and shipping calculated at checkout
                </p>
              </div>

              {/* Product Accordions */}
              <div className="pt-6 border-t border-[#1a1a1a]/10">
                <ProductAccordion items={accordionItems} />
              </div>
            </div>
            </ScrollReveal>
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

      {/* You May Also Like - Scrollable Carousel */}
      {relatedProducts.length > 0 && (
        <SectionWrapper spacing="md" background="muted">
          <Container maxWidth="default">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">
                You May Also Like
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollCarousel('left')}
                  className="w-10 h-10 rounded-full border border-[#1a1a1a]/20 flex items-center justify-center hover:border-[#1a1a1a]/40 hover:bg-[#1a1a1a]/5 transition-colors"
                  aria-label="Scroll left"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button 
                  onClick={() => scrollCarousel('right')}
                  className="w-10 h-10 rounded-full border border-[#1a1a1a]/20 flex items-center justify-center hover:border-[#1a1a1a]/40 hover:bg-[#1a1a1a]/5 transition-colors"
                  aria-label="Scroll right"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Scrollable carousel */}
            <div 
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory touch-pan-x"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {relatedProducts.map((relatedProduct, index) => {
                return (
                  <div key={relatedProduct.id} className="flex-shrink-0 w-[calc(50%-12px)] lg:w-[calc(25%-18px)] snap-start">
                    <ScrollReveal animation="fadeUp" delay={index * 0.05} duration={0.5}>
                      <VinylProductCard
                        product={relatedProduct}
                        onQuickAdd={() => {
                          const variant = relatedProduct.variants.edges[0]?.node
                          if (variant) {
                            cart.addItem({
                              productId: relatedProduct.id,
                              variantId: variant.id,
                              handle: relatedProduct.handle,
                              title: relatedProduct.title,
                              price: parseFloat(variant.price.amount),
                              quantity: 1,
                              image: relatedProduct.featuredImage?.url,
                              artistName: relatedProduct.vendor,
                            })
                          }
                        }}
                        enableTilt={true}
                        enableFlip={false}
                      />
                    </ScrollReveal>
                  </div>
                )
              })}
            </div>
            
            {/* View all link */}
            <div className="mt-8 text-center">
              <Link href="/shop">
                <Button variant="outline">View All Artworks</Button>
              </Link>
            </div>
          </Container>
        </SectionWrapper>
      )}
    </main>
  )
}
