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

  const hasCarouselArtworks = selectedArtworks.length > 0

  const showSpotlightPlaceholders = selectedArtworks.length === 0 && spotlightPlaceholders.length > 0
  const placeholderItems = showSpotlightPlaceholders ? spotlightPlaceholders.slice(0, 2) : []

  /* 12×18 (same 14:21 ratio, smaller); 12px corners */
  /** Carousel thumbs stay w-24; + control scaled down */
  const glassAddButtonClass = cn(
    'flex h-[4.5rem] w-12 shrink-0 items-center justify-center rounded-[12px] border transition-all duration-200 active:scale-[0.95]',
    'backdrop-blur-xl backdrop-saturate-150 shadow-lg',
    theme === 'light'
      ? [
          'border-white/80 bg-white/45 text-neutral-800',
          'shadow-[0_6px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.85)]',
          'hover:bg-white/60 hover:border-white hover:shadow-[0_8px_28px_rgba(0,0,0,0.14)]',
        ]
      : [
          'border-white/30 bg-white/18 text-white',
          'shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]',
          'hover:bg-white/28 hover:border-white/45 hover:shadow-[0_10px_36px_rgba(0,0,0,0.5)]',
        ]
  )

  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 z-50 pb-safe transition-transform duration-300 ease-out',
        splineInView ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="relative pt-6 pb-4 px-4 md:pt-10 md:pb-5">
        {/* Solid fade into page bg — no backdrop blur (avoids “frosted gradient” look) */}
        <div
          className={cn(
            'pointer-events-none absolute bottom-0 left-0 right-0',
            theme === 'light'
              ? 'h-[min(280px,58vh)] bg-gradient-to-t from-[#F5F5F5] via-[#F5F5F5] via-42% to-transparent'
              : 'h-[min(240px,52vh)] bg-gradient-to-t from-[#171515] via-[#171515]/32 to-transparent'
          )}
          aria-hidden
        />
        <div className="relative z-[1] flex flex-col items-center gap-2">
          <div className="relative flex w-full flex-col gap-2">
          <div className="flex flex-col items-center gap-1.5 px-3">
            <button
              type="button"
              onClick={onOpenPicker}
              className={glassAddButtonClass}
              aria-label={hasCarouselArtworks ? 'Add artwork to collection' : 'Start your collection'}
            >
              <Plus className="w-5 h-5" strokeWidth={2.25} />
            </button>
            {!hasCarouselArtworks && (
              <p
                className={cn(
                  'text-center text-sm font-semibold',
                  theme === 'light' ? 'text-neutral-800' : 'text-[#f0e8e8]'
                )}
              >
                Start your Collection
              </p>
            )}
          </div>
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onClickCapture={handleClickCapture}
            className={cn(
              'flex items-end gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory flex-1 min-w-0 pb-3',
              'justify-center pl-3 pr-3',
              isDesktop && hasCarouselArtworks && 'cursor-grab active:cursor-grabbing select-none'
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
                    key={artwork.id}
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
                        'relative block w-24 aspect-[14/20] rounded-[15px] transition-[transform,box-shadow] duration-200 active:scale-[0.95]',
                        isOnLamp
                          ? theme === 'light'
                            ? 'shadow-[inset_0_0_10px_rgba(255,220,200,0.65),inset_0_0_18px_rgba(255,186,148,0.42),0_0_0_2px_rgba(255,160,120,0.9),0_0_14px_rgba(255,186,148,0.45)]'
                            : 'shadow-[inset_0_0_10px_rgba(255,210,185,0.55),inset_0_0_18px_rgba(255,186,148,0.5),0_0_0_2px_rgba(255,200,170,0.95),0_0_16px_rgba(255,186,148,0.55)]'
                          : 'shadow-none'
                      )}
                      aria-label={`Select artwork ${index + 1}: ${artwork.title}`}
                      aria-current={isOnLamp ? 'true' : undefined}
                    >
                      <div className="absolute inset-0 rounded-[15px] overflow-hidden">
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
                        'relative block w-24 aspect-[14/20] rounded-[15px] transition-all duration-200 active:scale-[0.95] overflow-hidden',
                        theme === 'light'
                          ? 'ring-1 ring-neutral-200/95 hover:ring-neutral-100'
                          : 'ring-1 ring-white/45 hover:ring-white/60'
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
            </>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
