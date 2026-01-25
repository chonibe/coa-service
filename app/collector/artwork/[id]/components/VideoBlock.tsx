"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState, useRef } from "react"
import { Play, AlertCircle, RefreshCw } from "lucide-react"

interface VideoBlockProps {
  title?: string | null
  contentUrl: string | null
  artworkId?: string
}

export function VideoBlock({ title, contentUrl, artworkId }: VideoBlockProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [videoType, setVideoType] = useState<"youtube" | "vimeo" | "direct" | null>(null)
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!contentUrl) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setHasError(false)

    // Check if it's a direct video file (including Supabase storage URLs)
    const isDirectVideo = contentUrl.match(/\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i) ||
                         contentUrl.includes('supabase.co/storage') ||
                         contentUrl.includes('/storage/v1/object/public/')
    
    if (isDirectVideo) {
      setVideoType("direct")
      setEmbedUrl(contentUrl)
      setIsLoading(false)
      return
    }

    // Convert YouTube/Vimeo URLs to embed format
    let embed = contentUrl
    let type: "youtube" | "vimeo" | "direct" = "direct"

    // YouTube
    const youtubeMatch = contentUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    )
    if (youtubeMatch) {
      embed = `https://www.youtube.com/embed/${youtubeMatch[1]}?enablejsapi=1`
      type = "youtube"
    }

    // Vimeo
    const vimeoMatch = contentUrl.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      embed = `https://player.vimeo.com/video/${vimeoMatch[1]}`
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

  return (
    <Card>
      <CardContent className="p-6">
        {title && <h3 className="font-semibold mb-4">{title}</h3>}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
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
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  ref={iframeRef}
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setIsLoading(false)}
                  onError={handleVideoError}
                />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
