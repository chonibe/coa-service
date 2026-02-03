/**
 * ScrollReveal
 * 
 * A component that reveals its children with animation when entering the viewport.
 * Uses GSAP ScrollTrigger for smooth, performant scroll-based animations.
 * 
 * @example
 * ```tsx
 * <ScrollReveal animation="fadeUp">
 *   <ProductCard {...props} />
 * </ScrollReveal>
 * 
 * // With stagger for multiple children
 * <ScrollReveal animation="stagger" staggerAmount={0.1}>
 *   {products.map(product => (
 *     <ProductCard key={product.id} {...product} />
 *   ))}
 * </ScrollReveal>
 * ```
 */

'use client'

import * as React from 'react'
import { gsap, ScrollTrigger, durations, customEases } from '@/lib/animations'
import { useGSAP } from '@gsap/react'
import { cn } from '@/lib/utils'

export type ScrollRevealAnimation = 
  | 'fadeUp' 
  | 'fadeDown' 
  | 'fadeLeft' 
  | 'fadeRight' 
  | 'scale' 
  | 'stagger'
  | 'parallax'
  | 'none'

export interface ScrollRevealProps {
  children: React.ReactNode
  /** Animation type */
  animation?: ScrollRevealAnimation
  /** Delay before animation starts (seconds) */
  delay?: number
  /** Duration of animation (seconds) */
  duration?: number
  /** Y distance for fade animations */
  y?: number
  /** X distance for fade animations */
  x?: number
  /** Scale start value */
  scale?: number
  /** Stagger amount for children (seconds) */
  staggerAmount?: number
  /** ScrollTrigger start position */
  start?: string
  /** ScrollTrigger end position */
  end?: string
  /** Whether animation should only play once */
  once?: boolean
  /** Whether to use scrub (animation tied to scroll progress) */
  scrub?: boolean | number
  /** Additional className */
  className?: string
  /** ID for targeting specific elements */
  id?: string
  /** Wrapper element tag */
  as?: keyof JSX.IntrinsicElements
}

export function ScrollReveal({
  children,
  animation = 'fadeUp',
  delay = 0,
  duration = durations.scrollReveal,
  y = 40,
  x = 40,
  scale = 0.95,
  staggerAmount = 0.1,
  start = 'top 85%',
  end = 'bottom 15%',
  once = true,
  scrub = false,
  className,
  id,
  as: Component = 'div',
}: ScrollRevealProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current || animation === 'none') return

    const container = containerRef.current
    const children = container.children

    // Default animation properties
    let fromProps: gsap.TweenVars = { opacity: 0 }
    let toProps: gsap.TweenVars = { 
      opacity: 1, 
      duration, 
      ease: customEases.staggerReveal,
      delay,
    }

    // Configure based on animation type
    switch (animation) {
      case 'fadeUp':
        fromProps = { ...fromProps, y }
        toProps = { ...toProps, y: 0 }
        break
      case 'fadeDown':
        fromProps = { ...fromProps, y: -y }
        toProps = { ...toProps, y: 0 }
        break
      case 'fadeLeft':
        fromProps = { ...fromProps, x }
        toProps = { ...toProps, x: 0 }
        break
      case 'fadeRight':
        fromProps = { ...fromProps, x: -x }
        toProps = { ...toProps, x: 0 }
        break
      case 'scale':
        fromProps = { ...fromProps, scale }
        toProps = { ...toProps, scale: 1 }
        break
      case 'parallax':
        // Parallax uses scrub by default
        fromProps = { y: y }
        toProps = { y: -y, ease: 'none' }
        break
      case 'stagger':
        // Stagger animates children individually
        gsap.set(children, { opacity: 0, y })
        
        ScrollTrigger.create({
          trigger: container,
          start,
          end,
          once,
          onEnter: () => {
            gsap.to(children, {
              opacity: 1,
              y: 0,
              duration,
              ease: customEases.staggerReveal,
              stagger: {
                amount: staggerAmount * children.length,
                from: 'start',
              },
            })
          },
          onLeaveBack: once ? undefined : () => {
            gsap.to(children, {
              opacity: 0,
              y,
              duration: duration * 0.5,
              stagger: {
                amount: staggerAmount * 0.5 * children.length,
                from: 'end',
              },
            })
          },
        })
        return
    }

    // Set initial state
    gsap.set(container, fromProps)

    // Create ScrollTrigger
    if (animation === 'parallax' || scrub) {
      // Scrub animation (tied to scroll)
      gsap.to(container, {
        ...toProps,
        scrollTrigger: {
          trigger: container,
          start,
          end,
          scrub: scrub === true ? 1 : scrub || 1,
        },
      })
    } else {
      // Triggered animation
      ScrollTrigger.create({
        trigger: container,
        start,
        end,
        once,
        onEnter: () => {
          gsap.to(container, toProps)
        },
        onLeaveBack: once ? undefined : () => {
          gsap.to(container, {
            ...fromProps,
            duration: duration * 0.5,
          })
        },
      })
    }

  }, { dependencies: [animation, delay, duration, y, x, scale, staggerAmount, start, end, once, scrub] })

  return React.createElement(
    Component,
    {
      ref: containerRef,
      className: cn('will-change-transform', className),
      id,
    },
    children
  )
}

/**
 * ParallaxLayer
 * 
 * Creates a parallax effect where the content moves at a different speed than scroll.
 */
export interface ParallaxLayerProps {
  children: React.ReactNode
  /** Speed multiplier (1 = normal, 0.5 = half speed, 2 = double speed) */
  speed?: number
  /** Direction of parallax movement */
  direction?: 'vertical' | 'horizontal'
  /** Additional className */
  className?: string
}

export function ParallaxLayer({
  children,
  speed = 0.5,
  direction = 'vertical',
  className,
}: ParallaxLayerProps) {
  const layerRef = React.useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!layerRef.current) return

    const layer = layerRef.current
    const distance = 100 * (1 - speed)

    const props = direction === 'vertical'
      ? { y: `${distance}%` }
      : { x: `${distance}%` }

    gsap.to(layer, {
      ...props,
      ease: 'none',
      scrollTrigger: {
        trigger: layer,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    })
  }, { dependencies: [speed, direction] })

  return (
    <div ref={layerRef} className={cn('will-change-transform', className)}>
      {children}
    </div>
  )
}

/**
 * ScrollProgress
 * 
 * Shows a progress bar based on scroll position.
 */
export interface ScrollProgressProps {
  /** Target element to track (defaults to page) */
  target?: string | Element
  /** Progress bar position */
  position?: 'top' | 'bottom'
  /** Progress bar color */
  color?: string
  /** Progress bar height */
  height?: number
  /** Additional className */
  className?: string
}

export function ScrollProgress({
  target,
  position = 'top',
  color = '#f0c417',
  height = 3,
  className,
}: ScrollProgressProps) {
  const progressRef = React.useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!progressRef.current) return

    const progress = progressRef.current

    gsap.to(progress, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: target || document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      },
    })
  }, { dependencies: [target] })

  return (
    <div
      ref={progressRef}
      className={cn(
        'fixed left-0 right-0 z-50 origin-left',
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
      style={{
        height,
        backgroundColor: color,
        transform: 'scaleX(0)',
      }}
    />
  )
}
