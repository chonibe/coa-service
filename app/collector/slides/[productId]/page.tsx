"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ChevronUp, ChevronDown, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui"
import type { Slide } from "@/lib/slides/types"
import Image from "next/image"

/**
 * Collector Slides Viewer - Instagram Reels/Stories style
 * 
 * Full-screen vertical snap-scroll experience
 * Swipe up/down to navigate between slides
 */
export default function CollectorSlidesViewer() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  const [slides, setSlides] = useState<Slide[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Fetch slides
  useEffect(() => {
    async function fetchSlides() {
      try {
        setIsLoading(true)
        
        // Try collector endpoint first, fall back to vendor if needed
        let response = await fetch(`/api/collector/slides/${productId}`)
        
        if (!response.ok) {
          // Fall back to vendor endpoint (for preview)
          response = await fetch(`/api/vendor/slides/${productId}`)
        }
        
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch slides")
        }

        setSlides(data.slides || [])
        setError(null)
      } catch (err: any) {
        console.error("Error fetching slides:", err)
        setError(err.message || "Failed to load slides")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSlides()
  }, [productId])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      } else if (e.key === "ArrowDown" && currentIndex < slides.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, slides.length])

  // Handle touch swipe
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isUpSwipe = distance > 50
    const isDownSwipe = distance < -50

    if (isUpSwipe && currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }

    if (isDownSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  // Play audio for current slide
  useEffect(() => {
    if (audioRef.current && slides[currentIndex]?.audio?.url) {
      audioRef.current.src = slides[currentIndex].audio!.url
      if (!isMuted) {
        audioRef.current.play().catch(console.error)
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [currentIndex, slides, isMuted])

  const currentSlide = slides[currentIndex]

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
      </div>
    )
  }

  if (error || slides.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-white/70 mb-4">
            {error || "No slides available"}
          </p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Progress indicators */}
        <div className="flex gap-1 flex-1 mx-4">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-0.5 flex-1 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white'
                  : index < currentIndex
                  ? 'bg-white/50'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Audio toggle */}
        {currentSlide?.audio && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="text-white hover:bg-white/10"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
        )}
      </header>

      {/* Slides Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Current Slide */}
        {currentSlide && (
          <div className="w-full h-full relative">
            {/* Background */}
            <div className="absolute inset-0">
              {currentSlide.background.type === 'image' && currentSlide.background.url && (
                <Image
                  src={currentSlide.background.url}
                  alt={currentSlide.title || `Slide ${currentIndex + 1}`}
                  fill
                  className="object-cover"
                  style={{
                    transform: `scale(${currentSlide.background.scale || 1})`,
                  }}
                  priority
                />
              )}
              {currentSlide.background.type === 'video' && currentSlide.background.url && (
                <video
                  src={currentSlide.background.url}
                  className="w-full h-full object-cover"
                  style={{
                    transform: `scale(${currentSlide.background.scale || 1})`,
                  }}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                />
              )}
              {currentSlide.background.type === 'gradient' && (
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black" />
              )}
            </div>

            {/* Canvas Elements (text, images) */}
            {currentSlide.elements && currentSlide.elements.map((element) => (
              <div
                key={element.id}
                className="absolute"
                style={{
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  transform: `translate(-50%, -50%) scale(${element.scale}) rotate(${element.rotation}deg)`,
                  transformOrigin: 'center',
                }}
              >
                {element.type === 'text' && element.style && (
                  <div
                    className={`px-4 py-2 ${element.style.backgroundColor ? 'rounded-lg' : ''}`}
                    style={{
                      color: element.style.color,
                      backgroundColor: element.style.backgroundColor,
                      fontSize: element.style.fontSize === 'small' ? '14px' :
                                element.style.fontSize === 'medium' ? '18px' :
                                element.style.fontSize === 'large' ? '24px' : '32px',
                      fontWeight: element.style.fontWeight,
                      fontStyle: element.style.fontStyle,
                      textAlign: element.style.textAlign,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {element.content}
                  </div>
                )}
                {element.type === 'image' && (
                  <div className="relative" style={{ width: '200px', height: '200px' }}>
                    <Image
                      src={element.content}
                      alt="Slide element"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Title & Caption Overlay */}
            {(currentSlide.title || currentSlide.caption) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 pb-20">
                {currentSlide.title && (
                  <h2 className="text-white font-bold text-2xl mb-2">
                    {currentSlide.title}
                  </h2>
                )}
                {currentSlide.caption && (
                  <p className="text-white/90 text-base leading-relaxed">
                    {currentSlide.caption}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Hints */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40">
        {currentIndex > 0 && (
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
          >
            <ChevronUp className="w-6 h-6 text-white" />
          </button>
        )}
        {currentIndex < slides.length - 1 && (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
          >
            <ChevronDown className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full z-40">
        <span className="text-white text-sm font-medium">
          {currentIndex + 1} / {slides.length}
        </span>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  )
}
