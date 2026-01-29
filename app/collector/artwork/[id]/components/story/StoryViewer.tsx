"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { X, MapPin, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { StoryProgress } from "./StoryProgress"
import { StorySlide } from "./StorySlide"
import { formatRelativeTime, formatLocation } from "@/lib/story/types"
import type { StoryViewerProps, StoryUser } from "@/lib/story/types"

const STORY_DURATION = 5000 // 5 seconds per story

/**
 * StoryViewer - Full-screen Instagram-style story viewer
 * 
 * Features:
 * - Progress bars at top (one per story from current user)
 * - Header with avatar, name, location, timestamp
 * - Tap zones: left 30% = prev, right 30% = next, middle = pause
 * - Swipe left/right = next/prev user
 * - Swipe down = close
 * - Auto-advance timer (5 seconds per slide)
 */
export function StoryViewer({
  users,
  initialUserIndex,
  isOpen,
  onClose,
  onStorySeen,
}: StoryViewerProps) {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [direction, setDirection] = useState(0) // -1 = prev, 1 = next
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressKeyRef = useRef(0) // For resetting progress animation

  const currentUser = users[currentUserIndex]
  const currentStory = currentUser?.stories[currentStoryIndex]

  // Reset to initial state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentUserIndex(initialUserIndex)
      setCurrentStoryIndex(0)
      setIsPaused(false)
      progressKeyRef.current += 1
    }
  }, [isOpen, initialUserIndex])

  // Mark story as seen when it becomes current
  useEffect(() => {
    if (isOpen && currentStory && onStorySeen) {
      onStorySeen(currentStory.id)
    }
  }, [isOpen, currentStory, onStorySeen])

  // Auto-advance timer
  useEffect(() => {
    if (!isOpen || isPaused || !currentUser) return

    timerRef.current = setTimeout(() => {
      goToNextStory()
    }, STORY_DURATION)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [currentStoryIndex, currentUserIndex, isPaused, isOpen, currentUser])

  const goToNextStory = useCallback(() => {
    if (!currentUser) return

    if (currentStoryIndex < currentUser.stories.length - 1) {
      // Next story from same user
      setDirection(1)
      setCurrentStoryIndex(prev => prev + 1)
      progressKeyRef.current += 1
    } else if (currentUserIndex < users.length - 1) {
      // Next user
      setDirection(1)
      setCurrentUserIndex(prev => prev + 1)
      setCurrentStoryIndex(0)
      progressKeyRef.current += 1
    } else {
      // End of all stories
      onClose()
    }
  }, [currentStoryIndex, currentUserIndex, currentUser, users.length, onClose])

  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      // Previous story from same user
      setDirection(-1)
      setCurrentStoryIndex(prev => prev - 1)
      progressKeyRef.current += 1
    } else if (currentUserIndex > 0) {
      // Previous user (go to their last story)
      setDirection(-1)
      const prevUser = users[currentUserIndex - 1]
      setCurrentUserIndex(prev => prev - 1)
      setCurrentStoryIndex(prevUser.stories.length - 1)
      progressKeyRef.current += 1
    }
    // If at the very beginning, do nothing
  }, [currentStoryIndex, currentUserIndex, users])

  const goToNextUser = useCallback(() => {
    if (currentUserIndex < users.length - 1) {
      setDirection(1)
      setCurrentUserIndex(prev => prev + 1)
      setCurrentStoryIndex(0)
      progressKeyRef.current += 1
    } else {
      onClose()
    }
  }, [currentUserIndex, users.length, onClose])

  const goToPrevUser = useCallback(() => {
    if (currentUserIndex > 0) {
      setDirection(-1)
      setCurrentUserIndex(prev => prev - 1)
      setCurrentStoryIndex(0)
      progressKeyRef.current += 1
    }
  }, [currentUserIndex])

  // Handle tap zones
  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const tapPosition = x / width

    if (tapPosition < 0.3) {
      // Left 30% - go to previous
      goToPrevStory()
    } else if (tapPosition > 0.7) {
      // Right 30% - go to next
      goToNextStory()
    }
    // Middle 40% - do nothing on tap (pause is on hold)
  }

  // Handle hold for pause
  const handlePointerDown = () => {
    setIsPaused(true)
  }

  const handlePointerUp = () => {
    setIsPaused(false)
  }

  // Handle swipe gestures
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info

    // Swipe down to close
    if (offset.y > 100 || velocity.y > 500) {
      onClose()
      return
    }

    // Swipe left/right to change user
    if (Math.abs(offset.x) > 100 || Math.abs(velocity.x) > 500) {
      if (offset.x < 0) {
        goToNextUser()
      } else {
        goToPrevUser()
      }
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevStory()
          break
        case 'ArrowRight':
          goToNextStory()
          break
        case 'Escape':
          onClose()
          break
        case ' ':
          setIsPaused(prev => !prev)
          e.preventDefault()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, goToNextStory, goToPrevStory, onClose])

  if (!currentUser || !currentStory) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black"
        >
          <motion.div
            drag
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="relative w-full h-full"
          >
            {/* Story content with slide animation */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${currentUserIndex}-${currentStoryIndex}`}
                initial={{ opacity: 0, x: direction * 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -50 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
                onClick={handleTap}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <StorySlide story={currentStory} isPaused={isPaused} />
              </motion.div>
            </AnimatePresence>

            {/* Progress bars - at top with safe area */}
            <div className="absolute top-0 left-0 right-0 z-10 pt-[env(safe-area-inset-top)]">
              <StoryProgress
                key={progressKeyRef.current}
                totalCount={currentUser.stories.length}
                currentIndex={currentStoryIndex}
                isPaused={isPaused}
                duration={STORY_DURATION}
              />
            </div>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 pt-[calc(env(safe-area-inset-top)+28px)]">
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
                    {currentUser.avatarUrl ? (
                      <Image
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Artist badge */}
                    {currentUser.isArtist && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Name and meta */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-semibold text-sm">
                        {currentUser.name}
                      </span>
                      {currentUser.isArtist && (
                        <span className="text-blue-400 text-xs">Artist</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-white/60 text-xs">
                      {currentStory.city && (
                        <>
                          <MapPin className="w-3 h-3" />
                          <span>{formatLocation(currentStory)}</span>
                          <span>·</span>
                        </>
                      )}
                      <span>{formatRelativeTime(currentStory.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* User indicator dots (optional - shows which user you're viewing) */}
            {users.length > 1 && (
              <div className="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-center gap-1.5 pb-[env(safe-area-inset-bottom)]">
                {users.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentUserIndex
                        ? 'bg-white w-4'
                        : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default StoryViewer
