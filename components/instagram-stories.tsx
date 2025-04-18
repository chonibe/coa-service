"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, X, Instagram } from "lucide-react"
import { cn } from "@/lib/utils"

interface InstagramStoriesProps {
  artistName: string
  artistUsername: string
  artistProfilePicture: string
  stories: any[]
  isOpen: boolean
  onClose: () => void
  onStoryView?: (storyId: string) => void
}

export function InstagramStories({
  artistName,
  artistUsername,
  artistProfilePicture,
  stories,
  isOpen,
  onClose,
  onStoryView,
}: InstagramStoriesProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set())

  // Start progress timer when story is shown
  const startProgress = () => {
    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }

    // Reset progress
    setProgress(0)

    // Mark current story as viewed
    if (stories[currentIndex] && !viewedStories.has(stories[currentIndex].id)) {
      setViewedStories((prev) => {
        const newSet = new Set(prev)
        newSet.add(stories[currentIndex].id)
        return newSet
      })

      if (onStoryView) {
        onStoryView(stories[currentIndex].id)
      }
    }

    // Set up new interval - stories typically last 15 seconds
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 100 / 150 // 15 seconds = 150 intervals of 100ms

        // If we reach 100%, move to next story
        if (newProgress >= 100) {
          clearInterval(progressInterval.current!)

          // If there are more stories, go to next
          if (currentIndex < stories.length - 1) {
            setTimeout(() => {
              setCurrentIndex(currentIndex + 1)
              startProgress()
            }, 100)
          } else {
            // Otherwise close the stories
            setTimeout(onClose, 300)
          }

          return 100
        }

        return newProgress
      })
    }, 100)
  }

  // Start progress when component mounts or story changes
  useEffect(() => {
    if (isOpen && stories.length > 0) {
      startProgress()
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [currentIndex, isOpen, stories.length])

  // Handle navigation
  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
      startProgress()
    } else {
      onClose()
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      startProgress()
    }
  }

  if (!isOpen || stories.length === 0) {
    return null
  }

  const currentStory = stories[currentIndex]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        >
          {/* Close button */}
          <button onClick={onClose} className="absolute top-4 right-4 z-10 text-white p-2">
            <X size={24} />
          </button>

          {/* Story container */}
          <div className="relative w-full max-w-md h-[80vh] max-h-[800px]">
            {/* Progress bars */}
            <div className="absolute top-4 left-4 right-4 z-10 flex gap-1">
              {stories.map((_, i) => (
                <div key={i} className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden">
                  {i === currentIndex && <div className="h-full bg-white" style={{ width: `${progress}%` }} />}
                  {i < currentIndex && <div className="h-full bg-white w-full" />}
                </div>
              ))}
            </div>

            {/* Artist info */}
            <div className="absolute top-8 left-4 right-4 z-10 flex items-center">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white">
                <Image
                  src={artistProfilePicture || "/placeholder.svg"}
                  alt={artistName}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-2 text-white">
                <div className="text-sm font-medium">{artistName}</div>
                <div className="text-xs opacity-80">{artistUsername}</div>
              </div>
              <div className="ml-auto">
                <Instagram size={16} className="text-white opacity-80" />
              </div>
            </div>

            {/* Story content */}
            <div className="w-full h-full flex items-center justify-center">
              {currentStory.media_type === "IMAGE" || currentStory.media_type === "CAROUSEL_ALBUM" ? (
                <Image
                  src={currentStory.media_url || "/placeholder.svg"}
                  alt="Instagram Story"
                  width={1080}
                  height={1920}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={currentStory.media_url}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  muted
                />
              )}
            </div>

            {/* Navigation */}
            <button
              onClick={goToPrev}
              className={cn(
                "absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start p-4",
                currentIndex === 0 && "pointer-events-none",
              )}
            >
              {currentIndex > 0 && <ChevronLeft size={24} className="text-white opacity-80" />}
            </button>
            <button
              onClick={goToNext}
              className="absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end p-4"
            >
              <ChevronRight size={24} className="text-white opacity-80" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
