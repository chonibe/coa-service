'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { type ShopifyMedia } from '@/lib/shopify/storefront-client'

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
 * - Video and 3D model support
 */

export interface ProductImage {
  id: string
  src: string
  alt: string
}

export interface ProductMedia {
  id: string
  type: 'image' | 'video' | 'external_video' | 'model_3d'
  src: string // Main URL or video source
  alt: string
  previewImage?: string // Thumbnail for videos/3D
  // Video-specific
  sources?: Array<{
    url: string
    mimeType: string
    format: string
    width?: number
    height?: number
  }>
  // External video specific
  host?: 'YOUTUBE' | 'VIMEO'
  embeddedUrl?: string
}

export interface ProductGalleryProps {
  images: ProductImage[]
  /** Product media including videos and 3D models */
  media?: ProductMedia[]
  productTitle: string
  /** Layout style: 'vertical' (thumbnails on left) or 'horizontal' (thumbnails below - default) */
  layout?: 'vertical' | 'horizontal'
  className?: string
}

/**
 * Convert Shopify media to ProductMedia format
 */
export function convertShopifyMedia(shopifyMedia: ShopifyMedia[]): ProductMedia[] {
  return shopifyMedia.map((item) => {
    switch (item.mediaContentType) {
      case 'IMAGE':
        return {
          id: item.id,
          type: 'image' as const,
          src: item.image.url,
          alt: item.image.altText || '',
        }
      case 'VIDEO':
        const bestSource = item.sources.reduce((best, current) => 
          (current.height || 0) > (best.height || 0) ? current : best
        , item.sources[0])
        return {
          id: item.id,
          type: 'video' as const,
          src: bestSource?.url || '',
          alt: '',
          previewImage: item.previewImage?.url,
          sources: item.sources,
        }
      case 'EXTERNAL_VIDEO':
        return {
          id: item.id,
          type: 'external_video' as const,
          src: item.embeddedUrl,
          alt: '',
          previewImage: item.previewImage?.url,
          host: item.host,
          embeddedUrl: item.embeddedUrl,
        }
      case 'MODEL_3D':
        const glbSource = item.sources.find(s => s.format === 'glb') || item.sources[0]
        return {
          id: item.id,
          type: 'model_3d' as const,
          src: glbSource?.url || '',
          alt: '',
          previewImage: item.previewImage?.url,
          sources: item.sources.map(s => ({ ...s, width: undefined, height: undefined })),
        }
      default:
        return {
          id: (item as any).id || 'unknown',
          type: 'image' as const,
          src: '',
          alt: '',
        }
    }
  })
}

export function ProductGallery({ 
  images, 
  media,
  productTitle,
  layout = 'horizontal', // Default to Impact theme style
  className 
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isZoomed, setIsZoomed] = React.useState(false)
  const [touchStart, setTouchStart] = React.useState<number | null>(null)
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null)
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  
  // Combine images and media into unified gallery items
  const galleryItems: ProductMedia[] = React.useMemo(() => {
    // If media is provided, use it (includes images, videos, 3D models)
    if (media && media.length > 0) {
      return media
    }
    // Otherwise, convert images to ProductMedia format
    return images.map(img => ({
      id: img.id,
      type: 'image' as const,
      src: img.src,
      alt: img.alt,
    }))
  }, [images, media])
  
  const selectedItem = galleryItems[selectedIndex] || galleryItems[0]
  
  // Legacy: for backwards compatibility
  const selectedImage = images[selectedIndex] || images[0]
  
  // Swipe handlers for mobile
  const minSwipeDistance = 50
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      // Swipe left - next image
      setSelectedIndex((prev) => Math.min(prev + 1, images.length - 1))
    } else if (isRightSwipe) {
      // Swipe right - previous image
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    }
  }
  
  if (galleryItems.length === 0 && (!images || images.length === 0)) {
    return (
      <div className={cn('aspect-square bg-[#f5f5f5] rounded-[16px] flex items-center justify-center', className)}>
        <span className="text-gray-400">No image available</span>
      </div>
    )
  }
  
  // Render the main media item based on type
  const renderMainMedia = () => {
    if (!selectedItem) return null
    
    switch (selectedItem.type) {
      case 'video':
        return (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={selectedItem.src}
              poster={selectedItem.previewImage}
              className="w-full h-full object-contain"
              controls={isVideoPlaying}
              playsInline
              onClick={() => {
                if (!isVideoPlaying) {
                  videoRef.current?.play()
                  setIsVideoPlaying(true)
                }
              }}
            />
            {!isVideoPlaying && (
              <button
                onClick={() => {
                  videoRef.current?.play()
                  setIsVideoPlaying(true)
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1a1a1a">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}
          </div>
        )
      
      case 'external_video':
        if (selectedItem.host === 'YOUTUBE') {
          // Extract video ID from embedded URL
          const videoId = selectedItem.embeddedUrl?.match(/embed\/([^?]+)/)?.[1]
          return (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )
        }
        if (selectedItem.host === 'VIMEO') {
          return (
            <iframe
              src={selectedItem.embeddedUrl}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )
        }
        return null
      
      case 'model_3d':
        // For 3D models, show a preview image with a "View in 3D" button
        // Full 3D viewer would require model-viewer library
        return (
          <div className="relative w-full h-full">
            {selectedItem.previewImage ? (
              <img
                src={selectedItem.previewImage}
                alt={selectedItem.alt || productTitle}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#f5f5f5]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-[#1a1a1a] shadow-lg">
              3D Model
            </div>
          </div>
        )
      
      case 'image':
      default:
        return (
          <img
            src={selectedItem.src}
            alt={selectedItem.alt || productTitle}
            className={cn(
              'w-full h-full object-contain transition-transform duration-300',
              isZoomed && 'scale-150 cursor-zoom-out'
            )}
            onClick={() => setIsZoomed(!isZoomed)}
          />
        )
    }
  }
  
  // Render thumbnail based on media type
  const renderThumbnail = (item: ProductMedia, index: number) => {
    const thumbnailSrc = item.type === 'image' 
      ? item.src 
      : item.previewImage || item.src
    
    return (
      <button
        key={item.id}
        onClick={() => {
          setSelectedIndex(index)
          setIsVideoPlaying(false)
        }}
        className={cn(
          'relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden transition-all',
          'border-2 bg-[#f5f5f5]',
          selectedIndex === index 
            ? 'border-[#1a1a1a] ring-1 ring-[#1a1a1a]/10' 
            : 'border-transparent hover:border-[#1a1a1a]/30'
        )}
      >
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={`${productTitle} - thumbnail ${index + 1}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {item.type === 'video' || item.type === 'external_video' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#999">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : item.type === 'model_3d' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            ) : null}
          </div>
        )}
        {/* Media type indicator */}
        {(item.type === 'video' || item.type === 'external_video') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        {item.type === 'model_3d' && (
          <div className="absolute bottom-1 right-1 bg-white/80 rounded px-1 text-[8px] font-bold">
            3D
          </div>
        )}
      </button>
    )
  }
  
  // Horizontal layout (Impact theme default) - thumbnails below main image
  if (layout === 'horizontal') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Main Media */}
        <div 
          className="relative aspect-square rounded-[16px] overflow-hidden bg-transparent touch-pan-x"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {renderMainMedia()}
          
          {/* Zoom Button - only show for images */}
          {selectedItem?.type === 'image' && (
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
          )}
        </div>
        
        {/* Horizontal Thumbnail Strip (below main image) */}
        {galleryItems.length > 1 && (
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {galleryItems.map((item, index) => renderThumbnail(item, index))}
          </div>
        )}
      </div>
    )
  }
  
  // Vertical layout - thumbnails on left (alternative style)
  return (
    <div className={cn('flex gap-4', className)}>
      {/* Vertical Thumbnails (left side) - hidden on mobile */}
      {galleryItems.length > 1 && (
        <div className="hidden sm:flex flex-col gap-3 w-20 flex-shrink-0">
          {galleryItems.map((item, index) => renderThumbnail(item, index))}
        </div>
      )}
      
      {/* Main Media */}
      <div className="flex-1 relative">
        <div 
          className="relative aspect-square rounded-[16px] overflow-hidden bg-transparent touch-pan-x"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {renderMainMedia()}
          
          {/* Zoom Button - only show for images */}
          {selectedItem?.type === 'image' && (
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
          )}
        </div>
        
        {/* Mobile Thumbnail Strip (horizontal, below image) */}
        {galleryItems.length > 1 && (
          <div className="sm:hidden flex gap-2 mt-4 overflow-x-auto pb-2">
            {galleryItems.map((item, index) => renderThumbnail(item, index))}
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
