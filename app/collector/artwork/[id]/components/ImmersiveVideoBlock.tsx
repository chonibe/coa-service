"use client"

import { Skeleton, Button } from "@/components/ui"
import { useEffect, useState, useRef } from "react"
import { Play, AlertCircle, RefreshCw, Video } from "lucide-react"
import { motion } from "framer-motion"

interface ImmersiveVideoBlockProps {
  title?: string | null
  contentUrl: string | null
  artworkId?: string
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
    return true
  }
  
  return false
}

export function ImmersiveVideoBlock({ title, contentUrl, artworkId }: ImmersiveVideoBlockProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [videoType, setVideoType] = useState<"youtube" | "vimeo" | "direct" | null>(null)
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showPlayOverlay, setShowPlayOverlay] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!contentUrl) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setHasError(false)
    setShowPlayOverlay(true)

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

  const handleDirectVideoPlay = () => {
    setShowPlayOverlay(false)
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
    const currentUrl = embedUrl
    setEmbedUrl(null)
    setTimeout(() => setEmbedUrl(currentUrl), 100)
  }

  if (!contentUrl) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="py-8 md:py-12"
    >
      {title && (
        <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
          <Video className="h-5 w-5 text-purple-500" />
          {title}
        </h3>
      )}
      
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-muted">
            <AlertCircle className="h-16 w-16 text-destructive" />
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
                  className="w-full h-full"
                  onPlay={handleDirectVideoPlay}
                  onError={handleVideoError}
                  onLoadedData={() => setIsLoading(false)}
                />
                {showPlayOverlay && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer group"
                    onClick={() => {
                      videoRef.current?.play()
                      setShowPlayOverlay(false)
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/90 rounded-full p-6 shadow-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors"
                    >
                      <Play className="h-12 w-12 fill-current" />
                    </motion.div>
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
    </motion.div>
  )
}
