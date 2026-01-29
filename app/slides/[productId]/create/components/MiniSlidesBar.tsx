"use client"

import { useEffect, useRef } from "react"
import { Check } from "lucide-react"
import type { Slide } from "@/lib/slides/types"
import Image from "next/image"

interface MiniSlidesBarProps {
  slides: Slide[]
  activeSlideId: string
  onSlideSelect: (slideId: string) => void
}

/**
 * MiniSlidesBar - Instagram Stories style bottom navigation
 * 
 * Shows mini thumbnails of all slides, with active slide highlighted.
 * Tap to switch editing context.
 */
export function MiniSlidesBar({ slides, activeSlideId, onSlideSelect }: MiniSlidesBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)

  // Scroll active slide into view
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeSlideId])

  return (
    <div className="w-full bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 py-3">
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId
          const hasContent = (slide.elements && slide.elements.length > 0) || slide.title || slide.caption

          return (
            <div
              key={slide.id}
              ref={isActive ? activeRef : null}
              onClick={() => onSlideSelect(slide.id)}
              className="flex-shrink-0 w-16 cursor-pointer touch-none"
            >
              <div
                className={`relative aspect-[9/16] rounded-lg overflow-hidden ${
                  isActive
                    ? 'ring-2 ring-white shadow-lg'
                    : 'ring-1 ring-white/20'
                }`}
              >
                {/* Slide preview - show background */}
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black">
                  {slide.background.type === 'image' && slide.background.url && (
                    <Image
                      src={slide.background.url}
                      alt={`Slide ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  )}
                  {slide.background.type === 'video' && slide.background.url && (
                    <video
                      src={slide.background.url}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {!slide.background.url && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white/30 text-xs">{index + 1}</span>
                    </div>
                  )}
                </div>

                {/* Completion indicator */}
                {hasContent && (
                  <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute inset-0 bg-white/10" />
                )}
              </div>

              {/* Slide number */}
              <div className="text-center mt-1">
                <span className={`text-xs font-medium ${
                  isActive ? 'text-white' : 'text-white/50'
                }`}>
                  {index + 1}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
