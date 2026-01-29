"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Mic, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui"

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
    if (!isFinite(time)) return "0:00"
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

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="py-8 md:py-12">
      <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 mb-6">
        <div className="p-2 rounded-full bg-purple-500/10">
          <Mic className="h-5 w-5 text-purple-500" />
        </div>
        {title || "Voice Note"}
      </h2>

      <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-4 md:gap-6">
          {/* Artist Photo */}
          {config?.artistPhoto && (
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-purple-500/30 shadow-lg">
              <Image
                src={config.artistPhoto}
                alt="Artist"
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Audio Controls */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-4">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center transition-all shadow-lg hover:scale-105 flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 text-white fill-white" />
                ) : (
                  <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                )}
              </button>

              {/* Progress Bar */}
              <div className="flex-1 space-y-2">
                <div className="relative h-2 bg-purple-900/30 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-purple-500 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
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
        <div className="mt-4 space-y-3">
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
            <div className="bg-muted/30 rounded-2xl p-6">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {config.transcript}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
