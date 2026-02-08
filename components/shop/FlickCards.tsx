/**
 * Flick Cards - Osmo-style Interactive Card Grid
 * 
 * Features:
 * - Flat design with no backgrounds or shadows
 * - Magnetic hover with mouse tracking
 * - GSAP-powered smooth animations
 * - Staggered entrance reveal
 * 
 * Inspired by Osmo's homepage hero cards
 */

'use client'

import * as React from 'react'
import { useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { gsap } from '@/lib/animations/gsap-config'
import { useGSAP } from '@gsap/react'

export interface FlickCard {
  id: string
  title: string
  description?: string
  imageUrl: string
  href: string
  tag?: string
  tagVariant?: 'new' | 'limited' | 'sold-out'
}

export interface FlickCardsProps {
  cards: FlickCard[]
  columns?: { mobile: number; tablet: number; desktop: number }
  gap?: 'sm' | 'md' | 'lg'
  enableMagnetic?: boolean
  className?: string
}

export function FlickCards({
  cards,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  enableMagnetic = true,
  className,
}: FlickCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  }

  const gridColsClasses = `grid-cols-${columns.mobile} md:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop}`

  // Entrance animation - flat design (no 3D rotation)
  useGSAP(() => {
    if (!containerRef.current) return

    const cards = cardsRef.current.filter(Boolean)

    gsap.fromTo(
      cards,
      {
        opacity: 0,
        y: 40,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          once: true,
        },
      }
    )
  }, { scope: containerRef })

  return (
    <div
      ref={containerRef}
      className={cn(
        'grid',
        gridColsClasses,
        gapClasses[gap],
        className
      )}
    >
      {cards.map((card, index) => (
        <FlickCard
          key={card.id}
          card={card}
          ref={(el) => {
            if (el) cardsRef.current[index] = el
          }}
          enableMagnetic={enableMagnetic}
        />
      ))}
    </div>
  )
}

/**
 * Individual Flick Card
 */
interface FlickCardComponentProps {
  card: FlickCard
  enableMagnetic: boolean
}

const FlickCard = React.forwardRef<HTMLDivElement, FlickCardComponentProps>(
  ({ card, enableMagnetic }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    React.useImperativeHandle(ref, () => cardRef.current!)

    // Magnetic hover effect
    useGSAP(() => {
      if (!cardRef.current || !enableMagnetic) return

      const card = cardRef.current

      const handleMouseMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2

        // Magnetic pull (subtle)
        gsap.to(card, {
          x: x * 0.1,
          y: y * 0.1,
          duration: 0.3,
          ease: 'power2.out',
        })
      }

      const handleMouseLeave = () => {
        gsap.to(card, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)',
        })
      }

      card.addEventListener('mousemove', handleMouseMove)
      card.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        card.removeEventListener('mousemove', handleMouseMove)
        card.removeEventListener('mouseleave', handleMouseLeave)
      }
    }, { dependencies: [enableMagnetic], scope: cardRef })

    const tagVariants = {
      new: 'bg-[#803cee] text-white',
      limited: 'bg-[#f0c417] text-[#1a1a1a]',
      'sold-out': 'bg-[#1a1a1a] text-white',
    }

    return (
      <div
        ref={cardRef}
        className="relative group"
      >
        <Link href={card.href}>
          <div
            ref={contentRef}
            className="relative aspect-[4/5] overflow-hidden"
          >
            {/* Card Image */}
            <div className="absolute inset-0">
              <img
                src={card.imageUrl}
                alt={card.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            </div>


            {/* Tag */}
            {card.tag && card.tagVariant && (
              <div className="absolute top-4 left-4 z-10">
                <span
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider',
                    tagVariants[card.tagVariant]
                  )}
                >
                  {card.tag}
                </span>
              </div>
            )}

          </div>
        </Link>
      </div>
    )
  }
)
FlickCard.displayName = 'FlickCard'

export default FlickCards
