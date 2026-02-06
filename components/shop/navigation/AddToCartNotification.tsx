'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Check, ShoppingBag, X } from 'lucide-react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/animations'

/**
 * AddToCartNotification - Slide-up notification from bottom
 * 
 * Appears when item is added to cart.
 * Features GSAP slide animation and auto-dismiss.
 */

export interface AddToCartNotificationProps {
  isVisible: boolean
  onClose: () => void
  // Product info
  title: string
  image?: string
  variantTitle?: string
  price: string
  artistName?: string
  // Cart info
  cartCount: number
  // Actions
  onViewCart?: () => void
  onContinueShopping?: () => void
  // Options
  autoHideDelay?: number
  className?: string
}

export const AddToCartNotification = React.forwardRef<HTMLDivElement, AddToCartNotificationProps>(
  (
    {
      isVisible,
      onClose,
      title,
      image,
      variantTitle,
      price,
      artistName,
      cartCount,
      onViewCart,
      onContinueShopping,
      autoHideDelay = 5000,
      className,
    },
    ref
  ) => {
    const notificationRef = React.useRef<HTMLDivElement>(null)
    const imageRef = React.useRef<HTMLDivElement>(null)

    // Auto-dismiss
    React.useEffect(() => {
      if (isVisible && autoHideDelay > 0) {
        const timer = setTimeout(onClose, autoHideDelay)
        return () => clearTimeout(timer)
      }
    }, [isVisible, autoHideDelay, onClose])

    // Animate notification
    useGSAP(() => {
      if (!notificationRef.current) return

      if (isVisible) {
        const tl = gsap.timeline()

        // Slide up from bottom
        tl.fromTo(
          notificationRef.current,
          { y: 100, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            pointerEvents: 'auto',
            visibility: 'visible',
            duration: 0.35,
            ease: 'back.out(1.4)',
          }
        )

        // Image 3D tilt
        if (imageRef.current) {
          tl.fromTo(
            imageRef.current,
            { rotateY: -15, scale: 0.9 },
            {
              rotateY: 0,
              scale: 1,
              duration: 0.5,
              ease: 'power2.out',
            },
            '-=0.2'
          )
        }

        // Checkmark pop
        tl.from('.notif-check', {
          scale: 0,
          duration: 0.3,
          ease: 'elastic.out(1.2, 0.4)',
        }, '-=0.3')
      } else {
        gsap.to(notificationRef.current, {
          y: 100,
          opacity: 0,
          pointerEvents: 'none',
          duration: 0.25,
          ease: 'power2.in',
          onComplete: () => {
            if (notificationRef.current) {
              gsap.set(notificationRef.current, { visibility: 'hidden' })
            }
          },
        })
      }
    }, { dependencies: [isVisible] })

    // Merge refs
    const mergedRef = React.useMemo(() => {
      return (node: HTMLDivElement | null) => {
        notificationRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      }
    }, [ref])

    return (
      <div
        ref={mergedRef}
        className={cn(
          'fixed bottom-4 right-4 z-[100]',
          'w-full max-w-sm',
          'opacity-0 invisible pointer-events-none',
          className
        )}
        style={{
          willChange: 'transform, opacity',
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-[#1a1a1a]/10 overflow-hidden">
          {/* Success Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
            <div className="notif-check flex items-center justify-center w-6 h-6 bg-emerald-500 rounded-full">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
            <span className="text-sm font-semibold text-emerald-800">
              Added to cart
            </span>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto p-1 text-emerald-600 hover:text-emerald-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Product Info */}
          <div className="p-4 flex gap-4">
            {/* Image */}
            {image && (
              <div
                ref={imageRef}
                className="w-16 h-16 rounded-lg overflow-hidden bg-[#f5f5f5] flex-shrink-0"
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '500px',
                }}
              >
                <img
                  src={image}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Details */}
            <div className="flex-1 min-w-0">
              {artistName && (
                <p className="text-xs text-[#1a1a1a]/50 uppercase tracking-wider">
                  {artistName}
                </p>
              )}
              <h4 className="font-semibold text-[#1a1a1a] line-clamp-1">
                {title}
              </h4>
              {variantTitle && variantTitle !== 'Default Title' && (
                <p className="text-xs text-[#1a1a1a]/50">{variantTitle}</p>
              )}
              <p className="text-sm font-semibold text-[#1a1a1a] mt-1">
                {price}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onViewCart?.()
                onClose()
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2',
                'py-2.5 px-4 rounded-xl',
                'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white',
                'font-semibold text-sm',
                'transition-colors duration-200'
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              View Cart ({cartCount})
            </button>
            <button
              type="button"
              onClick={() => {
                onContinueShopping?.()
                onClose()
              }}
              className={cn(
                'py-2.5 px-4 rounded-xl',
                'border border-[#1a1a1a]/10 text-[#1a1a1a]',
                'font-medium text-sm',
                'hover:bg-[#f5f5f5] transition-colors duration-200'
              )}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }
)
AddToCartNotification.displayName = 'AddToCartNotification'
