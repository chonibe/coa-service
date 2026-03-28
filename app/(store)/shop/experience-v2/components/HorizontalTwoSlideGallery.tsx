'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HorizontalTwoSlideGalleryProps {
  first: ReactNode
  second: ReactNode
  /** When this value changes, the active slide resets to the first panel */
  resetKey?: string
  className?: string
  ariaLabel?: string
}

/**
 * Two full-width panels side by side; navigate with chevrons, dots, or swipe-style intent.
 * Uses CSS transform (not overflow scroll) so it works inside parents with `overflow-x-hidden`.
 */
export function HorizontalTwoSlideGallery({
  first,
  second,
  resetKey = '',
  className,
  ariaLabel = 'Details gallery',
}: HorizontalTwoSlideGalleryProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [resetKey])

  const goTo = useCallback((i: number) => {
    setIndex(Math.max(0, Math.min(1, i)))
  }, [])

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(1, i + 1))
  }, [])

  return (
    <div
      className={cn('relative', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div className="overflow-hidden w-full max-w-full">
        <div
          className="flex w-[200%] transition-transform duration-300 ease-out motion-reduce:transition-none will-change-transform"
          style={{ transform: `translate3d(-${index * 50}%, 0, 0)` }}
        >
          <div className="w-1/2 shrink-0 min-w-0 max-w-[50%] box-border">{first}</div>
          <div className="w-1/2 shrink-0 min-w-0 max-w-[50%] box-border">{second}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={goPrev}
        disabled={index === 0}
        className={cn(
          'absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 dark:bg-[#2a2424]/95 border border-neutral-200/80 dark:border-white/10 shadow-sm flex items-center justify-center text-neutral-700 dark:text-[#e8d8d8] transition-opacity',
          index === 0 && 'opacity-35 pointer-events-none'
        )}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={goNext}
        disabled={index === 1}
        className={cn(
          'absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 dark:bg-[#2a2424]/95 border border-neutral-200/80 dark:border-white/10 shadow-sm flex items-center justify-center text-neutral-700 dark:text-[#e8d8d8] transition-opacity',
          index === 1 && 'opacity-35 pointer-events-none'
        )}
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <div className="flex justify-center gap-1.5 pb-3 pt-1" role="tablist" aria-label="Slides">
        <button
          type="button"
          role="tab"
          aria-selected={index === 0}
          onClick={() => goTo(0)}
          className={cn(
            'h-1.5 rounded-full transition-all min-w-0',
            index === 0 ? 'w-6 bg-neutral-800 dark:bg-white' : 'w-1.5 bg-neutral-300 dark:bg-white/40 hover:bg-neutral-400 dark:hover:bg-white/55'
          )}
          aria-label="First slide"
        />
        <button
          type="button"
          role="tab"
          aria-selected={index === 1}
          onClick={() => goTo(1)}
          className={cn(
            'h-1.5 rounded-full transition-all min-w-0',
            index === 1 ? 'w-6 bg-neutral-800 dark:bg-white' : 'w-1.5 bg-neutral-300 dark:bg-white/40 hover:bg-neutral-400 dark:hover:bg-white/55'
          )}
          aria-label="Second slide"
        />
      </div>
    </div>
  )
}
