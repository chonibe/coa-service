"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useRef, useState, useEffect } from "react"

interface AudioBlockProps {
  title?: string | null
  contentUrl: string | null
  artworkId?: string
}

export function AudioBlock({ title, contentUrl, artworkId }: AudioBlockProps) {
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  if (!contentUrl) return null

  const trackAudioPlay = async () => {
    if (!artworkId || hasTrackedPlay) return

    try {
      await fetch(`/api/collector/artwork/${artworkId}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventType: "audio_play",
          eventData: { url: contentUrl },
        }),
      })
      setHasTrackedPlay(true)
    } catch (err) {
      console.error("Failed to track audio play:", err)
    }
  }

  // Track play event when audio starts playing
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !artworkId) return

    const handlePlay = async () => {
      if (hasTrackedPlay) return

      try {
        await fetch(`/api/collector/artwork/${artworkId}/analytics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            eventType: "audio_play",
            eventData: { url: contentUrl },
          }),
        })
        setHasTrackedPlay(true)
      } catch (err) {
        console.error("Failed to track audio play:", err)
      }
    }

    audio.addEventListener("play", handlePlay)

    return () => {
      audio.removeEventListener("play", handlePlay)
    }
  }, [hasTrackedPlay, artworkId, contentUrl])

  // Check if URL is a valid audio file or SoundCloud link
  const isDirectAudio = contentUrl.match(/\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i)
  const isSoundCloud = contentUrl.includes("soundcloud.com")

  // For SoundCloud, we'll need to use their embed widget
  if (isSoundCloud) {
    return (
      <Card>
        <CardContent className="p-6">
          {title && <h3 className="font-semibold mb-4">{title}</h3>}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">SoundCloud Link:</p>
            <a 
              href={contentUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {contentUrl}
            </a>
            <p className="text-xs text-muted-foreground mt-2">
              Click to open in SoundCloud
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        {title && <h3 className="font-semibold mb-4">{title}</h3>}
        <div className="p-4 bg-muted rounded-lg">
          <audio
            ref={audioRef}
            src={contentUrl}
            controls
            className="w-full"
            onError={(e) => {
              console.error("Audio load error:", e)
            }}
          >
            Your browser does not support the audio element.
            <a href={contentUrl} className="text-blue-600 hover:underline ml-2">
              Download audio
            </a>
          </audio>
        </div>
      </CardContent>
    </Card>
  )
}
