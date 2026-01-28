"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { ReelSlide } from "./ReelSlide"
import type { Slide } from "@/lib/slides/types"

interface ReelsViewerProps {
  productId: string
  productName: string
  vendorName: string
  slides: Slide[]
  onUnlockRequest?: () => void
  onExitReels?: () => void
}

/**
 * ReelsViewer - Full-screen snap-scroll container for viewing slides
 * 
 * Features:
 * - 100vh vertical snap scroll (TikTok/Reels style)
 * - Swipe up/down to navigate between slides
 * - Auto-play video when slide is active
 * - Back button to exit
 * - "See more" indicator after last slide
 */
export function ReelsViewer({
  productId,
  productName,
  vendorName,
  slides,
  onUnlockRequest,
  onExitReels,
}: ReelsViewerProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Handle scroll to detect active slide
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const scrollTop = container.scrollTop
    const slideHeight = container.clientHeight
    const newIndex = Math.round(scrollTop / slideHeight)

    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < slides.length) {
      setActiveIndex(newIndex)
    }
  }, [activeIndex, slides.length])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  // Handle back button
  const handleBack = () => {
    if (onExitReels) {
      onExitReels()
    } else {
      router.back()
    }
  }

  // Scroll to continue (after last slide indicator)
  const handleContinue = () => {
    if (onExitReels) {
      onExitReels()
    }
  }

  if (slides.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <p className="text-white/60">No slides available</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>

        <div className="text-center flex-1 mx-4">
          <h1 className="text-white font-semibold truncate">{productName}</h1>
          <p className="text-white/60 text-sm truncate">{vendorName}</p>
        </div>

        <div className="w-10" /> {/* Spacer for balance */}
      </header>

      {/* Slides container with snap scroll */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory scroll-smooth"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {slides.map((slide, index) => (
          <ReelSlide
            key={slide.id}
            slide={slide}
            index={index}
            total={slides.length}
            isActive={index === activeIndex}
            onUnlockRequest={onUnlockRequest}
          />
        ))}

        {/* End card - "Continue to artwork details" */}
        <div className="h-screen w-full snap-start snap-always flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black px-8">
          <ChevronDown className="w-8 h-8 text-white/40 mb-4 animate-bounce" />
          <h2 className="text-xl font-semibold text-white mb-2 text-center">
            {productName}
          </h2>
          <p className="text-white/60 text-center mb-8">
            by {vendorName}
          </p>
          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            View Artwork Details
          </button>
        </div>
      </div>

      {/* Scroll indicator dots */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              containerRef.current?.scrollTo({
                top: index * containerRef.current.clientHeight,
                behavior: "smooth",
              })
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeIndex
                ? "bg-white w-2 h-4"
                : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default ReelsViewer
