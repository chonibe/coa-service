/**
 * VinylCrateBrowser
 * 
 * Browse artworks like flipping through a crate of vinyl records.
 * Features:
 * - Horizontal drag/swipe navigation with momentum
 * - Stack visualization with peek preview
 * - Keyboard navigation support
 * - Progress indicator
 * 
 * @example
 * ```tsx
 * <VinylCrateBrowser
 *   items={artworks}
 *   renderItem={(item, index, isActive) => (
 *     <VinylArtworkCard {...item} />
 *   )}
 * />
 * ```
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useVinylCrate, type UseVinylCrateOptions } from './useVinylCrate'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface VinylCrateBrowserProps<T> extends Omit<UseVinylCrateOptions, 'itemCount'> {
  /** Array of items to display */
  items: T[]
  /** Render function for each item */
  renderItem: (item: T, index: number, isActive: boolean) => React.ReactNode
  /** Title for the crate section */
  title?: string
  /** Subtitle/description */
  subtitle?: string
  /** Show navigation arrows */
  showArrows?: boolean
  /** Show progress dots */
  showDots?: boolean
  /** Show progress bar */
  showProgressBar?: boolean
  /** Additional className */
  className?: string
  /** Callback when an item is clicked */
  onItemClick?: (item: T, index: number) => void
}

export function VinylCrateBrowser<T>({
  items,
  renderItem,
  title,
  subtitle,
  showArrows = true,
  showDots = false,
  showProgressBar = false,
  className,
  onItemClick,
  defaultIndex = 0,
  infinite = false,
  cardWidth = 280,
  gap = 20,
  onIndexChange,
  draggable = true,
}: VinylCrateBrowserProps<T>) {
  const {
    crateRef,
    wrapperRef,
    activeIndex,
    goTo,
    next,
    prev,
    isAnimating,
    isAtStart,
    isAtEnd,
    progress,
  } = useVinylCrate({
    itemCount: items.length,
    defaultIndex,
    infinite,
    cardWidth,
    gap,
    onIndexChange,
    draggable,
  })

  if (items.length === 0) {
    return null
  }

  return (
    <div className={cn('relative', className)}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-6 flex items-end justify-between">
          <div>
            {title && (
              <h2 className="font-heading text-2xl font-bold text-[#1a1a1a] tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-[#1a1a1a]/60">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Counter */}
          <div className="text-sm font-medium text-[#1a1a1a]/40 tabular-nums">
            {activeIndex + 1} / {items.length}
          </div>
        </div>
      )}

      {/* Crate Container */}
      <div
        ref={crateRef}
        className="relative overflow-hidden cursor-grab active:cursor-grabbing"
        tabIndex={0}
        role="listbox"
        aria-label={title || 'Artwork collection'}
        aria-activedescendant={`crate-item-${activeIndex}`}
      >
        {/* Cards Wrapper */}
        <div
          ref={wrapperRef}
          className="flex touch-pan-y"
          style={{ gap: `${gap}px` }}
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex
            const distance = Math.abs(index - activeIndex)
            
            return (
              <div
                key={index}
                id={`crate-item-${index}`}
                role="option"
                aria-selected={isActive}
                className={cn(
                  'flex-shrink-0 transition-all duration-300',
                  isActive ? 'z-10' : 'z-0'
                )}
                style={{
                  width: cardWidth,
                  transform: isActive 
                    ? 'translateY(-4px) scale(1)'
                    : `translateY(0) scale(${1 - distance * 0.02})`,
                  opacity: 1 - distance * 0.15,
                }}
                onClick={() => {
                  if (index === activeIndex) {
                    onItemClick?.(item, index)
                  } else {
                    goTo(index)
                  }
                }}
              >
                {renderItem(item, index, isActive)}
              </div>
            )
          })}
        </div>

        {/* Stack Shadow Effect */}
        <div 
          className="absolute top-0 bottom-0 right-0 w-32 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, transparent, white 90%)',
          }}
        />
      </div>

      {/* Navigation Arrows */}
      {showArrows && items.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            disabled={isAtStart || isAnimating}
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4',
              'w-12 h-12 rounded-full',
              'bg-white shadow-lg border border-slate-200',
              'flex items-center justify-center',
              'transition-all duration-200',
              'hover:scale-110 hover:shadow-xl',
              'disabled:opacity-0 disabled:pointer-events-none',
              'z-20'
            )}
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          
          <button
            type="button"
            onClick={next}
            disabled={isAtEnd || isAnimating}
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 translate-x-4',
              'w-12 h-12 rounded-full',
              'bg-white shadow-lg border border-slate-200',
              'flex items-center justify-center',
              'transition-all duration-200',
              'hover:scale-110 hover:shadow-xl',
              'disabled:opacity-0 disabled:pointer-events-none',
              'z-20'
            )}
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6 text-slate-700" />
          </button>
        </>
      )}

      {/* Progress Dots */}
      {showDots && items.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              disabled={isAnimating}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                index === activeIndex 
                  ? 'bg-[#1a1a1a] w-6' 
                  : 'bg-[#1a1a1a]/20 hover:bg-[#1a1a1a]/40'
              )}
              aria-label={`Go to item ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {showProgressBar && items.length > 1 && (
        <div className="mt-6 h-1 bg-[#1a1a1a]/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#f0c417] rounded-full transition-all duration-300"
            style={{ width: `${(progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
