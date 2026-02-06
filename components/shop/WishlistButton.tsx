'use client'

import * as React from 'react'
import { useWishlist } from '@/lib/shop/WishlistContext'
import { cn } from '@/lib/utils'
import gsap from 'gsap'

/**
 * WishlistButton Component
 * 
 * Heart icon button to add/remove items from wishlist.
 * Features:
 * - Smooth fill animation on toggle
 * - Spring physics bounce on add
 * - Haptic-like visual feedback
 * - Works without login (localStorage)
 */

export interface WishlistButtonProps {
  productId: string
  variantId: string
  handle: string
  title: string
  price: number
  image?: string
  artistName?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost'
  showTooltip?: boolean
}

export function WishlistButton({
  productId,
  variantId,
  handle,
  title,
  price,
  image,
  artistName,
  className,
  size = 'md',
  variant = 'default',
  showTooltip = true,
}: WishlistButtonProps) {
  const { isInWishlist, addItem, removeItem } = useWishlist()
  const isSaved = isInWishlist(productId)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const heartRef = React.useRef<SVGSVGElement>(null)
  
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isSaved) {
      removeItem(productId)
      // Animate out
      if (heartRef.current) {
        gsap.to(heartRef.current, {
          scale: 0.8,
          duration: 0.2,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(heartRef.current, {
              scale: 1,
              duration: 0.3,
              ease: 'elastic.out(1, 0.5)',
            })
          }
        })
      }
    } else {
      addItem({
        productId,
        variantId,
        handle,
        title,
        price,
        image,
        artistName,
      })
      // Animate in with bounce
      if (heartRef.current) {
        gsap.fromTo(heartRef.current, 
          { scale: 0.5 },
          {
            scale: 1.2,
            duration: 0.3,
            ease: 'back.out(3)',
            onComplete: () => {
              gsap.to(heartRef.current, {
                scale: 1,
                duration: 0.2,
                ease: 'power2.out',
              })
            }
          }
        )
      }
      
      // Button pulse
      if (buttonRef.current) {
        gsap.fromTo(buttonRef.current,
          { boxShadow: '0 0 0 0 rgba(240, 196, 23, 0.7)' },
          {
            boxShadow: '0 0 0 10px rgba(240, 196, 23, 0)',
            duration: 0.6,
            ease: 'power2.out',
          }
        )
      }
    }
  }
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }
  
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  }
  
  const variantClasses = {
    default: 'bg-white/90 backdrop-blur-sm hover:bg-white shadow-md',
    ghost: 'bg-transparent hover:bg-white/10',
  }
  
  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className={cn(
        'group relative rounded-full',
        'flex items-center justify-center',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[#f0c417] focus:ring-offset-2',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
      title={showTooltip ? (isSaved ? 'Remove from wishlist' : 'Save for later') : undefined}
    >
      <svg
        ref={heartRef}
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          'transition-all duration-300',
          isSaved ? 'text-[#f83a3a]' : 'text-[#1a1a1a]/40 group-hover:text-[#f83a3a]/60'
        )}
      >
        {isSaved ? (
          // Filled heart
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          // Outline heart
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      
      {/* Ripple effect on click */}
      <span className="absolute inset-0 rounded-full opacity-0 group-active:opacity-100 group-active:scale-150 transition-all duration-300 bg-[#f0c417]/20" />
    </button>
  )
}
