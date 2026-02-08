/**
 * Crate Digging Carousel
 * 
 * Vinyl record crate browsing experience:
 * - Draggable with momentum/inertia
 * - Cards fan out in 3D like records in a crate
 * - Flick gesture support
 * - Snap to center with spring physics
 * - Card depth and scale based on position
 * 
 * @example
 * ```tsx
 * <CrateDiggingCarousel
 *   products={products}
 *   onProductSelect={(product) => console.log(product)}
 * />
 * ```
 */

'use client'

import * as React from 'react'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useCrateCarousel } from '@/lib/animations/gsap-hooks-enhanced'
import { formatPrice, type ShopifyProduct } from '@/lib/shopify/storefront-client'

export interface CrateDiggingCarouselProps {
  products: ShopifyProduct[]
  /** Initial active product index */
  initialIndex?: number
  /** Callback when product becomes active */
  onProductSelect?: (product: ShopifyProduct, index: number) => void
  /** Enable infinite loop */
  infinite?: boolean
  /** Show navigation arrows */
  showArrows?: boolean
  /** Show dots indicator */
  showDots?: boolean
  className?: string
}

export function CrateDiggingCarousel({
  products,
  initialIndex = 0,
  onProductSelect,
  infinite = true,
  showArrows = true,
  showDots = false,
  className,
}: CrateDiggingCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  const handleIndexChange = (index: number) => {
    setActiveIndex(index)
    if (onProductSelect && products[index]) {
      onProductSelect(products[index], index)
    }
  }

  const { containerRef, goToIndex, next, prev } = useCrateCarousel({
    itemCount: products.length,
    initialIndex,
    onIndexChange: handleIndexChange,
    infinite,
  })

  return (
    <div className={cn('relative py-12', className)}>
      {/* Carousel Container */}
      <div className="relative h-[500px] flex items-center justify-center overflow-visible">
        <div
          ref={containerRef}
          className="relative w-full h-full"
          style={{
            perspective: '1500px',
            transformStyle: 'preserve-3d',
          }}
        >
          {products.map((product, index) => (
            <CrateCard
              key={product.id}
              product={product}
              index={index}
              isActive={index === activeIndex}
              onClick={() => goToIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-[#f0c417] transition-colors group"
            aria-label="Previous"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:stroke-[#1a1a1a]"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-[#f0c417] transition-colors group"
            aria-label="Next"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:stroke-[#1a1a1a]"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === activeIndex
                  ? 'bg-[#f0c417] w-8'
                  : 'bg-[#1a1a1a]/20 hover:bg-[#1a1a1a]/40'
              )}
              aria-label={`Go to product ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="text-center mt-6">
        <p className="text-sm text-[#1a1a1a]/60">
          <span className="hidden md:inline">Drag or use arrow keys to browse</span>
          <span className="md:hidden">Swipe to browse</span>
        </p>
      </div>
    </div>
  )
}

/**
 * Individual crate card
 */
interface CrateCardProps {
  product: ShopifyProduct
  index: number
  isActive: boolean
  onClick: () => void
}

function CrateCard({ product, index, isActive, onClick }: CrateCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const price = product.priceRange?.minVariantPrice
    ? formatPrice(product.priceRange.minVariantPrice)
    : null

  const image = product.featuredImage?.url || product.images?.edges?.[0]?.node?.url

  return (
    <div
      ref={cardRef}
      data-index={index}
      className={cn(
        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'cursor-pointer transition-all duration-300',
        'will-change-transform',
        isActive && 'z-10'
      )}
      style={{
        width: '280px',
        transformStyle: 'preserve-3d',
      }}
      onClick={onClick}
    >
      {/* Card Shadow/Glow */}
      {isActive && (
        <div className="absolute -inset-4 bg-[#f0c417]/20 blur-2xl rounded-3xl -z-10" />
      )}

      {/* Card Container */}
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden bg-white shadow-2xl',
          'border-4 border-white',
          isActive && 'ring-4 ring-[#f0c417] ring-offset-2'
        )}
      >
        {/* Image */}
        <div className="relative aspect-square bg-[#f5f5f5]">
          {image ? (
            <img
              src={image}
              alt={product.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#1a1a1a]/30">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}

          {/* Vinyl Badge */}
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 bg-white">
          {/* Artist/Vendor */}
          {product.vendor && (
            <p className="text-xs text-[#1a1a1a]/60 uppercase tracking-wider mb-1">
              {product.vendor}
            </p>
          )}

          {/* Title */}
          <h3 className="font-heading text-base font-semibold text-[#1a1a1a] tracking-[-0.02em] line-clamp-2 mb-2">
            {product.title}
          </h3>

          {/* Price */}
          {price && (
            <p className="text-lg font-semibold text-[#1a1a1a]">
              {price}
            </p>
          )}

          {/* View Details Link (only on active card) */}
          {isActive && (
            <Link
              href={`/shop/${product.handle}`}
              className="mt-3 w-full py-2 px-4 bg-[#f0c417] text-[#1a1a1a] font-semibold text-sm rounded-full text-center block hover:bg-[#e0b415] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              View Details
            </Link>
          )}
        </div>
      </div>

      {/* Card Number Badge */}
      <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-xs font-bold shadow-lg">
        {index + 1}
      </div>
    </div>
  )
}

/**
 * Simple variant without 3D effects for better mobile performance
 */
export function CrateDiggingCarouselSimple({
  products,
  className,
}: Pick<CrateDiggingCarouselProps, 'products' | 'className'>) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length)
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)
  }

  const currentProduct = products[currentIndex]

  if (!currentProduct) return null

  const image = currentProduct.featuredImage?.url || currentProduct.images?.edges?.[0]?.node?.url
  const price = currentProduct.priceRange?.minVariantPrice
    ? formatPrice(currentProduct.priceRange.minVariantPrice)
    : null

  return (
    <div className={cn('relative py-8', className)}>
      <div className="max-w-md mx-auto">
        {/* Card */}
        <div className="relative rounded-2xl overflow-hidden bg-white shadow-xl border-4 border-white">
          <div className="relative aspect-square bg-[#f5f5f5]">
            {image && (
              <img
                src={image}
                alt={currentProduct.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="p-6">
            {currentProduct.vendor && (
              <p className="text-xs text-[#1a1a1a]/60 uppercase tracking-wider mb-1">
                {currentProduct.vendor}
              </p>
            )}
            <h3 className="font-heading text-xl font-semibold text-[#1a1a1a] mb-2">
              {currentProduct.title}
            </h3>
            {price && (
              <p className="text-lg font-semibold text-[#1a1a1a] mb-4">
                {price}
              </p>
            )}
            <Link
              href={`/shop/${currentProduct.handle}`}
              className="w-full py-3 px-6 bg-[#f0c417] text-[#1a1a1a] font-semibold rounded-full text-center block hover:bg-[#e0b415] transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={prev}
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-[#f0c417] transition-colors"
            aria-label="Previous"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <span className="text-sm text-[#1a1a1a]/60">
            {currentIndex + 1} / {products.length}
          </span>

          <button
            onClick={next}
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-[#f0c417] transition-colors"
            aria-label="Next"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CrateDiggingCarousel
