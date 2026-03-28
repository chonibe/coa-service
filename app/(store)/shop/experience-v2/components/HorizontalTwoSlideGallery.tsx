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
 * Two full-width panels side by side; navigate with chevrons.
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
          'absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200/70 bg-white/85 text-neutral-600 backdrop-blur-sm dark:border-white/10 dark:bg-[#1f1b1b]/80 dark:text-[#d8c8c8] transition-opacity touch-manipulation',
          index === 0 && 'pointer-events-none opacity-25'
        )}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={goNext}
        disabled={index === 1}
        className={cn(
          'absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200/70 bg-white/85 text-neutral-600 backdrop-blur-sm dark:border-white/10 dark:bg-[#1f1b1b]/80 dark:text-[#d8c8c8] transition-opacity touch-manipulation',
          index === 1 && 'pointer-events-none opacity-25'
        )}
        aria-label="Next slide"
      >
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  )
}
