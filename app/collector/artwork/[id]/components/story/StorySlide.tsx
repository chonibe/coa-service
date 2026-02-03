"use client"

import { useRef, useEffect } from "react"
import Image from "next/image"
import { MapPin } from "lucide-react"
import type { StorySlideProps } from "@/lib/story/types"

/**
 * StorySlide - Single story content display
 * 
 * Displays different content types:
 * - Photo: Full-screen image with object-contain
 * - Voice note: Audio waveform visualization on gradient
 * - Text: Styled text on gradient background
 * 
 * Caption is shown as an overlay at the bottom.
 */
export function StorySlide({ story, isPaused }: StorySlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Pause/play video based on isPaused
  useEffect(() => {
    if ((story.content_type === 'video' || story.content_type === 'photo') && videoRef.current) {
      if (isPaused) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(() => {})
      }
    }
  }, [isPaused, story.content_type])

  // Pause/play audio for voice notes
  useEffect(() => {
    if (story.content_type === 'voice_note' && audioRef.current) {
      if (isPaused) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(() => {})
      }
    }
  }, [isPaused, story.content_type])

  const renderContent = () => {
    switch (story.content_type) {
      case 'photo':
        // Check if it's actually a video
        const isVideo = story.media_url?.match(/\.(mp4|webm|mov)$/i)
        
        if (isVideo) {
          return (
            <video
              ref={videoRef}
              src={story.media_url}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
              loop
            />
          )
        }
        
        return (
          <div className="relative w-full h-full">
            {story.media_url ? (
              <Image
                src={story.media_url}
                alt={story.text_content || "Story photo"}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            ) : story.media_thumbnail_url ? (
              <Image
                src={story.media_thumbnail_url}
                alt={story.text_content || "Story photo"}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                <p className="text-white text-lg">No image available</p>
              </div>
            )}
          </div>
        )

      case 'voice_note':
        return (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex flex-col items-center justify-center px-8">
            {/* Waveform visualization placeholder */}
            <div className="flex items-center gap-1 mb-6">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-white/80 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 40 + 20}px`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
            
            {/* Audio element */}
            {story.media_url && (
              <audio
                ref={audioRef}
                src={story.media_url}
                autoPlay={!isPaused}
              />
            )}
            
            {/* Duration */}
            {story.voice_duration_seconds && (
              <p className="text-white/80 text-sm">
                {Math.floor(story.voice_duration_seconds / 60)}:
                {(story.voice_duration_seconds % 60).toString().padStart(2, '0')}
              </p>
            )}
          </div>
        )

      case 'video':
        return (
          <video
            ref={videoRef}
            src={story.media_url || undefined}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
            loop
            poster={story.media_thumbnail_url || undefined}
          />
        )

      case 'text':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-8">
            <p className="text-white text-2xl font-medium text-center leading-relaxed">
              {story.text_content || "..."}
            </p>
          </div>
        )

      default:
        return (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <p className="text-white/60">Unsupported content type</p>
          </div>
        )
    }
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* Main content */}
      {renderContent()}

      {/* Location tag overlay - top left, below header area */}
      {(story.content_type === 'photo' || story.content_type === 'video') && 
       (story.city || story.country) && (
        <div className="absolute top-20 left-4 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full">
            <MapPin className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-sm font-medium">
              {story.city ? `${story.city}, ${story.country}` : story.country}
            </span>
          </div>
        </div>
      )}
      
      {/* Caption overlay */}
      {story.text_content && story.content_type !== 'text' && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-white text-base leading-relaxed">
            {story.text_content}
          </p>
        </div>
      )}
    </div>
  )
}

export default StorySlide
