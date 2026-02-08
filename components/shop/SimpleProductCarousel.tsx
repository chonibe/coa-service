'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatPrice, type ShopifyProduct } from '@/lib/shopify/storefront-client'
import { SectionWrapper, Container, SectionHeader, Button } from '@/components/impact'

export interface SimpleProductCarouselProps {
  title?: string
  description?: string
  products: ShopifyProduct[]
  linkText?: string
  linkHref?: string
  className?: string
}

export function SimpleProductCarousel({
  title = 'Featured Products',
  description,
  products,
  linkText,
  linkHref,
  className,
}: SimpleProductCarouselProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(true)

  // Check scroll state
  const checkScrollState = React.useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }, [])

  // Scroll left/right
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.8
    const newPosition =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: newPosition,
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

  if (products.length === 0) return null

  return (
    <SectionWrapper spacing="md" background="muted" className={className}>
      <Container maxWidth="default" paddingX="gutter">
        <div className="flex items-center justify-between mb-6">
          <div>
            <SectionHeader
              title={title}
              subtitle={description}
              alignment="start"
            />
          </div>
          <div className="flex items-center gap-4">
            {linkText && linkHref && (
              <Link href={linkHref}>
                <Button variant="outline" size="sm">
                  {linkText}
                </Button>
              </Link>
            )}
            {/* Scroll Arrows */}
            <div className="flex gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={cn(
                  'p-2 rounded-full border-2 transition-all',
                  canScrollLeft
                    ? 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                    : 'border-gray-300 text-gray-300 cursor-not-allowed'
                )}
                aria-label="Scroll left"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={cn(
                  'p-2 rounded-full border-2 transition-all',
                  canScrollRight
                    ? 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                    : 'border-gray-300 text-gray-300 cursor-not-allowed'
                )}
                aria-label="Scroll right"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Product Cards */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden hide-scrollbar -mx-4 px-4"
        >
          <div className="flex gap-6 pb-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.handle}`}
                className="group flex-shrink-0 w-[280px] sm:w-[320px]"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-3">
                  {product.featuredImage && (
                    <img
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText || product.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-1 group-hover:underline">
                    {product.title}
                  </h3>
                  {product.vendor && (
                    <p className="text-sm text-gray-600 mb-2">{product.vendor}</p>
                  )}
                  <p className="font-semibold">
                    {formatPrice(product.priceRange.minVariantPrice)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </SectionWrapper>
  )
}
