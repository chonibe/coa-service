/**
 * AddToCartToast
 * 
 * A toast notification that appears when an item is added to cart.
 * Features GSAP-powered slide-in animation and mini vinyl card preview.
 */

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { X, ShoppingBag, Check } from 'lucide-react'
import { gsap, durations, customEases } from '@/lib/animations'
import { useGSAP } from '@gsap/react'

export interface AddToCartToastProps {
  /** Whether toast is visible */
  isVisible: boolean
  /** Close handler */
  onClose: () => void
  /** Product title */
  title: string
  /** Product image */
  image?: string
  /** Variant title (if applicable) */
  variantTitle?: string
  /** Price */
  price: string
  /** Artist name */
  artistName?: string
  /** Total cart count */
  cartCount: number
  /** View cart handler */
  onViewCart?: () => void
  /** Continue shopping handler */
  onContinueShopping?: () => void
  /** Auto-dismiss timeout (ms) */
  autoHideDelay?: number
}

export function AddToCartToast({
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
}: AddToCartToastProps) {
  const toastRef = React.useRef<HTMLDivElement>(null)
  const imageRef = React.useRef<HTMLDivElement>(null)

  // Auto-dismiss
  React.useEffect(() => {
    if (isVisible && autoHideDelay > 0) {
      const timer = setTimeout(onClose, autoHideDelay)
      return () => clearTimeout(timer)
    }
  }, [isVisible, autoHideDelay, onClose])

  // GSAP entrance animation with vinyl card effect
  useGSAP(() => {
    if (!toastRef.current || !isVisible) return

    const toast = toastRef.current
    const imageEl = imageRef.current

    // Create entrance timeline
    const tl = gsap.timeline()

    tl.fromTo(
      toast,
      { y: 50, opacity: 0, scale: 0.95 },
      { 
        y: 0, 
        opacity: 1, 
        scale: 1, 
        duration: 0.4, 
        ease: customEases.badgePop 
      }
    )

    // Subtle 3D tilt on the image
    if (imageEl) {
      tl.fromTo(
        imageEl,
        { rotateY: -15, scale: 0.9 },
        { 
          rotateY: 0, 
          scale: 1, 
          duration: 0.5, 
          ease: customEases.tiltReturn 
        },
        '-=0.2'
      )
    }

    // Checkmark pop
    tl.from('.toast-check', {
      scale: 0,
      duration: 0.3,
      ease: customEases.badgePop,
    }, '-=0.3')

    return () => {
      tl.kill()
    }
  }, { dependencies: [isVisible] })

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-4 right-4 z-[100] max-w-sm w-full sm:w-auto">
          <motion.div
            ref={toastRef}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              'bg-white rounded-[20px] shadow-2xl',
              'border border-slate-200',
              'overflow-hidden'
            )}
          >
            {/* Success Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
              <div className="toast-check flex items-center justify-center w-6 h-6 bg-emerald-500 rounded-full">
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
              {/* Mini Vinyl Card Preview */}
              {image && (
                <div
                  ref={imageRef}
                  className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0"
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

              <div className="flex-1 min-w-0">
                {artistName && (
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    {artistName}
                  </p>
                )}
                <h4 className="font-semibold text-slate-900 line-clamp-1">
                  {title}
                </h4>
                {variantTitle && (
                  <p className="text-xs text-slate-500">{variantTitle}</p>
                )}
                <p className="text-sm font-semibold text-slate-900 mt-1">
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
                  'py-2.5 px-4 rounded-full',
                  'bg-slate-900 text-white',
                  'font-semibold text-sm',
                  'hover:bg-slate-800 transition-colors'
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
                  'py-2.5 px-4 rounded-full',
                  'border border-slate-200 text-slate-700',
                  'font-medium text-sm',
                  'hover:bg-slate-50 transition-colors'
                )}
              >
                Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AddToCartToast
