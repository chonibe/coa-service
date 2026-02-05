/**
 * Button Rotate - Osmo-style Rolling Button
 * 
 * Features:
 * - 3D rolling text effect on hover
 * - Smooth GSAP animations
 * - Multiple label copies for seamless rotation
 * - CSS custom properties for dynamic positioning
 * 
 * Based on Osmo's button system
 */

'use client'

import * as React from 'react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { gsap } from '@/lib/animations/gsap-config'
import { useGSAP } from '@gsap/react'

export interface ButtonRotateProps {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'neutral' | 'electric' | 'purple' | 'coral'
  size?: 'sm' | 'md' | 'lg' | 'full'
  shape?: 'square' | 'rounded' | 'pill'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export function ButtonRotate({
  children,
  onClick,
  href,
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  disabled = false,
  className,
  type = 'button',
}: ButtonRotateProps) {
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null)
  const labelWrapRef = useRef<HTMLDivElement>(null)
  const [yPosition, setYPosition] = useState(0)

  // Variant styles (matching Osmo's theme variants)
  const variantClasses = {
    primary: 'bg-[#1a1a1a] text-white hover:bg-[#2c2c2c]',
    secondary: 'bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e5e5e5]',
    outline: 'bg-transparent border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white',
    neutral: 'bg-[#e5e5e5] text-[#1a1a1a] hover:bg-[#d5d5d5]',
    electric: 'bg-[#6840ff] text-white hover:bg-[#5830ee]',
    purple: 'bg-[#803cee] text-white hover:bg-[#6b2fd4]',
    coral: 'bg-[#ff6b6b] text-white hover:bg-[#ee5555]',
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    full: 'w-full px-6 py-3 text-base',
  }

  const shapeClasses = {
    square: 'rounded-none',
    rounded: 'rounded-lg',
    pill: 'rounded-full',
  }

  // Hover animation
  useGSAP(() => {
    if (!buttonRef.current || !labelWrapRef.current) return

    const handleMouseEnter = () => {
      if (disabled) return

      gsap.to(labelWrapRef.current, {
        y: '-33.333%',
        duration: 0.4,
        ease: 'power2.out',
        onUpdate: function() {
          const progress = this.progress()
          setYPosition(progress * 33.333)
        }
      })
    }

    const handleMouseLeave = () => {
      if (disabled) return

      gsap.to(labelWrapRef.current, {
        y: '0%',
        duration: 0.4,
        ease: 'power2.out',
        onUpdate: function() {
          const progress = 1 - this.progress()
          setYPosition(progress * 33.333)
        }
      })
    }

    const element = buttonRef.current
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, { dependencies: [disabled] })

  const buttonClasses = cn(
    'relative overflow-hidden font-medium transition-all duration-300',
    'inline-flex items-center justify-center',
    variantClasses[variant],
    sizeClasses[size],
    shapeClasses[shape],
    disabled && 'opacity-50 cursor-not-allowed',
    className
  )

  const content = (
    <>
      {/* Button Background (for gradient effects) */}
      <div className="absolute inset-0 transition-opacity duration-300" />

      {/* Label Wrapper - 3 copies for seamless rotation */}
      <div 
        ref={labelWrapRef}
        className="button-label__wrap relative flex flex-col"
        style={{
          transform: 'translateY(0%)',
        }}
      >
        {/* Visible label */}
        <div className="button-label whitespace-nowrap">
          <span>{children}</span>
        </div>
        {/* Hidden duplicate for rotation effect */}
        <div aria-hidden="true" className="button-label whitespace-nowrap">
          <span aria-hidden="true">{children}</span>
        </div>
        {/* Third label for seamless loop */}
        <div aria-hidden="true" className="button-label whitespace-nowrap">
          <span>{children}</span>
        </div>
      </div>
    </>
  )

  if (href && !disabled) {
    return (
      <a
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={buttonClasses}
        style={{ '--y': `${yPosition * 100}%` } as React.CSSProperties}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
      style={{ '--y': `${yPosition * 100}%` } as React.CSSProperties}
    >
      {content}
    </button>
  )
}

export default ButtonRotate
