"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState, useRef } from "react"

interface VideoBlockProps {
  title?: string | null
  contentUrl: string | null
  artworkId?: string
}

export function VideoBlock({ title, contentUrl, artworkId }: VideoBlockProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [videoType, setVideoType] = useState<"youtube" | "vimeo" | "direct" | null>(null)
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!contentUrl) return

    // Check if it's a direct video file
    const isDirectVideo = contentUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)
    
    if (isDirectVideo) {
      setVideoType("direct")
      setEmbedUrl(contentUrl)
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

    // Also track on iframe load (user interaction)
    const iframe = iframeRef.current
    if (iframe) {
      iframe.addEventListener("load", () => {
        // Track when video starts playing (after a short delay to confirm it's playing)
        setTimeout(() => {
          if (!hasTrackedPlay) {
            trackVideoPlay()
          }
        }, 2000)
      })
    }

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
    if (!hasTrackedPlay && artworkId) {
      trackVideoPlay()
    }
  }

  if (!contentUrl || !embedUrl) return null

  return (
    <Card>
      <CardContent className="p-6">
        {title && <h3 className="font-semibold mb-4">{title}</h3>}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {videoType === "direct" ? (
            <video
              ref={videoRef}
              src={embedUrl}
              controls
              className="w-full h-full"
              onPlay={handleDirectVideoPlay}
              onError={(e) => {
                console.error("Video load error:", e)
              }}
            >
              Your browser does not support the video tag.
              <a href={contentUrl} className="text-blue-600 hover:underline">
                Download video
              </a>
            </video>
          ) : (
            <iframe
              ref={iframeRef}
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => {
                // Track play on user interaction
                if (!hasTrackedPlay && artworkId) {
                  setTimeout(() => trackVideoPlay(), 1000)
                }
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
