'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  formatPrice,
  isOnSale,
  type ShopifyProduct,
  type ShopifyProductVariant,
} from '@/lib/shopify/storefront-client'
import {
  Container,
  SectionWrapper,
  Button,
} from '@/components/impact'
import { ScrollingText } from '@/components/sections'
import { ScrollReveal } from '@/components/blocks'
import { VinylProductCard } from '@/components/shop'
import { useCart } from '@/lib/shop/CartContext'
import { trackViewItem, trackAddToCart } from '@/lib/google-analytics'
import { storefrontProductToItem } from '@/lib/analytics-ecommerce'
import { ProductCreditsCallout } from '@/components/shop/ProductCreditsCallout'
import { buildProductFaqPairs } from '@/lib/seo/product-faqs'
import { buildProductImageAlt } from '@/lib/seo/product-image-alt'
import { buildProductAnswerFirst } from '@/lib/seo/product-meta'
import {
  ProductGallery,
  ProductAccordion,
  streetLampAccordionItems,
  artworkAccordionItems,
  type AccordionItem,
  StickyBuyBar,
  ProductSeriesInfo,
  EditionInfo,
} from './components'
import { cn } from '@/lib/utils'
import { CollectorStoreTopChrome } from '@/components/shop/CollectorStoreTopChrome'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import { getStreetLampProductHandle, streetLampProductPath } from '@/lib/shop/street-lamp-handle'
import { getStreetPricingStageDisplay } from '@/lib/shop/street-collector-pricing-stages'
import type { StreetPricingStageKey } from '@/lib/shop/street-collector-pricing-stages'
import {
  ladderStageColumnClass,
  ladderStageShortLabel,
} from '@/lib/shop/collector-ladder-styles'

// =============================================================================
// PAGE COMPONENT (Client-side for interactivity)
// =============================================================================

export default function ProductPage() {
  const params = useParams<{ handle: string }>()
  const cart = useCart()
  const { shippingPromo, shippingPromoReady } = cart
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
  const [artistAvatarUrl, setArtistAvatarUrl] = useState<string | null>(null)
  const [moreFromArtist, setMoreFromArtist] = useState<ShopifyProduct[]>([])
  const [ownedProductHandles, setOwnedProductHandles] = useState<string[]>([])
  const [editionLadderRow, setEditionLadderRow] = useState<{
    productId: string
    editionsSold: number
    editionTotal: number | null
    season: 1 | 2
    stageKey: StreetPricingStageKey
    priceUsd: number | null
    label: string
    subcopy: string
    nextBump:
      | { kind: 'price_rise'; nextPriceUsd: number; afterSales: number }
      | { kind: 'edition_end'; afterSales: number }
      | null
  } | null>(null)
  const [watchlistBusy, setWatchlistBusy] = useState(false)
  const [watchlistHint, setWatchlistHint] = useState<string | null>(null)

  // For sticky buy bar
  const buyButtonRef = useRef<HTMLButtonElement>(null)

  // For carousel scrolling
  const carouselRef = useRef<HTMLDivElement>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchEndXRef = useRef<number | null>(null)
  const touchEndYRef = useRef<number | null>(null)

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
        setArtistAvatarUrl(data.artistAvatarUrl || null)
        setMoreFromArtist(data.moreFromArtist || [])
        setOwnedProductHandles(data.ownedProductIds || [])
        
        // Set default variant
        if (data.product.variants?.edges?.length > 0) {
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

  useEffect(() => {
    if (!product) {
      setEditionLadderRow(null)
      return
    }
    const lamp = getStreetLampProductHandle().toLowerCase()
    const h = product.handle?.toLowerCase() ?? ''
    if (h === lamp || h.startsWith('street-lamp')) {
      setEditionLadderRow(null)
      return
    }
    const id = normalizeShopifyProductId(product.id)
    if (!id) {
      setEditionLadderRow(null)
      return
    }
    let cancelled = false
    fetch(`/api/shop/edition-states?ids=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data: { items?: Array<NonNullable<typeof editionLadderRow>> }) => {
        if (cancelled) return
        const row = data.items?.[0] ?? null
        setEditionLadderRow(row ?? null)
      })
      .catch(() => {
        if (!cancelled) setEditionLadderRow(null)
      })
    return () => {
      cancelled = true
    }
  }, [product])

  // Update selected variant when options change
  useEffect(() => {
    if (!product) return

    const matchingVariant = product.variants?.edges?.find(({ node }) => {
      return node.selectedOptions.every(
        (opt) => selectedOptions[opt.name] === opt.value
      )
    })

    if (matchingVariant) {
      setSelectedVariant(matchingVariant.node)
    }
  }, [selectedOptions, product])

  // E-commerce: track view_item when product is loaded (stage: pdp)
  useEffect(() => {
    if (!product || !selectedVariant) return
    const item = storefrontProductToItem(product, selectedVariant, 1)
    trackViewItem({ ...item, item_list_name: 'pdp' })
  }, [product?.id, selectedVariant?.id])

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

    // E-commerce: track add_to_cart (stage: pdp)
    const item = storefrontProductToItem(product, selectedVariant, quantity)
    trackAddToCart({ ...item, item_list_name: 'pdp' })

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

  const handleSaveWatchlist = async () => {
    if (!product || !editionLadderRow) return
    setWatchlistHint(null)
    setWatchlistBusy(true)
    try {
      const id = normalizeShopifyProductId(product.id)
      const r = await fetch('/api/shop/watchlist', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopify_product_id: id,
          stage: 'early',
          product_title: product.title,
          product_handle: product.handle,
          artist_name: product.vendor,
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setWatchlistHint(typeof data.error === 'string' ? data.error : 'Could not save watchlist')
        return
      }
      setWatchlistHint('Saved to watchlist')
    } catch {
      setWatchlistHint('Network error')
    } finally {
      setWatchlistBusy(false)
    }
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
    const touch = e.targetTouches[0]
    touchStartXRef.current = touch.clientX
    touchStartYRef.current = touch.clientY
    touchEndXRef.current = null
    touchEndYRef.current = null
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0]
    touchEndXRef.current = touch.clientX
    touchEndYRef.current = touch.clientY
  }

  const onTouchEnd = () => {
    const startX = touchStartXRef.current
    const endX = touchEndXRef.current
    const startY = touchStartYRef.current
    const endY = touchEndYRef.current
    if (startX == null || endX == null || startY == null || endY == null) return

    const deltaX = startX - endX
    const deltaY = startY - endY

    // Only treat as carousel swipe when horizontal intent is clear.
    if (Math.abs(deltaX) < minSwipeDistance || Math.abs(deltaX) <= Math.abs(deltaY)) return

    const isLeftSwipe = deltaX > 0
    const isRightSwipe = deltaX < 0

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

  const images = product.images?.edges?.map(({ node }) => node) || []
  const onSale = isOnSale(product)
  
  // Determine if this is the Street Lamp product
  const lampHandleLower = getStreetLampProductHandle().toLowerCase()
  const isStreetLamp =
    product.handle.toLowerCase() === lampHandleLower ||
    product.handle.toLowerCase().startsWith('street-lamp')
  
  const seoFaqAccordionItems: AccordionItem[] = buildProductFaqPairs(product).map((f, i) => ({
    id: `seo-faq-${i}`,
    title: f.question,
    content: (
      <p className="text-[#1a1a1a]/80 text-sm leading-relaxed max-w-prose">
        {f.answer}
      </p>
    ),
    defaultOpen: i === 0,
  }))

  const accordionItems = isStreetLamp
    ? [...seoFaqAccordionItems, ...streetLampAccordionItems]
    : [...seoFaqAccordionItems, ...artworkAccordionItems]

  return (
    <main className="min-h-screen bg-white dark:bg-[#171515]">
      {!isStreetLamp ? (
        <>
          <CollectorStoreTopChrome />
          <div className="h-[calc(5.5rem+env(safe-area-inset-top,0px))] md:h-[calc(6rem+env(safe-area-inset-top,0px))]" />
        </>
      ) : null}
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
                alt: buildProductImageAlt(product.title, product.vendor, img.altText),
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
                  className="text-sm text-[#1a1a1a]/60 hover:text-[#047AFF] transition-colors uppercase tracking-wider"
                >
                  {product.vendor}
                </Link>
              )}

              {/* Title */}
              <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">
                {product.title}
              </h1>
              <p className="text-sm text-[#1a1a1a]/75 leading-relaxed max-w-prose">
                {buildProductAnswerFirst(product)}
              </p>

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

              {!isStreetLamp && editionLadderRow && editionLadderRow.priceUsd != null ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs text-stone-600 dark:text-[#FFBA94]/75">
                    {ladderStageShortLabel(editionLadderRow.stageKey)} tier
                    {(() => {
                      const gf = getStreetPricingStageDisplay(editionLadderRow.season, 0).priceUsd
                      return gf != null && gf !== editionLadderRow.priceUsd ? (
                        <span>{` · was $${gf} at ground floor`}</span>
                      ) : null
                    })()}
                  </p>
                  {editionLadderRow.editionTotal != null ? (
                    <p className="mt-1 text-sm text-stone-800 dark:text-[#FFBA94]/90">
                      {editionLadderRow.editionsSold} / {editionLadderRow.editionTotal} sold
                      {editionLadderRow.nextBump?.kind === 'price_rise' ? (
                        <span className="text-stone-600 dark:text-[#FFBA94]/70">{` · next step at ${editionLadderRow.nextBump.afterSales} sold`}</span>
                      ) : null}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={watchlistBusy}
                      onClick={() => void handleSaveWatchlist()}
                      className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-white dark:border-white/20 dark:text-[#FFBA94] dark:hover:bg-white/10"
                    >
                      {watchlistBusy ? 'Saving…' : '♡ Add to watchlist'}
                    </button>
                    <Link
                      href="/shop/reserve"
                      className="inline-flex items-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white dark:bg-[#FFBA94] dark:text-[#171515]"
                    >
                      Join the Reserve
                    </Link>
                  </div>
                  {watchlistHint ? (
                    <p className="mt-2 text-xs text-stone-600 dark:text-[#FFBA94]/70">{watchlistHint}</p>
                  ) : null}
                </div>
              ) : null}

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
                
                {/* Shipping info — matches Stripe Checkout when promo settings load */}
                <p className="text-[#1a1a1a]/60">
                  {shippingPromoReady ? (
                    shippingPromo.shippingFreeOver70 ? (
                      `Free standard shipping on orders $${shippingPromo.freeOverUsd}+; $${shippingPromo.standardUnderUsd} standard shipping below.`
                    ) : (
                      'Free standard shipping on all orders.'
                    )
                  ) : (
                    'Shipping options are confirmed at checkout.'
                  )}
                </p>
                
                {/* SKU */}
                {selectedVariant?.sku && (
                  <p className="text-[#1a1a1a]/50">
                    SKU: {selectedVariant.sku}
                  </p>
                )}
              </div>

              {/* Variant Options - Pill Style Selector */}
              {product.options?.map((option) => {
                if (!option.values || (option.values.length <= 1 && option.values[0] === 'Default Title')) {
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

              {/* Credits Callout */}
              {selectedVariant && (
                <ProductCreditsCallout
                  price={parseFloat(selectedVariant.price?.amount || '0')}
                  className="mt-2"
                />
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {/* Add to Cart + Wishlist row */}
                <div className="flex items-center gap-3">
                <button
                  ref={buyButtonRef}
                  id="main-add-to-cart"
                  onClick={handleAddToCart}
                  disabled={!product.availableForSale || !selectedVariant?.availableForSale || cartButtonState !== 'idle'}
                  className={`
                    flex-1 py-4 px-6 font-semibold text-base rounded-full 
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
                
                </div>
                
                {/* Tax & Shipping Notice */}
                <p className="text-xs text-center text-[#1a1a1a]/60">
                  Taxes and shipping calculated at checkout
                </p>
              </div>

              {!isStreetLamp && editionLadderRow ? (
                <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-[#201c1c]/90">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-[#FFBA94]/60">
                    Where this edition sits on the ladder
                  </p>
                  <div className="flex gap-1">
                    {(
                      [
                        'ground_floor',
                        'rising',
                        'established',
                        'final',
                        'archive',
                      ] as StreetPricingStageKey[]
                    ).map((key) => {
                      const season = editionLadderRow.season
                      const sold = editionLadderRow.editionsSold
                      const cur = getStreetPricingStageDisplay(season, sold)
                      const here = cur.stageKey === key
                      const step = getStreetPricingStageDisplay(
                        season,
                        key === 'ground_floor'
                          ? 0
                          : key === 'rising'
                            ? 30
                            : key === 'established'
                              ? 60
                              : key === 'final'
                                ? 80
                                : 90
                      )
                      return (
                        <div
                          key={key}
                          className={cn(
                            'flex min-h-[40px] flex-1 flex-col items-center justify-center rounded-md px-0.5 text-center sm:min-h-[44px]',
                            ladderStageColumnClass(key),
                            here && 'ring-2 ring-stone-900 ring-offset-2 dark:ring-[#FFBA94] dark:ring-offset-[#171515]'
                          )}
                        >
                          <span className="text-[8px] font-medium uppercase leading-tight sm:text-[9px]">
                            {ladderStageShortLabel(key)}
                            {here ? ' · you' : ''}
                          </span>
                          <span className="text-[11px] font-semibold sm:text-xs">
                            {step.priceUsd != null ? `$${step.priceUsd}` : '—'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs leading-relaxed text-stone-600 dark:text-[#FFBA94]/75">
                    {editionLadderRow.subcopy}
                  </p>
                </div>
              ) : null}

              {!isStreetLamp ? (
                <div className="rounded-xl border-l-2 border-stone-900 bg-stone-100/80 px-4 py-3 dark:border-[#FFBA94] dark:bg-white/5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-[#FFBA94]/60">
                    Reserve members
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-800 dark:text-[#FFBA94]/90">
                    Lock ground-floor pricing while your tier allows, and use monthly drop credit at checkout.{' '}
                    <Link href="/shop/reserve" className="font-medium text-[#047AFF] underline-offset-2 hover:underline dark:text-sky-400">
                      Learn about the Reserve
                    </Link>
                  </p>
                </div>
              ) : null}

              {/* Product Accordions */}
              <div className="pt-6 border-t border-[#1a1a1a]/10">
                <ProductAccordion items={accordionItems} />
              </div>
            </div>
            </ScrollReveal>
          </div>
        </Container>
      </SectionWrapper>
      
      {/* More from this Artist */}
      {moreFromArtist.length > 0 && product.vendor && (
        <SectionWrapper spacing="md" background="default">
          <Container maxWidth="default">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">
                More from {product.vendor}
              </h2>
              <Link
                href={`/shop/artists/${encodeURIComponent(product.vendor.toLowerCase().replace(/\s+/g, '-'))}`}
                className="text-sm font-medium text-[#047AFF] hover:underline flex items-center gap-1"
              >
                View all
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {moreFromArtist.map((artistProduct, index) => {
                const isOwned = ownedProductHandles.includes(artistProduct.handle)
                return (
                  <ScrollReveal key={artistProduct.id} animation="fadeUp" delay={index * 0.05} duration={0.5}>
                    <VinylProductCard
                      product={artistProduct}
                      artistAvatarUrl={artistAvatarUrl}
                      isInCollection={isOwned}
                      trackStage="pdp"
                      onQuickAdd={() => {
                        const variant = artistProduct.variants?.edges?.[0]?.node
                        if (variant) {
                          cart.addItem({
                            productId: artistProduct.id,
                            variantId: variant.id,
                            handle: artistProduct.handle,
                            title: artistProduct.title,
                            price: parseFloat(variant.price.amount),
                            quantity: 1,
                            image: artistProduct.featuredImage?.url,
                            artistName: artistProduct.vendor,
                          })
                        }
                      }}
                      enableTilt={true}
                      enableFlip={false}
                    />
                  </ScrollReveal>
                )
              })}
            </div>
          </Container>
        </SectionWrapper>
      )}

      {/* Lamp cross-sell — demoted for edition PDPs */}
      {!isStreetLamp ? (
        <SectionWrapper spacing="sm" background="muted">
          <Container maxWidth="default">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white/90 p-5 dark:border-white/10 dark:bg-[#201c1c]/80">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-[#FFBA94]/60">
                  Need a display
                </p>
                <p className="mt-1 text-sm text-stone-800 dark:text-[#FFBA94]/90">
                  Most collectors own a Street Lamp to light their editions. Swap prints in seconds.
                </p>
              </div>
              <Link
                href={streetLampProductPath()}
                className="text-sm font-semibold text-[#047AFF] underline-offset-2 hover:underline dark:text-sky-400"
              >
                Shop the lamp — from $149
              </Link>
            </div>
          </Container>
        </SectionWrapper>
      ) : (
        <ScrollingText
          text="One Lamp, Endless Inspiration"
          textSize="large"
          scrollingSpeed={6}
          textColor="#1a1a1a"
        />
      )}

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
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory touch-manipulation"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {relatedProducts.map((relatedProduct, index) => {
                const isOwned = ownedProductHandles.includes(relatedProduct.handle)
                return (
                  <div key={relatedProduct.id} className="flex-shrink-0 w-[calc(50%-12px)] lg:w-[calc(25%-18px)] snap-start">
                    <ScrollReveal animation="fadeUp" delay={index * 0.05} duration={0.5}>
                      <VinylProductCard
                        product={relatedProduct}
                        isInCollection={isOwned}
                        trackStage="pdp"
                        onQuickAdd={() => {
                          const variant = relatedProduct.variants?.edges?.[0]?.node
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
