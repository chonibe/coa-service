'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Scrolling Text / Marquee Section
 * 
 * Horizontally scrolling text, matching the Impact theme scrolling-text section.
 */

export interface ScrollingTextProps {
  text: string
  textSize?: 'small' | 'medium' | 'large' | 'xl'
  textStyle?: 'fill' | 'outline'
  scrollingMode?: 'auto' | 'hover' | 'always'
  scrollingSpeed?: number // 1-10, default 5
  direction?: 'left' | 'right'
  repeat?: number
  backgroundColor?: string
  textColor?: string
  textGradient?: string
  fullWidth?: boolean
  className?: string
}

export function ScrollingText({
  text,
  textSize = 'medium',
  textStyle = 'fill',
  scrollingMode = 'auto',
  scrollingSpeed = 5,
  direction = 'left',
  repeat = 4,
  backgroundColor,
  textColor,
  textGradient,
  fullWidth = true,
  className,
}: ScrollingTextProps) {
  // Size classes
  const sizeClasses = {
    small: 'text-2xl sm:text-3xl md:text-4xl',
    medium: 'text-4xl sm:text-5xl md:text-6xl',
    large: 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl',
    xl: 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl',
  }

  // Calculate animation duration based on speed (1 = slow, 10 = fast)
  const duration = (11 - scrollingSpeed) * 5 // 5s to 50s

  // Style classes based on textStyle
  const styleClasses = textStyle === 'outline'
    ? 'text-transparent [-webkit-text-stroke:2px_currentColor]'
    : ''

  // Create repeated text array
  const repeatedText = Array(repeat).fill(text)

  return (
    <section
      className={cn(
        'overflow-hidden py-8 sm:py-12',
        fullWidth && 'w-full',
        className
      )}
      style={{ backgroundColor }}
    >
      <div
        className={cn(
          'flex whitespace-nowrap',
          scrollingMode === 'auto' && 'animate-marquee',
          scrollingMode === 'hover' && 'group-hover:animate-marquee'
        )}
        style={{
          animationDuration: `${duration}s`,
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
        }}
      >
        {repeatedText.map((t, index) => (
          <span
            key={index}
            className={cn(
              'font-heading font-bold tracking-[-0.02em] px-8',
              sizeClasses[textSize],
              styleClasses,
              textGradient && 'bg-clip-text text-transparent'
            )}
            style={{
              color: textGradient ? undefined : (textColor || '#1a1a1a'),
              backgroundImage: textGradient || undefined,
            }}
          >
            {t}
          </span>
        ))}
        {/* Duplicate for seamless loop */}
        {repeatedText.map((t, index) => (
          <span
            key={`dup-${index}`}
            className={cn(
              'font-heading font-bold tracking-[-0.02em] px-8',
              sizeClasses[textSize],
              styleClasses,
              textGradient && 'bg-clip-text text-transparent'
            )}
            style={{
              color: textGradient ? undefined : (textColor || '#1a1a1a'),
              backgroundImage: textGradient || undefined,
            }}
            aria-hidden="true"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Add keyframes style */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </section>
  )
}

export default ScrollingText
