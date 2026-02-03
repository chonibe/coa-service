'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Container, Button } from '@/components/impact'

/**
 * Image with Text Overlay Section
 * 
 * Full-width image section with configurable text overlay, matching the Impact theme.
 */

export interface ImageWithTextOverlayProps {
  image: {
    src: string
    mobileSrc?: string
    alt?: string
  }
  content: {
    subheading?: string
    title?: string
    description?: string
    buttonText?: string
    buttonLink?: string
    buttonStyle?: 'primary' | 'outline' | 'secondary'
  }
  textPosition?: 'center' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  textColor?: string
  overlayColor?: string
  overlayOpacity?: number
  imageSize?: 'sm' | 'md' | 'lg' | 'full' | 'auto'
  enableParallax?: boolean
  fullWidth?: boolean
  allowTransparentHeader?: boolean
  className?: string
}

export function ImageWithTextOverlay({
  image,
  content,
  textPosition = 'center',
  textColor = '#ffffff',
  overlayColor = '#000000',
  overlayOpacity = 30,
  imageSize = 'auto',
  enableParallax = false,
  fullWidth = true,
  allowTransparentHeader = false,
  className,
}: ImageWithTextOverlayProps) {
  // Size classes
  const sizeClasses = {
    sm: 'h-[40vh] min-h-[300px]',
    md: 'h-[60vh] min-h-[400px]',
    lg: 'h-[80vh] min-h-[500px]',
    full: 'h-screen',
    auto: 'aspect-[16/9] sm:aspect-[21/9]',
  }

  // Position classes
  const positionClasses: Record<string, string> = {
    'center': 'items-center justify-center text-center',
    'top-left': 'items-start justify-start text-left pt-16',
    'top-center': 'items-start justify-center text-center pt-16',
    'top-right': 'items-start justify-end text-right pt-16',
    'bottom-left': 'items-end justify-start text-left pb-16',
    'bottom-center': 'items-end justify-center text-center pb-16',
    'bottom-right': 'items-end justify-end text-right pb-16',
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden',
        sizeClasses[imageSize],
        fullWidth && 'w-full',
        className
      )}
    >
      {/* Image */}
      <div className={cn(
        'absolute inset-0',
        enableParallax && 'transform-gpu'
      )}>
        <picture>
          {image.mobileSrc && (
            <source media="(max-width: 768px)" srcSet={image.mobileSrc} />
          )}
          <img
            src={image.src}
            alt={image.alt || ''}
            className={cn(
              'w-full h-full object-cover',
              enableParallax && 'scale-110'
            )}
          />
        </picture>
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity / 100,
        }}
      />

      {/* Content */}
      <div className={cn(
        'absolute inset-0 flex flex-col p-8',
        positionClasses[textPosition]
      )}>
        <Container maxWidth="narrow" paddingX="gutter">
          <div className="max-w-2xl">
            {content.subheading && (
              <p
                className="text-sm uppercase tracking-wider mb-4 font-medium"
                style={{ color: textColor }}
              >
                {content.subheading}
              </p>
            )}
            {content.title && (
              <h2
                className="font-heading text-impact-h1 xl:text-impact-h1-lg font-semibold tracking-[-0.02em] mb-4"
                style={{ color: textColor }}
              >
                {content.title}
              </h2>
            )}
            {content.description && (
              <p
                className="text-base sm:text-lg mb-6 opacity-90"
                style={{ color: textColor }}
                dangerouslySetInnerHTML={{ __html: content.description }}
              />
            )}
            {content.buttonText && content.buttonLink && (
              <a href={content.buttonLink}>
                <Button
                  variant={content.buttonStyle || 'outline'}
                  size="lg"
                  className={content.buttonStyle === 'outline'
                    ? 'border-current hover:bg-white hover:text-[#1a1a1a]'
                    : ''
                  }
                  style={content.buttonStyle === 'outline' ? { color: textColor, borderColor: textColor } : undefined}
                >
                  {content.buttonText}
                </Button>
              </a>
            )}
          </div>
        </Container>
      </div>
    </section>
  )
}

export default ImageWithTextOverlay
