/**
 * VinylTiltEffect
 * 
 * A wrapper component that applies a 3D tilt effect to its children.
 * Uses GSAP's quickTo for buttery smooth 60fps mouse-follow animations.
 * 
 * @example
 * ```tsx
 * <VinylTiltEffect maxTilt={15} scale={1.02}>
 *   <div className="card">Content</div>
 * </VinylTiltEffect>
 * ```
 */

'use client'

import * as React from 'react'
import { use3DTilt, type Use3DTiltOptions } from '@/lib/animations'
import { cn } from '@/lib/utils'

export interface VinylTiltEffectProps extends Use3DTiltOptions {
  children: React.ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export const VinylTiltEffect = React.forwardRef<HTMLDivElement, VinylTiltEffectProps>(
  (
    {
      children,
      className,
      as: Component = 'div',
      maxTilt = 15,
      perspective = 1000,
      scale = 1.02,
      speed = 0.5,
      disabled = false,
    },
    forwardedRef
  ) => {
    const tiltRef = use3DTilt<HTMLDivElement>({
      maxTilt,
      perspective,
      scale,
      speed,
      disabled,
    })

    // Merge refs
    const mergedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        // Update the tilt ref
        (tiltRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        
        // Update forwarded ref
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [tiltRef, forwardedRef]
    )

    return React.createElement(
      Component,
      {
        ref: mergedRef,
        className: cn('will-change-transform', className),
      },
      children
    )
  }
)

VinylTiltEffect.displayName = 'VinylTiltEffect'
