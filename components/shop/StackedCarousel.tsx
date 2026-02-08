/**
 * Stacked Carousel
 * 
 * Card stack carousel inspired by Osmo design:
 * - Active card centered and flat
 * - Cards behind rotate outward (like fanned playing cards)
 * - Navigation buttons below carousel
 * - Draggable with momentum
 * - Decorative circle background
 * 
 * @example
 * ```tsx
 * <StackedCarousel
 *   title="Best Sellers"
 *   description="Access everything with a single membership:"
 *   products={products}
 * />
 * ```
 */

'use client'

import * as React from 'react'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { gsap, Draggable } from '@/lib/animations/gsap-config'
import { useGSAP } from '@gsap/react'
import { formatPrice, type ShopifyProduct } from '@/lib/shopify/storefront-client'

export interface StackedCarouselProps {
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  products: ShopifyProduct[]
  /** Initial active product index */
  initialIndex?: number
  /** Callback when active product changes */
  onProductChange?: (product: ShopifyProduct, index: number) => void
  /** Card rotation angle for inactive cards (degrees) */
  rotationAngle?: number
  className?: string
}

export function StackedCarousel({
  title,
  description,
  products,
  initialIndex = 0,
  onProductChange,
  rotationAngle = 20,
  className,
}: StackedCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])

  const goToIndex = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(products.length - 1, index))
    setActiveIndex(clampedIndex)
    if (onProductChange && products[clampedIndex]) {
      onProductChange(products[clampedIndex], clampedIndex)
    }
    updateCardPositions(clampedIndex)
  }

  const updateCardPositions = (centerIndex: number) => {
    cardsRef.current.forEach((card, index) => {
      if (!card) return

      const offset = index - centerIndex
      
      // Active card: centered, no rotation, full size
      if (offset === 0) {
        gsap.to(card, {
          x: '-50%',
          y: 0,
          rotate: 0,
          scale: 1,
          zIndex: 10,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
        })
      }
      // Cards to the right - arc upward
      else if (offset > 0) {
        const rotation = Math.min(offset * rotationAngle, rotationAngle * 2)
        const zIndex = 10 - offset
        // Arc effect: cards move up and to the side
        const arcY = -Math.abs(offset) * 40 // Move up
        const arcX = offset * 60 // Move right
        
        gsap.to(card, {
          x: `calc(-50% + ${arcX}px)`,
          y: arcY,
          rotate: rotation,
          scale: Math.max(0.85, 1 - Math.abs(offset) * 0.08),
          zIndex: Math.max(1, zIndex),
          opacity: Math.max(0.6, 1 - Math.abs(offset) * 0.15),
          duration: 0.6,
          ease: 'power2.out',
        })
      }
      // Cards to the left - arc upward
      else {
        const rotation = Math.max(offset * rotationAngle, -rotationAngle * 2)
        const zIndex = 10 + offset
        // Arc effect: cards move up and to the side
        const arcY = -Math.abs(offset) * 40 // Move up
        const arcX = offset * 60 // Move left (negative)
        
        gsap.to(card, {
          x: `calc(-50% + ${arcX}px)`,
          y: arcY,
          rotate: rotation,
          scale: Math.max(0.85, 1 - Math.abs(offset) * 0.08),
          zIndex: Math.max(1, zIndex),
          opacity: Math.max(0.6, 1 - Math.abs(offset) * 0.15),
          duration: 0.6,
          ease: 'power2.out',
        })
      }
    })
  }

  // Initialize card positions
  useGSAP(() => {
    updateCardPositions(activeIndex)
  }, { dependencies: [activeIndex], scope: containerRef })

  // Setup draggable interaction
  useGSAP(() => {
    if (!containerRef.current) return

    const draggable = Draggable.create(containerRef.current, {
      type: 'x',
      inertia: true,
      bounds: { minX: -200, maxX: 200 },
      onDragEnd: function() {
        const dragDistance = this.x
        
        // Determine direction based on drag distance
        if (Math.abs(dragDistance) > 50) {
          if (dragDistance < 0) {
            next() // Dragged left, go to next
          } else {
            prev() // Dragged right, go to previous
          }
        }
        
        // Reset position
        gsap.to(containerRef.current, {
          x: 0,
          duration: 0.3,
          ease: 'power2.out',
        })
      },
    })

    return () => {
      draggable.forEach(d => d.kill())
    }
  }, { dependencies: [activeIndex], scope: containerRef })

  return (
    <section className={cn('relative py-16 lg:py-24 bg-white overflow-hidden', className)}>
      <div className="container mx-auto px-4">
        {/* Header Text */}
        {(title || description) && (
          <div className="text-center mb-12 lg:mb-16">
            {title && (
              <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-4">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-lg sm:text-xl text-[#1a1a1a]/70">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Decorative Circle Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
          <svg width="800" height="800" viewBox="0 0 800 800" fill="none">
            <circle cx="400" cy="400" r="350" stroke="currentColor" strokeWidth="1" />
            <circle cx="400" cy="400" r="300" stroke="currentColor" strokeWidth="1" />
            <circle cx="400" cy="400" r="250" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        {/* Cards Container */}
        <div
          ref={containerRef}
          className="relative h-[600px] flex items-center justify-center touch-pan-y cursor-grab active:cursor-grabbing"
          style={{ perspective: '1500px' }}
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              ref={(el) => {
                if (el) cardsRef.current[index] = el
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                width: '380px',
                transformStyle: 'preserve-3d',
                transformOrigin: 'center center',
              }}
              onClick={() => goToIndex(index)}
            >
              <StackCard
                product={product}
                isActive={index === activeIndex}
              />
            </div>
          ))}
        </div>

        {/* Navigation Buttons Below Carousel */}
        {products.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {products.map((product, index) => (
              <button
                key={product.id}
                onClick={() => goToIndex(index)}
                className={cn(
                  'px-6 py-3 rounded-full',
                  'font-medium text-sm',
                  'transition-all duration-300',
                  'border-2',
                  index === activeIndex
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'bg-white text-[#1a1a1a] border-[#1a1a1a]/20 hover:border-[#1a1a1a]/40'
                )}
              >
                {product.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fade overlay at edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </section>
  )
}

/**
 * Individual stacked card
 */
interface StackCardProps {
  product: ShopifyProduct
  isActive: boolean
}

function StackCard({ product, isActive }: StackCardProps) {
  const image = product.featuredImage?.url || product.images?.edges?.[0]?.node?.url

  return (
    <div className="relative">
      {/* Card Glow (active only) */}
      {isActive && (
        <div className="absolute -inset-4 bg-gradient-to-r from-[#f0c417]/20 via-[#f0c417]/30 to-[#f0c417]/20 blur-2xl -z-10" />
      )}

      {/* Image - No background, transparent PNG support */}
      <div className="relative aspect-[4/5]">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className={cn(
              "w-full h-full object-contain",
              "drop-shadow-2xl", // Shadow for transparent PNGs
              isActive && "drop-shadow-[0_0_40px_rgba(240,196,23,0.3)]" // Golden glow when active
            )}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#1a1a1a]/20">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Badges/Tags Overlay (optional, can be removed if not needed) */}
        {isActive && product.tags && product.tags.length > 0 && (
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {product.tags.slice(0, 2).map((tag) => (
              <div
                key={tag}
                className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-[#1a1a1a] shadow-lg"
              >
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StackedCarousel
