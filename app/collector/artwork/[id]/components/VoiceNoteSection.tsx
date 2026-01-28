"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Mic, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, Button } from "@/components/ui"

interface VoiceNoteSectionProps {
  title: string
  contentUrl: string
  config?: {
    transcript?: string
    artistPhoto?: string
  }
}

export default function VoiceNoteSection({ title, contentUrl, config }: VoiceNoteSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  if (!contentUrl) return null

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-violet-500/5">
      <CardContent className="p-6 space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-full bg-purple-500/10">
            <Mic className="h-6 w-6 text-purple-500" />
          </div>
          {title}
        </h2>

        <div className="bg-secondary/50 rounded-xl p-6 sm:p-8 border border-border/50">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Artist Photo */}
            {config?.artistPhoto && (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-purple-500/50">
                <Image
                  src={config.artistPhoto}
                  alt="Artist"
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Audio Controls */}
            <div className="flex-1 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center transition-all shadow-lg hover:scale-105"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 sm:h-6 sm:w-6 text-white fill-white" />
                  ) : (
                    <Play className="h-5 w-5 sm:h-6 sm:w-6 text-white fill-white ml-0.5" />
                  )}
                </button>

                {/* Progress Bar */}
                <div className="flex-1 space-y-1 sm:space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden Audio Element */}
          <audio ref={audioRef} src={contentUrl} preload="metadata" />
        </div>

        {/* Transcript Toggle */}
        {config?.transcript && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-purple-500 hover:text-purple-400 hover:bg-purple-500/10"
            >
              {showTranscript ? "Hide" : "Show"} Transcript
              {showTranscript ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
            
            {showTranscript && (
              <div className="bg-secondary/50 rounded-xl p-6 border border-border/50">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {config.transcript}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
