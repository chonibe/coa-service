/**
 * Gallery Reveal
 * 
 * Gallery-style product grid with immersive reveal animations:
 * - Products scale up from 0.85 to 1.0 as they enter viewport
 * - Slight rotation (like viewing from an angle) that corrects on scroll
 * - Staggered reveal with crossfade
 * - Optional magnetic hover effect
 * 
 * @example
 * ```tsx
 * <GalleryReveal magnetic={true}>
 *   {products.map(product => (
 *     <ProductCard key={product.id} {...product} />
 *   ))}
 * </GalleryReveal>
 * ```
 */

'use client'

import * as React from 'react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { gsap } from '@/lib/animations/gsap-config'
import { useGSAP } from '@gsap/react'
import { useGalleryReveal } from '@/lib/animations/gsap-hooks-enhanced'

export interface GalleryRevealProps {
  children: React.ReactNode
  /** Enable magnetic hover effect on cards */
  magnetic?: boolean
  /** Starting scale (default 0.85) */
  startScale?: number
  /** Starting rotation in degrees (default -5) */
  startRotation?: number
  /** Animation duration (default 0.8) */
  duration?: number
  /** Stagger delay between items (default 0.1) */
  stagger?: number
  /** Grid columns configuration */
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg'
  /** Additional className */
  className?: string
}

export function GalleryReveal({
  children,
  magnetic = true,
  startScale = 0.85,
  startRotation = -5,
  duration = 0.8,
  stagger = 0.1,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className,
}: GalleryRevealProps) {
  const containerRef = useGalleryReveal({
    startScale,
    startRotation,
    duration,
    stagger,
  })

  // Gap classes
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6 sm:gap-8',
    lg: 'gap-8 sm:gap-10',
  }

  // Grid column classes
  const gridCols = cn(
    'grid',
    columns.mobile === 1 && 'grid-cols-1',
    columns.mobile === 2 && 'grid-cols-2',
    columns.mobile === 3 && 'grid-cols-3',
    columns.tablet && columns.tablet === 2 && 'sm:grid-cols-2',
    columns.tablet && columns.tablet === 3 && 'sm:grid-cols-3',
    columns.tablet && columns.tablet === 4 && 'sm:grid-cols-4',
    columns.desktop && columns.desktop === 2 && 'lg:grid-cols-2',
    columns.desktop && columns.desktop === 3 && 'lg:grid-cols-3',
    columns.desktop && columns.desktop === 4 && 'lg:grid-cols-4',
    columns.desktop && columns.desktop === 6 && 'lg:grid-cols-6'
  )

  return (
    <div
      ref={containerRef}
      className={cn(gridCols, gapClasses[gap], className)}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {React.Children.map(children, (child, index) => (
        <GalleryRevealItem key={index} magnetic={magnetic}>
          {child}
        </GalleryRevealItem>
      ))}
    </div>
  )
}

/**
 * Individual gallery item with optional magnetic hover
 */
interface GalleryRevealItemProps {
  children: React.ReactNode
  magnetic?: boolean
}

function GalleryRevealItem({ children, magnetic }: GalleryRevealItemProps) {
  const itemRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!magnetic || !itemRef.current) return

    const item = itemRef.current

    // Skip on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      return
    }

    let quickX: gsap.QuickToFunc
    let quickY: gsap.QuickToFunc

    // Create quickTo functions for 60fps performance
    quickX = gsap.quickTo(item, 'x', { duration: 0.3, ease: 'power2.out' })
    quickY = gsap.quickTo(item, 'y', { duration: 0.3, ease: 'power2.out' })

    const handleMouseMove = (e: MouseEvent) => {
      const rect = item.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate distance from center
      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY

      // Apply strength (30%) and limit to 30px
      const strength = 0.3
      const maxDistance = 30

      let moveX = deltaX * strength
      let moveY = deltaY * strength

      const distance = Math.sqrt(moveX * moveX + moveY * moveY)
      if (distance > maxDistance) {
        const scale = maxDistance / distance
        moveX *= scale
        moveY *= scale
      }

      quickX(moveX)
      quickY(moveY)
    }

    const handleMouseLeave = () => {
      // Return to center with slight bounce
      gsap.to(item, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)',
      })
    }

    item.addEventListener('mousemove', handleMouseMove)
    item.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      item.removeEventListener('mousemove', handleMouseMove)
      item.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, { dependencies: [magnetic], scope: itemRef })

  return (
    <div
      ref={itemRef}
      className="will-change-transform"
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Simpler version without magnetic hover for performance-sensitive contexts
 */
export function GalleryRevealSimple({
  children,
  startScale = 0.85,
  startRotation = -5,
  duration = 0.8,
  stagger = 0.1,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className,
}: Omit<GalleryRevealProps, 'magnetic'>) {
  return (
    <GalleryReveal
      magnetic={false}
      startScale={startScale}
      startRotation={startRotation}
      duration={duration}
      stagger={stagger}
      columns={columns}
      gap={gap}
      className={className}
    >
      {children}
    </GalleryReveal>
  )
}

export default GalleryReveal
