'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  formatPrice,
  type ShopifyProduct,
} from '@/lib/shopify/storefront-client'
import { useCart } from '@/lib/shop/CartContext'
import { SectionWrapper, Container, SectionHeader, Button } from '@/components/impact'

export interface StreetCollectorProductCarouselProps {
  title: string
  products: ShopifyProduct[]
  linkText?: string
  linkHref?: string
  className?: string
}

function ProductCard({
  product,
  onQuickAdd,
}: {
  product: ShopifyProduct
  onQuickAdd: (product: ShopifyProduct) => void
}) {
  const [isAdding, setIsAdding] = React.useState(false)
  const price = product.priceRange?.minVariantPrice
  const priceFormatted = price ? formatPrice(price) : ''
  const compareAt = product.compareAtPriceRange?.minVariantPrice?.amount
  const onSale = compareAt && parseFloat(compareAt) > parseFloat(price?.amount ?? '0')
  const images = product.images?.edges?.map((e) => e.node) ?? []
  const secondImage = images[1]?.url

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isAdding || !product.availableForSale) return
    setIsAdding(true)
    onQuickAdd(product)
    setTimeout(() => setIsAdding(false), 600)
  }

  return (
    <Link
      href={`/shop/${product.handle}`}
      className="group flex-shrink-0 w-[220px] sm:w-[260px]"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100 mb-3">
        {product.featuredImage && (
          <>
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText || product.title}
              className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
            />
            {secondImage && (
              <img
                src={secondImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            )}
          </>
        )}
        {product.availableForSale && (
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isAdding}
            className={cn(
              'absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full',
              'bg-[#047AFF] text-white text-sm font-medium',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
              'hover:bg-[#2340ac] disabled:opacity-70'
            )}
          >
            {isAdding ? 'Adding...' : '+ Quick add'}
          </button>
        )}
      </div>
      <div>
        {product.vendor && (
          <p className="text-sm text-neutral-600 mb-0.5">{product.vendor}</p>
        )}
        <h3 className="font-medium text-base mb-1 group-hover:underline">
          {product.title}
        </h3>
        <p className="font-semibold">
          {onSale && product.compareAtPriceRange?.minVariantPrice && (
            <span className="text-neutral-400 line-through mr-2">
              {formatPrice(product.compareAtPriceRange.minVariantPrice)}
            </span>
          )}
          {onSale ? 'Sale price ' : ''}{priceFormatted}
        </p>
      </div>
    </Link>
  )
}

export function StreetCollectorProductCarousel({
  title,
  products,
  linkText,
  linkHref,
  className,
}: StreetCollectorProductCarouselProps) {
  const cart = useCart()
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(true)

  const checkScrollState = React.useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return
    const amount = container.clientWidth * 0.75
    container.scrollTo({
      left: direction === 'left' ? container.scrollLeft - amount : container.scrollLeft + amount,
      behavior: 'smooth',
    })
  }

  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    checkScrollState()
    container.addEventListener('scroll', checkScrollState)
    window.addEventListener('resize', checkScrollState)
    return () => {
      container.removeEventListener('scroll', checkScrollState)
      window.removeEventListener('resize', checkScrollState)
    }
  }, [checkScrollState])

  const handleQuickAdd = React.useCallback(
    (product: ShopifyProduct) => {
      const variant = product.variants?.edges?.[0]?.node
      if (!variant) return
      cart.addItem({
        productId: product.id,
        variantId: variant.id,
        handle: product.handle,
        title: product.title,
        variantTitle: variant.title !== 'Default Title' ? variant.title : undefined,
        price: parseFloat(variant.price.amount),
        quantity: 1,
        image: product.featuredImage?.url,
        artistName: product.vendor,
      })
    },
    [cart]
  )

  if (products.length === 0) return null

  return (
    <SectionWrapper spacing="md" background="default" className={className}>
      <Container maxWidth="default" paddingX="gutter">
        <div className="flex items-center justify-between mb-6">
          <SectionHeader title={title} alignment="start" />
          <div className="flex items-center gap-4">
            {linkText && linkHref && (
              <Link href={linkHref}>
                <Button variant="outline" size="sm">
                  {linkText}
                </Button>
              </Link>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={cn(
                  'p-2 rounded-full border transition-all',
                  canScrollLeft
                    ? 'border-neutral-800 text-neutral-800 hover:bg-neutral-800 hover:text-white'
                    : 'border-neutral-300 text-neutral-300 cursor-not-allowed'
                )}
                aria-label="Scroll left"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={cn(
                  'p-2 rounded-full border transition-all',
                  canScrollRight
                    ? 'border-neutral-800 text-neutral-800 hover:bg-neutral-800 hover:text-white'
                    : 'border-neutral-300 text-neutral-300 cursor-not-allowed'
                )}
                aria-label="Scroll right"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden -mx-4 px-4 scrollbar-hide"
        >
          <div className="flex gap-6 pb-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        </div>
      </Container>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </SectionWrapper>
  )
}
