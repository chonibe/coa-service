"use client"

import { Skeleton, Button } from "@/components/ui"
import { useEffect, useState, useRef } from "react"
import { Play, AlertCircle, RefreshCw, Video } from "lucide-react"

interface VideoBlockProps {
  title?: string | null
  contentUrl: string | null
  artworkId?: string
  blockConfig?: {
    aspectRatio?: "video" | "square" | "portrait" | "auto"
  }
}

// Helper to detect if URL is a direct video file
function isDirectVideoUrl(url: string): boolean {
  // Check file extension
  if (url.match(/\.(mp4|webm|ogg|mov|avi|m4v|mkv)(\?.*)?$/i)) {
    return true
  }
  
  // Check for Supabase storage URLs (multiple patterns)
  if (url.includes('supabase.co/storage')) return true
  if (url.includes('/storage/v1/object/public/')) return true
  if (url.includes('/storage/v1/object/sign/')) return true
  
  // Check for common CDN/storage patterns with video content
  if (url.includes('product-images') && !url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
    // Likely a video in the product-images bucket
    return true
  }
  
  return false
}

export function VideoBlock({ title, contentUrl, artworkId, blockConfig }: VideoBlockProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [videoType, setVideoType] = useState<"youtube" | "vimeo" | "direct" | null>(null)
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlayButton, setShowPlayButton] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Determine aspect ratio class
  const aspectClass = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    auto: "aspect-video", // default
  }[blockConfig?.aspectRatio || "video"]

  useEffect(() => {
    if (!contentUrl) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setHasError(false)
    setShowPlayButton(true)

    // Check if it's a direct video file
    if (isDirectVideoUrl(contentUrl)) {
      setVideoType("direct")
      setEmbedUrl(contentUrl)
      setIsLoading(false)
      return
    }

    // Convert YouTube/Vimeo URLs to embed format
    let embed = contentUrl
    let type: "youtube" | "vimeo" | "direct" = "direct"

    // YouTube - enhanced pattern matching
    const youtubeMatch = contentUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    )
    if (youtubeMatch) {
      embed = `https://www.youtube.com/embed/${youtubeMatch[1]}?enablejsapi=1&rel=0`
      type = "youtube"
    }

    // Vimeo - enhanced pattern matching
    const vimeoMatch = contentUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (vimeoMatch) {
      embed = `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1`
      type = "vimeo"
    }

    setVideoType(type)
    setEmbedUrl(embed)
    setIsLoading(false)
  }, [contentUrl])

  // Track video play event
  useEffect(() => {
    if (!embedUrl || !artworkId || hasTrackedPlay) return

    // Listen for play events from iframe
    const handleMessage = (event: MessageEvent) => {
      // YouTube play event
      if (event.data === "onStateChange" || event.data?.event === "video-play") {
        if (!hasTrackedPlay) {
          trackVideoPlay()
        }
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [embedUrl, artworkId, hasTrackedPlay])

  const trackVideoPlay = async () => {
    if (!artworkId || hasTrackedPlay) return

    try {
      await fetch(`/api/collector/artwork/${artworkId}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventType: "video_play",
          eventData: { url: contentUrl },
        }),
      })
      setHasTrackedPlay(true)
    } catch (err) {
      console.error("Failed to track video play:", err)
    }
  }

  // Track direct video play
  const handleDirectVideoPlay = () => {
    setIsPlaying(true)
    if (!hasTrackedPlay && artworkId) {
      trackVideoPlay()
    }
  }

  const handleVideoError = () => {
    setHasError(true)
    setIsLoading(false)
  }

  const handleRetry = () => {
    setHasError(false)
    setIsLoading(true)
    // Force re-render by toggling the URL
    const currentUrl = embedUrl
    setEmbedUrl(null)
    setTimeout(() => setEmbedUrl(currentUrl), 100)
  }

  if (!contentUrl) return null

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setShowPlayButton(false)
    }
  }

  return (
    <div className="py-8 md:py-12">
      {title && (
        <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
          <Video className="h-5 w-5 text-purple-500" />
          {title}
        </h3>
      )}
      <div className={`relative ${aspectClass} rounded-2xl overflow-hidden bg-black shadow-xl`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-muted">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-sm text-center text-muted-foreground">
              Failed to load video
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={contentUrl} target="_blank" rel="noopener noreferrer">
                  Open in new tab
                </a>
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !hasError && embedUrl && (
          <>
            {videoType === "direct" ? (
              <>
                <video
                  ref={videoRef}
                  src={embedUrl}
                  controls
                  controlsList="nodownload"
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                  onPlay={handleDirectVideoPlay}
                  onError={handleVideoError}
                  onLoadedData={() => setIsLoading(false)}
                  poster=""
                >
                  Your browser does not support the video tag.
                </video>
                {/* Play button overlay for direct videos */}
                {showPlayButton && !isPlaying && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity hover:bg-black/20"
                    onClick={handlePlayClick}
                  >
                    <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                      <Play className="h-10 w-10 text-gray-900 fill-current ml-1" />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <iframe
                ref={iframeRef}
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                onLoad={() => setIsLoading(false)}
                onError={handleVideoError}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
