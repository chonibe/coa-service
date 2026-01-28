"use client"

import { useRef, useEffect, useState } from "react"
import { Lock, Volume2, VolumeX, Music } from "lucide-react"
import type { Slide, CanvasElement } from "@/lib/slides/types"
import { GRADIENT_PRESETS } from "@/lib/slides/types"

interface ReelSlideProps {
  slide: Slide
  index: number
  total: number
  isActive: boolean
  onUnlockRequest?: () => void
}

/**
 * ReelSlide - Full-screen slide renderer for collector view
 * 
 * Renders a slide in the Reels/TikTok style:
 * - Full viewport height (100vh)
 * - Background layer with zoom/pan
 * - Text/image elements positioned on canvas
 * - Title and caption overlay
 * - Audio indicator
 * - Locked content handling
 */
export function ReelSlide({
  slide,
  index,
  total,
  isActive,
  onUnlockRequest,
}: ReelSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)

  // Auto-play/pause video when slide becomes active
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {})
      } else {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
    }
  }, [isActive])

  // Get background style
  const getBackgroundStyle = (): React.CSSProperties => {
    const bg = slide.background
    if (!bg) return { backgroundColor: "#1a1a1a" }

    const style: React.CSSProperties = {}

    if (bg.type === "gradient" && bg.value) {
      const preset = GRADIENT_PRESETS[bg.value as keyof typeof GRADIENT_PRESETS]
      if (preset) {
        style.background = `linear-gradient(135deg, ${preset.from}, ${preset.to})`
      }
    } else if (bg.type === "solid" && bg.value) {
      style.backgroundColor = bg.value
    } else if (bg.type === "image" && bg.url) {
      style.backgroundImage = `url(${bg.url})`
      style.backgroundSize = bg.scale && bg.scale !== 1 ? `${bg.scale * 100}%` : "cover"
      const x = 50 + (bg.offsetX || 0)
      const y = 50 + (bg.offsetY || 0)
      style.backgroundPosition = `${x}% ${y}%`
    }

    return style
  }

  // Render text element
  const renderTextElement = (element: CanvasElement) => {
    const textStyle = element.style || {}
    
    const fontSizeMap: Record<string, string> = {
      small: "0.875rem",
      medium: "1.125rem",
      large: "1.5rem",
      xlarge: "2rem",
    }

    return (
      <div
        key={element.id}
        className="absolute max-w-[90%] pointer-events-none"
        style={{
          left: `${element.x}%`,
          top: `${element.y}%`,
          transform: `translate(-50%, -50%) scale(${element.scale}) rotate(${element.rotation}deg)`,
          color: textStyle.color || "#ffffff",
          fontSize: fontSizeMap[textStyle.fontSize || "large"],
          fontWeight: textStyle.fontWeight || "normal",
          fontStyle: textStyle.fontStyle || "normal",
          textAlign: textStyle.textAlign || "center",
          backgroundColor: textStyle.backgroundColor,
          padding: textStyle.backgroundColor ? "8px 16px" : undefined,
          borderRadius: textStyle.backgroundColor ? "8px" : undefined,
          textShadow: textStyle.backgroundColor ? "none" : "0 2px 8px rgba(0,0,0,0.6)",
        }}
      >
        {element.content}
      </div>
    )
  }

  // Render image element
  const renderImageElement = (element: CanvasElement) => {
    return (
      <div
        key={element.id}
        className="absolute pointer-events-none"
        style={{
          left: `${element.x}%`,
          top: `${element.y}%`,
          transform: `translate(-50%, -50%) scale(${element.scale}) rotate(${element.rotation}deg)`,
        }}
      >
        <img
          src={element.content}
          alt=""
          className="max-w-[200px] max-h-[200px] object-contain rounded-lg shadow-lg"
          draggable={false}
        />
      </div>
    )
  }

  // Handle locked slide
  if (slide.is_locked) {
    return (
      <div
        className="h-screen w-full snap-start snap-always relative flex items-center justify-center"
        style={getBackgroundStyle()}
      >
        {/* Blur overlay */}
        <div className="absolute inset-0 backdrop-blur-xl bg-black/40" />

        {/* Lock content */}
        <div className="relative z-10 text-center px-8">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {slide.title || "Exclusive Content"}
          </h3>
          <p className="text-white/70 mb-6">
            Authenticate with NFC to unlock this content
          </p>
          <button
            onClick={onUnlockRequest}
            className="px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            Unlock Now
          </button>
        </div>

        {/* Slide counter */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {index + 1} / {total}
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-screen w-full snap-start snap-always relative overflow-hidden"
      style={getBackgroundStyle()}
    >
      {/* Video background */}
      {slide.background.type === "video" && slide.background.url && (
        <video
          ref={videoRef}
          src={slide.background.url}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
          style={{
            transform: slide.background.scale && slide.background.scale !== 1
              ? `scale(${slide.background.scale})`
              : undefined,
          }}
        />
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

      {/* Canvas elements */}
      {slide.elements.map((element) => {
        if (element.type === "text") return renderTextElement(element)
        if (element.type === "image") return renderImageElement(element)
        return null
      })}

      {/* Title and caption */}
      {(slide.title || slide.caption) && (
        <div className="absolute bottom-24 left-0 right-0 px-6 pointer-events-none">
          {slide.title && (
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
              {slide.title}
            </h2>
          )}
          {slide.caption && (
            <p className="text-white/90 text-base leading-relaxed drop-shadow-md">
              {slide.caption}
            </p>
          )}
        </div>
      )}

      {/* Audio indicator */}
      {slide.audio && (
        <div className="absolute bottom-24 right-4 flex items-center gap-2 bg-black/40 backdrop-blur px-3 py-2 rounded-full">
          <Music className="w-4 h-4 text-white" />
          <span className="text-white text-xs max-w-[100px] truncate">
            {slide.audio.title || "Audio"}
          </span>
        </div>
      )}

      {/* Video mute toggle */}
      {slide.background.type === "video" && (
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 right-4 p-3 bg-black/40 backdrop-blur rounded-full"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      )}

      {/* Slide counter */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {index + 1} / {total}
      </div>
    </div>
  )
}

export default ReelSlide
