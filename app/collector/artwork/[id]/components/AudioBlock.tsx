"use client"



import { Skeleton } from "@/components/ui"
import { useRef, useState, useEffect } from "react"
import { Music, AlertCircle, RefreshCw, Play, Pause } from "lucide-react"

import { Card, CardContent, Button } from "@/components/ui"
interface AudioBlockProps {
  title?: string | null
  contentUrl: string | null
  artworkId?: string
}

export function AudioBlock({ title, contentUrl, artworkId }: AudioBlockProps) {
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
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

    const handlePlay = () => {
      setIsPlaying(true)
      if (!hasTrackedPlay) {
        trackAudioPlay()
      }
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleError = () => {
      setHasError(true)
      setIsLoading(false)
    }

    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("error", handleError)
    }
  }, [artworkId, contentUrl, hasTrackedPlay])

  const handleRetry = () => {
    setHasError(false)
    setIsLoading(true)
    if (audioRef.current) {
      audioRef.current.load()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Check if URL is a valid audio file or SoundCloud link
  const isDirectAudio = contentUrl.match(/\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i) ||
                       contentUrl.includes('supabase.co/storage') ||
                       contentUrl.includes('/storage/v1/object/public/')
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
        <div className="p-6 bg-gradient-to-br from-muted to-muted/50 rounded-lg">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Skeleton className="w-full h-12" />
            </div>
          )}

          {hasError && (
            <div className="flex flex-col items-center gap-4 py-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-center text-muted-foreground">
                Failed to load audio
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

          {!hasError && (
            <>
              <div className="flex items-center gap-4 mb-3">
                <Music className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  {duration > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </p>
                  )}
                </div>
              </div>
              <audio
                ref={audioRef}
                src={contentUrl}
                controls
                preload="metadata"
                className="w-full"
                style={{ display: isLoading ? 'none' : 'block' }}
              >
                Your browser does not support the audio element.
              </audio>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
