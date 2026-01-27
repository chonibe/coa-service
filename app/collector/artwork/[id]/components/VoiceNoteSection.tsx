"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Mic } from "lucide-react"
import Image from "next/image"

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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-3">
        <Mic className="h-6 w-6 text-purple-500" />
        {title}
      </h2>

      <div className="bg-gradient-to-br from-purple-900/20 to-gray-900 rounded-lg p-8 border border-purple-500/20 shadow-xl">
        <div className="flex items-center gap-6">
          {/* Artist Photo */}
          {config?.artistPhoto && (
            <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-purple-500/50">
              <Image
                src={config.artistPhoto}
                alt="Artist"
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Audio Controls */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center transition-colors shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 text-white fill-white" />
                ) : (
                  <Play className="h-6 w-6 text-white fill-white ml-1" />
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
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-sm text-gray-400">
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
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {showTranscript ? "Hide" : "Show"} Transcript ▼
          </button>
          
          {showTranscript && (
            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {config.transcript}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
