/**
 * Circular Carousel
 * 
 * Cards arranged in a semi-circle that rotate like a dial when dragged:
 * - Cards positioned around a circular arc
 * - Drag rotates the entire circle
 * - Active card centered at bottom
 * - Smooth GSAP rotation animations
 * 
 * Based on Osmo's product slider design.
 */

'use client'

import * as React from 'react'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { gsap, Draggable } from '@/lib/animations/gsap-config'
import { useGSAP } from '@gsap/react'
import { formatPrice, type ShopifyProduct } from '@/lib/shopify/storefront-client'

export interface CircularCarouselProps {
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  products: ShopifyProduct[]
  /** Initial active product index */
  initialIndex?: number
  /** Callback when active product changes */
  onProductChange?: (product: ShopifyProduct, index: number) => void
  className?: string
}

export function CircularCarousel({
  title,
  description,
  products,
  initialIndex = 0,
  onProductChange,
  className,
}: CircularCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const circleRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])
  const currentRotation = useRef(0)

  const totalCards = products.length
  // Spread cards across a smaller arc (60° total, centered at top)
  // This shows ~3 cards at once (10, 12, 2 o'clock positions)
  const arcSpan = 60 // degrees
  const angleStep = totalCards > 1 ? arcSpan / (totalCards - 1) : 0

  const updateCardPositions = () => {
    const radius = 800 // Larger radius so we only see top portion of circle

    cardsRef.current.forEach((card, index) => {
      if (!card) return

      // Calculate angle offset from active card
      const offset = index - activeIndex
      const angle = offset * angleStep

      // Calculate position on circle
      // Center card is at 0° (12 o'clock/top), others spread left/right
      const targetAngle = angle
      const radians = (targetAngle * Math.PI) / 180

      const x = Math.sin(radians) * radius // sin for horizontal position
      const y = -Math.cos(radians) * radius // -cos for vertical (negative = up)

      // Calculate card rotation (tilt)
      // Cards rotate to follow the arc tangent
      const cardRotation = angle

      // Calculate opacity and scale based on distance from center
      const absOffset = Math.abs(offset)
      const opacity = absOffset > 2 ? 0 : 1 - (absOffset * 0.2)
      const scale = 1 - (absOffset * 0.1)

      // Animate to new position
      gsap.to(card, {
        x,
        y,
        rotation: cardRotation,
        opacity,
        scale,
        duration: 0.8,
        ease: 'power2.out',
      })
    })
  }

  const goToIndex = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(products.length - 1, index))
    setActiveIndex(clampedIndex)
    if (onProductChange && products[clampedIndex]) {
      onProductChange(products[clampedIndex], clampedIndex)
    }
  }

  // Update card positions when active index changes
  useEffect(() => {
    updateCardPositions()
  }, [activeIndex, products.length])

  // Setup draggable
  useGSAP(() => {
    if (!circleRef.current) return

    let dragStartX = 0
    let dragDelta = 0

    const draggable = Draggable.create(circleRef.current, {
      type: 'x',
      inertia: true,
      onDragStart: function() {
        dragStartX = this.x
      },
      onDrag: function() {
        dragDelta = this.x - dragStartX
      },
      onDragEnd: function() {
        // Determine direction and move to next/previous card
        const threshold = 50 // Minimum drag distance to change card
        
        if (Math.abs(dragDelta) > threshold) {
          if (dragDelta > 0) {
            // Dragged right, go to previous card
            goToIndex(activeIndex - 1)
          } else {
            // Dragged left, go to next card
            goToIndex(activeIndex + 1)
          }
        }
        
        // Reset position
        gsap.to(this.target, {
          x: 0,
          duration: 0.3,
          ease: 'power2.out',
        })
      },
    })

    return () => {
      draggable.forEach(d => d.kill())
    }
  }, { dependencies: [activeIndex, products.length], scope: circleRef })

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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5">
          <svg width="1000" height="1000" viewBox="0 0 1000 1000" fill="none">
            <circle cx="500" cy="500" r="450" stroke="currentColor" strokeWidth="1" />
            <circle cx="500" cy="500" r="400" stroke="currentColor" strokeWidth="1" />
            <circle cx="500" cy="500" r="350" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        {/* Circular Carousel - Only showing top arc */}
        <div className="relative h-[600px] flex items-start justify-center overflow-hidden pt-12">
          <div
            ref={circleRef}
            className="relative w-full h-full cursor-grab active:cursor-grabbing"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {products.map((product, index) => (
              <div
                key={product.id}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el
                }}
                className="absolute top-0 left-1/2 -translate-x-1/2"
                style={{
                  width: '320px',
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'center top',
                }}
                onClick={() => goToIndex(index)}
              >
                <CircleCard
                  product={product}
                  isActive={index === activeIndex}
                />
              </div>
            ))}
          </div>
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
 * Individual card in circular layout
 */
interface CircleCardProps {
  product: ShopifyProduct
  isActive: boolean
}

function CircleCard({ product, isActive }: CircleCardProps) {
  const image = product.featuredImage?.url || product.images?.edges?.[0]?.node?.url

  return (
    <div className={cn(
      'relative transition-all duration-300 group',
      isActive ? 'scale-110 z-10' : 'scale-90 opacity-70'
    )}>

      {/* Card Content */}
      <Link href={`/shop/${product.handle}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={product.title}
              className={cn(
                "w-full h-full object-cover transition-transform duration-300",
                "group-hover:scale-105"
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

        </div>
      </Link>
    </div>
  )
}

export default CircularCarousel
