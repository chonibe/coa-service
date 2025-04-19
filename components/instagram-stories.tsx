"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, X, Instagram, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { InstagramViewButton } from "./instagram-view-button"

interface InstagramStoriesProps {
  artistName: string
  artistUsername: string
  artistProfilePicture: string
  stories: any[]
  isOpen: boolean
  onClose: () => void
  onStoryView?: (storyId: string) => void
  permissionError?: boolean
}

// Key for storing last story in localStorage
const LAST_STORY_KEY = "last_instagram_story"

export function InstagramStories({
  artistName,
  artistUsername,
  artistProfilePicture,
  stories,
  isOpen,
  onClose,
  onStoryView,
  permissionError,
}: InstagramStoriesProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set())
  const [lastSavedStory, setLastSavedStory] = useState<any | null>(null)

  const hasStories = stories && stories.length > 0

  // Load last saved story from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedStory = localStorage.getItem(LAST_STORY_KEY)
        if (savedStory) {
          setLastSavedStory(JSON.parse(savedStory))
        }
      } catch (error) {
        console.error("Error loading saved story:", error)
      }
    }
  }, [])

  // Save current story to localStorage when viewing
  const saveCurrentStory = (story: any) => {
    if (typeof window !== "undefined" && story) {
      try {
        localStorage.setItem(LAST_STORY_KEY, JSON.stringify(story))
        setLastSavedStory(story)
      } catch (error) {
        console.error("Error saving story:", error)
      }
    }
  }

  // Start progress timer when story is shown
  const startProgress = () => {
    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }

    // Reset progress
    setProgress(0)

    // If we have stories, mark current story as viewed and save it
    if (hasStories && stories[currentIndex]) {
      // Mark current story as viewed
      if (!viewedStories.has(stories[currentIndex].id)) {
        setViewedStories((prev) => {
          const newSet = new Set(prev)
          newSet.add(stories[currentIndex].id)
          return newSet
        })

        if (onStoryView) {
          onStoryView(stories[currentIndex].id)
        }

        // Save current story
        saveCurrentStory(stories[currentIndex])
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
  }

  // Start progress when component mounts or story changes
  useEffect(() => {
    if (isOpen && hasStories) {
      startProgress()
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [currentIndex, isOpen, hasStories])

  // Handle navigation
  const goToNext = () => {
    if (hasStories && currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
      startProgress()
    } else {
      onClose()
    }
  }

  const goToPrev = () => {
    if (hasStories && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      startProgress()
    }
  }

  if (!isOpen) {
    return null
  }

  // Determine what to show - current story, last saved story, or no stories message
  const currentStory = hasStories ? stories[currentIndex] : null
  const storyToShow = currentStory || lastSavedStory

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
            {/* Progress bars - only show if we have current stories */}
            {hasStories && (
              <div className="absolute top-4 left-4 right-4 z-10 flex gap-1">
                {stories.map((_, i) => (
                  <div key={i} className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden">
                    {i === currentIndex && <div className="h-full bg-white" style={{ width: `${progress}%` }} />}
                    {i < currentIndex && <div className="h-full bg-white w-full" />}
                  </div>
                ))}
              </div>
            )}

            {/* Artist info */}
            <div className="absolute top-8 left-4 right-4 z-10 flex items-center">
              <div className="w-8 h-8 rounded-full overflow-hidden p-[1px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                <div className="w-full h-full rounded-full border border-white overflow-hidden">
                  <Image
                    src={artistProfilePicture || "/placeholder.svg"}
                    alt={artistName}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
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
              {!storyToShow && permissionError ? (
                <div className="text-center p-8">
                  <Instagram size={48} className="text-white/50 mx-auto mb-4" />
                  <h3 className="text-white text-xl font-medium mb-2">Stories Not Available</h3>
                  <p className="text-white/70 mb-6">
                    We don't have permission to display {artistName}'s stories directly in this app.
                  </p>
                  <div className="flex flex-col gap-3 max-w-xs mx-auto">
                    <InstagramViewButton
                      username={artistUsername}
                      type="stories"
                      variant="secondary"
                      className="text-white border-white/20 hover:bg-white/10"
                    />
                    <Button
                      variant="outline"
                      className="text-white border-white/20 hover:bg-white/10"
                      onClick={onClose}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : storyToShow ? (
                // Show either current story or last saved story
                <>
                  {storyToShow.media_type === "IMAGE" || storyToShow.media_type === "CAROUSEL_ALBUM" ? (
                    <div className="relative">
                      <Image
                        src={storyToShow.media_url || "/placeholder.svg"}
                        alt="Instagram Story"
                        width={1080}
                        height={1920}
                        className="w-full h-full object-contain"
                      />
                      {!hasStories && lastSavedStory && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                          <div className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center">
                            <Clock size={12} className="mr-1" />
                            <span>Last story from {new Date(lastSavedStory.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <video
                        src={storyToShow.media_url}
                        className="w-full h-full object-contain"
                        autoPlay
                        playsInline
                        muted
                        controls={!hasStories} // Add controls for archived stories
                      />
                      {!hasStories && lastSavedStory && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                          <div className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center">
                            <Clock size={12} className="mr-1" />
                            <span>Last story from {new Date(lastSavedStory.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                // No stories message
                <div className="text-center p-8">
                  <Instagram size={48} className="text-white/50 mx-auto mb-4" />
                  <h3 className="text-white text-xl font-medium mb-2">No Stories Available</h3>
                  <p className="text-white/70 mb-6">
                    {artistName} doesn't have any active stories right now. Check back later!
                  </p>
                  <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={onClose}>
                    Close
                  </Button>
                </div>
              )}
            </div>

            {/* Navigation - only show if we have multiple current stories */}
            {hasStories && stories.length > 1 && (
              <>
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
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
