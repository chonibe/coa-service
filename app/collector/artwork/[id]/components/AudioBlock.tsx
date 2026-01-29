"use client"

import { Skeleton, Button } from "@/components/ui"
import { useRef, useState, useEffect } from "react"
import { Music, AlertCircle, RefreshCw, Play, Pause, Volume2 } from "lucide-react"

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

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Check if URL is a SoundCloud link
  const isSoundCloud = contentUrl.includes("soundcloud.com")

  // For SoundCloud, show a link
  if (isSoundCloud) {
    return (
      <div className="py-8 md:py-12">
        {title && (
          <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
            <Music className="h-5 w-5 text-teal-500" />
            {title}
          </h3>
        )}
        <div className="p-6 bg-muted/30 rounded-2xl">
          <p className="text-sm text-muted-foreground mb-2">SoundCloud Link:</p>
          <a 
            href={contentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
          >
            {contentUrl}
          </a>
          <p className="text-xs text-muted-foreground mt-2">
            Click to open in SoundCloud
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 md:py-12">
      {title && (
        <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">
          <Music className="h-5 w-5 text-teal-500" />
          {title}
        </h3>
      )}
      
      <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-2xl p-6 md:p-8">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Skeleton className="w-full h-16" />
          </div>
        )}

        {hasError && (
          <div className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-10 w-10 text-destructive" />
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

        {!hasError && !isLoading && (
          <div className="space-y-4">
            {/* Custom Audio Player */}
            <div className="flex items-center gap-4">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-500 flex items-center justify-center transition-all shadow-lg hover:scale-105 flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 text-white fill-white" />
                ) : (
                  <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                )}
              </button>

              {/* Progress Bar */}
              <div className="flex-1 space-y-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-teal-500"
                  style={{
                    background: `linear-gradient(to right, rgb(20 184 166) ${(currentTime / duration) * 100 || 0}%, rgb(var(--muted)) ${(currentTime / duration) * 100 || 0}%)`
                  }}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume Icon */}
              <Volume2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>

            {/* Hidden native audio element */}
            <audio
              ref={audioRef}
              src={contentUrl}
              preload="metadata"
              className="hidden"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Loading state with native player fallback */}
        {isLoading && (
          <audio
            ref={audioRef}
            src={contentUrl}
            preload="metadata"
            className="hidden"
          />
        )}
      </div>
    </div>
  )
}
