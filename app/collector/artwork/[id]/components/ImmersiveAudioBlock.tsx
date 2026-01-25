"use client"


import { Skeleton } from "@/components/ui"
import { useRef, useState, useEffect } from "react"
import { Music, AlertCircle, RefreshCw, Play, Pause, Volume2 } from "lucide-react"
import { motion } from "framer-motion"
import { Slider } from "@/components/ui"

import { Button } from "@/components/ui"
interface ImmersiveAudioBlockProps {
  title?: string | null
  contentUrl: string | null
  artworkId?: string
  artworkImageUrl?: string | null
}

export function ImmersiveAudioBlock({ 
  title, 
  contentUrl, 
  artworkId,
  artworkImageUrl 
}: ImmersiveAudioBlockProps) {
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
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

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => {
      setIsPlaying(true)
      if (!hasTrackedPlay && artworkId) {
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
  }, [artworkId, hasTrackedPlay])

  const togglePlayPause = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  const handleSeek = (value: number[]) => {
    if (!audioRef.current || !duration) return
    const newTime = (value[0] / 100) * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return
    const newVolume = value[0] / 100
    audioRef.current.volume = newVolume
    setVolume(newVolume)
  }

  const handleRetry = () => {
    setHasError(false)
    setIsLoading(true)
    if (audioRef.current) {
      audioRef.current.load()
    }
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const isSoundCloud = contentUrl.includes("soundcloud.com")

  if (isSoundCloud) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="my-8"
      >
        {title && <h3 className="text-2xl font-bold mb-4">{title}</h3>}
        <div className="p-6 bg-gradient-to-br from-muted to-muted/50 rounded-2xl shadow-lg">
          <p className="text-sm text-muted-foreground mb-2">SoundCloud Track:</p>
          <a 
            href={contentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all font-medium"
          >
            {contentUrl}
          </a>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="my-8"
    >
      {title && (
        <h3 className="text-2xl font-bold mb-4 text-center md:text-left">{title}</h3>
      )}
      
      <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5">
        {/* Background artwork image (blurred) */}
        {artworkImageUrl && (
          <div className="absolute inset-0 opacity-10 blur-3xl scale-110">
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${artworkImageUrl})` }}
            />
          </div>
        )}

        <div className="relative p-8 md:p-12">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Skeleton className="w-full h-24" />
            </div>
          )}

          {hasError && (
            <div className="flex flex-col items-center gap-4 py-12">
              <AlertCircle className="h-16 w-16 text-destructive" />
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
            <div className="space-y-6">
              {/* Music icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse rounded-full" />
                  <div className="relative bg-primary/10 rounded-full p-8">
                    <Music className="h-16 w-16 text-primary" />
                  </div>
                </div>
              </div>

              {/* Play/Pause button */}
              <div className="flex justify-center">
                <Button
                  variant="default"
                  size="lg"
                  className="rounded-full w-16 h-16 p-0"
                  onClick={togglePlayPause}
                  disabled={isLoading}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 fill-current" />
                  ) : (
                    <Play className="h-6 w-6 fill-current ml-1" />
                  )}
                </Button>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <Slider
                  value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                  className="cursor-pointer"
                  disabled={!duration}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume control */}
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <Slider
                  value={[volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="flex-1"
                />
              </div>

              {/* Hidden native audio element */}
              <audio
                ref={audioRef}
                src={contentUrl}
                preload="metadata"
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
