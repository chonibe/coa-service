"use client"

import React, { useState, useRef, useEffect } from "react"
import { Play, Pause, Mic, FileText } from "lucide-react"
import Image from "next/image"

interface VoiceNoteSectionProps {
  title: string
  contentUrl: string
  transcript?: string
  artistPhoto?: string
}

/**
 * VoiceNoteSection - Custom audio player with waveform visualization
 * 
 * Features:
 * - Custom audio player controls
 * - Progress bar with time display
 * - Optional transcript toggle
 * - Artist profile photo display
 * - Mobile-optimized touch targets
 */
const VoiceNoteSection: React.FC<VoiceNoteSectionProps> = ({
  title,
  contentUrl,
  transcript,
  artistPhoto,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration

    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <section className="py-8 md:py-16">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <Mic className="h-6 w-6 text-purple-400" />
        <h2 className="text-2xl md:text-3xl font-bold text-white">Voice Note</h2>
      </div>

      {/* Voice Note Player */}
      <div className="bg-gray-900/50 rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-800/50 backdrop-blur-sm">
        {/* Artist Photo & Title */}
        <div className="flex items-center gap-4 mb-6">
          {artistPhoto && (
            <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-purple-500/30">
              <Image
                src={artistPhoto}
                alt="Artist"
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-semibold text-white truncate">
              {title}
            </h3>
            <p className="text-sm text-gray-400">Personal message from the artist</p>
          </div>
        </div>

        {/* Waveform Visualization (Simplified) */}
        <div className="flex items-center justify-center gap-1 h-24 mb-6 px-4">
          {Array.from({ length: 50 }).map((_, i) => {
            const height = Math.random() * 60 + 20
            const isPast = (i / 50) * 100 < progress
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-300 ${
                  isPast
                    ? "bg-purple-500"
                    : "bg-gray-700"
                }`}
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div
            className="relative h-2 bg-gray-800 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div
              className="absolute h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
            />
          </div>

          {/* Time Display & Play Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={togglePlayPause}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 transition-all shadow-lg hover:shadow-purple-500/50 active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-white fill-white" />
              ) : (
                <Play className="h-6 w-6 text-white fill-white ml-0.5" />
              )}
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Transcript Toggle */}
        {transcript && (
          <div className="mt-6 pt-6 border-t border-gray-800">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">
                {showTranscript ? "Hide" : "Show"} Transcript
              </span>
            </button>

            {showTranscript && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                  {transcript}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={contentUrl} preload="metadata" />
    </section>
  )
}

export default VoiceNoteSection
