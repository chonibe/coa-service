'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Product Gallery Component
 * 
 * Impact Theme Style:
 * - Main image on top
 * - Horizontal thumbnail strip below (Impact theme default)
 * - Optional: Vertical thumbnails on left for desktop (toggle with layout prop)
 * - Transparent/white background
 * - Click thumbnail to change main image
 * - Zoom functionality
 */

export interface ProductImage {
  id: string
  src: string
  alt: string
}

export interface ProductGalleryProps {
  images: ProductImage[]
  productTitle: string
  /** Layout style: 'vertical' (thumbnails on left) or 'horizontal' (thumbnails below - default) */
  layout?: 'vertical' | 'horizontal'
  className?: string
}

export function ProductGallery({ 
  images, 
  productTitle,
  layout = 'horizontal', // Default to Impact theme style
  className 
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isZoomed, setIsZoomed] = React.useState(false)
  
  const selectedImage = images[selectedIndex] || images[0]
  
  if (!images || images.length === 0) {
    return (
      <div className={cn('aspect-square bg-[#f5f5f5] rounded-[16px] flex items-center justify-center', className)}>
        <span className="text-gray-400">No image available</span>
      </div>
    )
  }
  
  // Horizontal layout (Impact theme default) - thumbnails below main image
  if (layout === 'horizontal') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Main Image */}
        <div className="relative aspect-square rounded-[16px] overflow-hidden bg-[#f5f5f5]">
          <img
            src={selectedImage.src}
            alt={selectedImage.alt || productTitle}
            className={cn(
              'w-full h-full object-contain transition-transform duration-300',
              isZoomed && 'scale-150 cursor-zoom-out'
            )}
            onClick={() => setIsZoomed(!isZoomed)}
          />
          
          {/* Zoom Button */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className={cn(
              'absolute bottom-4 right-4',
              'w-10 h-10 rounded-full',
              'bg-white/90 backdrop-blur-sm shadow-lg',
              'flex items-center justify-center',
              'hover:bg-white transition-colors',
              'z-10'
            )}
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            <ZoomIcon isZoomed={isZoomed} />
          </button>
        </div>
        
        {/* Horizontal Thumbnail Strip (below main image) */}
        {images.length > 1 && (
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden transition-all',
                  'border-2 bg-[#f5f5f5]',
                  selectedIndex === index 
                    ? 'border-[#1a1a1a] ring-1 ring-[#1a1a1a]/10' 
                    : 'border-transparent hover:border-[#1a1a1a]/30'
                )}
              >
                <img
                  src={image.src}
                  alt={`${productTitle} - thumbnail ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  // Vertical layout - thumbnails on left (alternative style)
  return (
    <div className={cn('flex gap-4', className)}>
      {/* Vertical Thumbnails (left side) - hidden on mobile */}
      {images.length > 1 && (
        <div className="hidden sm:flex flex-col gap-3 w-20 flex-shrink-0">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative aspect-square rounded-lg overflow-hidden transition-all',
                'border-2 bg-[#f5f5f5]',
                selectedIndex === index 
                  ? 'border-[#1a1a1a]' 
                  : 'border-transparent hover:border-[#1a1a1a]/30'
              )}
            >
              <img
                src={image.src}
                alt={`${productTitle} - thumbnail ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
      
      {/* Main Image */}
      <div className="flex-1 relative">
        <div className="relative aspect-square rounded-[16px] overflow-hidden bg-[#f5f5f5]">
          <img
            src={selectedImage.src}
            alt={selectedImage.alt || productTitle}
            className={cn(
              'w-full h-full object-contain transition-transform duration-300',
              isZoomed && 'scale-150 cursor-zoom-out'
            )}
            onClick={() => setIsZoomed(!isZoomed)}
          />
          
          {/* Zoom Button */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className={cn(
              'absolute bottom-4 right-4',
              'w-10 h-10 rounded-full',
              'bg-white/90 backdrop-blur-sm shadow-lg',
              'flex items-center justify-center',
              'hover:bg-white transition-colors',
              'z-10'
            )}
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            <ZoomIcon isZoomed={isZoomed} />
          </button>
        </div>
        
        {/* Mobile Thumbnail Strip (horizontal, below image) */}
        {images.length > 1 && (
          <div className="sm:hidden flex gap-2 mt-4 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden transition-all',
                  'border-2 bg-[#f5f5f5]',
                  selectedIndex === index 
                    ? 'border-[#1a1a1a]' 
                    : 'border-transparent'
                )}
              >
                <img
                  src={image.src}
                  alt={`${productTitle} - thumbnail ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Zoom icon component
function ZoomIcon({ isZoomed }: { isZoomed: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {isZoomed ? (
        // Zoom out icon
        <>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </>
      ) : (
        // Zoom in icon
        <>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </>
      )}
    </svg>
  )
}

export default ProductGallery
