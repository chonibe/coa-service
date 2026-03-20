'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { Plus, Trash2 } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import { cn } from '@/lib/utils'

interface ArtworkCarouselBarProps {
  selectedArtworks: ShopifyProduct[]
  spotlightPlaceholders?: ShopifyProduct[]
  activeIndex: number
  lampPreviewOrder: string[]
  onTapItem: (index: number) => void
  onRemoveItem: (index: number) => void
  onOpenPicker: () => void
  /** Add a product directly to the cart (used by spotlight placeholder + buttons) */
  onAddProduct?: (product: ShopifyProduct) => void
  /** When false, carousel is minimized (user scrolled past Spline preview) */
  splineInView?: boolean
}

export function ArtworkCarouselBar({
  selectedArtworks,
  spotlightPlaceholders = [],
  activeIndex: _activeIndex,
  lampPreviewOrder,
  onTapItem,
  onRemoveItem,
  onOpenPicker,
  onAddProduct,
  splineInView = true,
}: ArtworkCarouselBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { theme } = useExperienceTheme()
  const [isDesktop, setIsDesktop] = useState(false)
  const isDraggingRef = useRef(false)
  const didDragRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Desktop: center when few items; scroll to end when many so newest items visible, older scroll off left
  useEffect(() => {
    if (!isDesktop || !scrollRef.current || selectedArtworks.length === 0) return
    const el = scrollRef.current
    const scrollToEnd = () => {
      el.scrollLeft = el.scrollWidth - el.clientWidth
    }
    requestAnimationFrame(scrollToEnd)
  }, [isDesktop, selectedArtworks.length])

  // Desktop: drag-to-scroll for smoother sliding
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDesktop || !scrollRef.current) return
    isDraggingRef.current = true
    didDragRef.current = false
    startXRef.current = e.pageX
    scrollLeftRef.current = scrollRef.current.scrollLeft
  }
  const handleClickCapture = (e: React.MouseEvent) => {
    if (didDragRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }
  useEffect(() => {
    if (!isDesktop) return
    const onMouseUp = () => {
      if (isDraggingRef.current) {
        setTimeout(() => { didDragRef.current = false }, 0)
      }
      isDraggingRef.current = false
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !scrollRef.current) return
      if (Math.abs(e.pageX - startXRef.current) > 5) didDragRef.current = true
      e.preventDefault()
      const walk = (e.pageX - startXRef.current) * 1.2
      scrollRef.current.scrollLeft = scrollLeftRef.current - walk
    }
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousemove', onMouseMove, { passive: false })
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [isDesktop])

  const showSpotlightPlaceholders = selectedArtworks.length === 0 && spotlightPlaceholders.length > 0
  const placeholderItems = showSpotlightPlaceholders ? spotlightPlaceholders.slice(0, 2) : []

  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 z-50 pb-safe transition-transform duration-300 ease-out',
        splineInView ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className={cn(
        'relative pt-6 pb-4 px-4 md:pt-10 md:pb-5',
        theme === 'light'
          ? 'bg-gradient-to-t from-white/90 via-white/60 to-transparent'
          : 'bg-gradient-to-t from-black/80 via-black/40 to-transparent'
      )}>
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-full">
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onClickCapture={handleClickCapture}
            className={cn(
              'flex items-end gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory flex-1 min-w-0 pb-3',
              selectedArtworks.length === 0 && 'justify-center pl-3 pr-3',
              selectedArtworks.length > 0 && 'pl-3 pr-3',
              !isDesktop && selectedArtworks.length > 0 && 'pr-28',
              isDesktop && selectedArtworks.length > 0 && 'md:justify-center md:pr-3 cursor-grab active:cursor-grabbing select-none'
            )}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth' }}
          >
            <>
              {selectedArtworks.map((artwork, index) => {
                const imageUrl = artwork.featuredImage?.url || artwork.images?.edges?.[0]?.node?.url
                const isOnLamp = lampPreviewOrder.includes(artwork.id)
                const isFirstItem = index === 0

                return (
                  <div
                    key={`${artwork.id}-${index}`}
                    data-carousel-item
                    className="flex-shrink-0 snap-center flex flex-col items-center gap-1"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemoveItem(index) }}
                        className={cn(
                          'flex items-center justify-center transition-opacity opacity-40 hover:opacity-100',
                          theme === 'light' ? 'text-neutral-700' : 'text-white/80'
                        )}
                        aria-label={`Remove ${artwork.title} from selection`}
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onTapItem(index)}
                      className={cn(
                        'relative block w-24 h-30 rounded-xl transition-all duration-200 aspect-[4/5] active:scale-[0.95]',
                        isOnLamp ? 'opacity-100' : 'opacity-60 hover:opacity-85',
                        isOnLamp && (theme === 'light'
                          ? 'ring-2 ring-[#FFBA94] ring-offset-2 ring-offset-white'
                          : 'ring-2 ring-[#FFBA94] ring-offset-2 ring-offset-[#171515]')
                      )}
                      aria-label={`Select artwork ${index + 1}: ${artwork.title}`}
                      aria-current={isOnLamp ? 'true' : undefined}
                    >
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={getShopifyImageUrl(imageUrl, 400) ?? imageUrl}
                            alt={artwork.title}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="96px"
                            priority={isFirstItem}
                            loading={isFirstItem ? 'eager' : 'lazy'}
                          />
                        ) : (
                          <div className={cn(
                            'w-full h-full flex items-center justify-center',
                            theme === 'light' ? 'bg-neutral-200' : 'bg-neutral-800'
                          )}>
                            <span className={cn(
                              'text-xs',
                              theme === 'light' ? 'text-neutral-600' : 'text-neutral-400'
                            )}>{index + 1}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                  )
              })}
              {placeholderItems.map((artwork, index) => {
                const imageUrl = artwork.featuredImage?.url || artwork.images?.edges?.[0]?.node?.url
                const isFirstItem = index === 0
                return (
                  <div
                    key={`spotlight-placeholder-${artwork.id}`}
                    data-carousel-item
                    className="flex-shrink-0 snap-center flex flex-col items-center gap-1"
                  >
                    <div className="flex items-center justify-center w-5 h-3.5" aria-hidden />
                    <button
                      type="button"
                      onClick={() => onAddProduct ? onAddProduct(artwork) : onOpenPicker()}
                      className={cn(
                        'relative block w-24 h-30 rounded-xl transition-all duration-200 aspect-[4/5] active:scale-[0.95] overflow-hidden',
                        theme === 'light'
                          ? 'ring-1 ring-neutral-300/80 hover:ring-neutral-400'
                          : 'ring-1 ring-white/25 hover:ring-white/35'
                      )}
                      aria-label={`Add ${artwork.title} to collection`}
                    >
                      <div className="absolute inset-0">
                        {imageUrl ? (
                          <Image
                            src={getShopifyImageUrl(imageUrl, 400) ?? imageUrl}
                            alt={artwork.title}
                            fill
                            unoptimized
                            className="object-cover opacity-65"
                            sizes="96px"
                            priority={isFirstItem}
                            loading={isFirstItem ? 'eager' : 'lazy'}
                          />
                        ) : (
                          <div className={cn(
                            'w-full h-full flex items-center justify-center',
                            theme === 'light' ? 'bg-neutral-200' : 'bg-neutral-800'
                          )}>
                            <span className={cn(
                              'text-xs',
                              theme === 'light' ? 'text-neutral-600' : 'text-neutral-400'
                            )}>+</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 text-neutral-900 flex items-center justify-center shadow-sm">
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                      </div>
                    </button>
                  </div>
                )
              })}
              {/* + add card — inline on desktop; fixed on right for mobile */}
              {isDesktop && (
                <div className="flex flex-shrink-0 snap-center flex-col items-center gap-1">
                  <div className={cn('flex items-center justify-center w-5', selectedArtworks.length > 0 ? 'h-3.5' : 'h-5')} aria-hidden />
                  <button
                    type="button"
                    onClick={onOpenPicker}
                    className={cn(
                      'relative flex w-24 h-30 rounded-xl items-center justify-center transition-all duration-200 border-2 border-dashed aspect-[4/5] active:scale-[0.95]',
                      theme === 'light'
                        ? 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 hover:border-neutral-400 text-neutral-600'
                        : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 text-white/80'
                    )}
                    aria-label="Start your Collection"
                  >
                    <Plus className="w-8 h-8" strokeWidth={2} />
                  </button>
                </div>
              )}
              {!isDesktop && selectedArtworks.length === 0 && (
                <div className="flex flex-shrink-0 snap-center flex-col items-center gap-1">
                  <div className="flex items-center justify-center w-5 h-5" aria-hidden />
                  <button
                    type="button"
                    onClick={onOpenPicker}
                    className={cn(
                      'relative flex w-24 h-30 rounded-xl items-center justify-center transition-all duration-200 border-2 border-dashed aspect-[4/5] active:scale-[0.95]',
                      theme === 'light'
                        ? 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 hover:border-neutral-400 text-neutral-600'
                        : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 text-white/80'
                    )}
                    aria-label="Start your Collection"
                  >
                    <Plus className="w-8 h-8" strokeWidth={2} />
                  </button>
                </div>
              )}
            </>
          </div>
          {/* Fixed + button on mobile when items exist — always visible on right */}
          {!isDesktop && selectedArtworks.length > 0 && (
            <div className="absolute right-4 bottom-3 flex flex-col items-center gap-1 z-10">
              <div className="flex items-center justify-center w-5 h-3.5" aria-hidden />
              <button
                type="button"
                onClick={onOpenPicker}
                className={cn(
                  'relative flex w-24 h-30 rounded-xl items-center justify-center transition-all duration-200 border-2 border-dashed shadow-lg aspect-[4/5] active:scale-[0.95]',
                  theme === 'light'
                    ? 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 hover:border-neutral-400 text-neutral-600'
                    : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 text-white/80'
                )}
                aria-label="Start your Collection"
              >
                <Plus className="w-8 h-8" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
        </div>

        {selectedArtworks.length === 0 && !showSpotlightPlaceholders && (
          <p className={cn(
            'text-center text-sm mt-2',
            theme === 'light' ? 'text-neutral-600' : 'text-white/60'
          )}>
            Tap + to start your collection
          </p>
        )}
      </div>
    </div>
  )
}
