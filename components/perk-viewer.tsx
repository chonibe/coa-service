"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Clock,
  Gift,
  Flame,
  Lock,
  Trophy,
  AlertTriangle,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Perk, Artist } from "@/types/perks"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import confetti from "canvas-confetti"

interface PerkViewerProps {
  artist: Artist
  perks: Perk[]
  isOpen: boolean
  onClose: () => void
  onPerkViewed: (perkId: string) => void
  streak?: number
  expiryTime?: Date | null
  hasUnclaimedRewards?: boolean
  onClaimReward?: () => void
}

export function PerkViewer({
  artist,
  perks,
  isOpen,
  onClose,
  onPerkViewed,
  streak = 0,
  expiryTime = null,
  hasUnclaimedRewards = false,
  onClaimReward = () => {},
}: PerkViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [showRewardClaim, setShowRewardClaim] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const [showStreakMilestone, setShowStreakMilestone] = useState(false)
  const [nextStreakMilestone, setNextStreakMilestone] = useState(5)
  const [streakProgress, setStreakProgress] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({})
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

  const currentPerk = perks[currentIndex]

  // Calculate time left until expiry
  useEffect(() => {
    if (!expiryTime) return

    const updateTimeLeft = () => {
      const now = new Date()
      const diff = expiryTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft(null)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else {
        setTimeLeft(`${minutes}m`)
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [expiryTime])

  // Calculate streak progress and next milestone
  useEffect(() => {
    if (streak > 0) {
      const nextMilestone = Math.ceil(streak / 5) * 5
      setNextStreakMilestone(nextMilestone)
      setStreakProgress((streak % 5) * 20) // 0-100%

      // Show streak milestone celebration if we just hit a milestone
      if (streak % 5 === 0) {
        setShowStreakMilestone(true)

        // Trigger confetti effect
        if (typeof window !== "undefined") {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          })
        }

        // Hide after 3 seconds
        setTimeout(() => {
          setShowStreakMilestone(false)
        }, 3000)
      }
    }
  }, [streak])

  // Show reward claim if there are unclaimed rewards
  useEffect(() => {
    if (hasUnclaimedRewards && isOpen) {
      // Wait a moment before showing the claim UI
      const timer = setTimeout(() => {
        setShowRewardClaim(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [hasUnclaimedRewards, isOpen])

  // Handle swipe gestures
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      if (info.offset.x > 0 && currentIndex > 0) {
        // Swiped right, go to previous
        setDirection(-1)
        setCurrentIndex(currentIndex - 1)
      } else if (info.offset.x < 0 && currentIndex < perks.length - 1) {
        // Swiped left, go to next
        setDirection(1)
        setCurrentIndex(currentIndex + 1)
      }
    }
  }

  // Navigate to next perk
  const goToNext = () => {
    if (currentIndex < perks.length - 1) {
      setDirection(1)
      setCurrentIndex(currentIndex + 1)
    }
  }

  // Navigate to previous perk
  const goToPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex(currentIndex - 1)
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "ArrowRight" || e.key === " ") {
        goToNext()
      } else if (e.key === "ArrowLeft") {
        goToPrev()
      } else if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, currentIndex, perks.length])

  // Mark perk as viewed and handle media playback
  useEffect(() => {
    if (isOpen && currentPerk) {
      // Mark the current perk as viewed
      onPerkViewed(currentPerk.id)

      // Pause all videos and audio
      Object.values(videoRefs.current).forEach((video) => {
        if (video) video.pause()
      })

      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) audio.pause()
      })

      // Auto-play current media if applicable
      const currentVideo = videoRefs.current[currentPerk?.id]
      if (currentPerk?.type === "video" && currentVideo) {
        currentVideo.currentTime = 0
        currentVideo.play().catch((e) => console.log("Auto-play prevented:", e))
      }

      const currentAudio = audioRefs.current[currentPerk?.id]
      if (currentPerk?.type === "audio" && currentAudio) {
        currentAudio.currentTime = 0
        currentAudio.play().catch((e) => console.log("Auto-play prevented:", e))
      }
    }
  }, [currentIndex, isOpen, currentPerk, onPerkViewed])

  // Handle reward claim
  const handleClaimReward = () => {
    onClaimReward()
    setShowRewardClaim(false)

    // Trigger confetti effect
    if (typeof window !== "undefined") {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
      })
    }
  }

  // Render different perk content based on type
  const renderPerkContent = (perk: Perk) => {
    switch (perk.type) {
      case "video":
        return (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <video
              ref={(el) => el && (videoRefs.current[perk.id] = el)}
              src={perk.src}
              className="max-h-full max-w-full"
              controls
              playsInline
            />
          </div>
        )
      case "audio":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-900/50 to-black/70">
            <div className="max-w-md text-center text-white">
              <h3 className="text-xl font-medium mb-6">{perk.title || "Audio Message"}</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                <audio
                  ref={(el) => el && (audioRefs.current[perk.id] = el)}
                  src={perk.src}
                  controls
                  className="w-full"
                />
              </div>
              {perk.content && <p className="text-sm mt-4">{perk.content}</p>}
            </div>
          </div>
        )
      case "text":
        return (
          <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-b from-gray-900/50 to-black/70">
            <div className="max-w-md text-center text-white">
              <p className="text-xl md:text-2xl font-medium whitespace-pre-wrap">{perk.content}</p>
            </div>
          </div>
        )
      case "personal-message":
        return (
          <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-b from-gray-900/50 to-black/70">
            <div className="max-w-md text-center text-white">
              <div className="flex justify-center mb-4">
                <div className="bg-pink-500/20 backdrop-blur-sm rounded-full p-2">
                  <MessageSquare className="w-6 h-6 text-pink-500" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-medium whitespace-pre-wrap">{perk.content}</p>
              <p className="mt-6 text-sm opacity-70">A personal message from {artist.name}</p>
            </div>
          </div>
        )
      case "link":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-900/50 to-black/70">
            <div className="max-w-md text-center text-white">
              <p className="text-xl md:text-2xl font-medium mb-4">{perk.content || perk.title}</p>
              <a
                href={perk.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium"
              >
                {perk.title || "Open Link"} <ExternalLink size={16} />
              </a>
            </div>
          </div>
        )
      case "code":
        return (
          <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-b from-gray-900/50 to-black/70">
            <div className="max-w-md text-center text-white">
              <p className="text-lg md:text-xl font-medium mb-2">Use code:</p>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                <p className="text-2xl md:text-3xl font-bold tracking-wider">{perk.content}</p>
              </div>
              <p className="text-sm opacity-80">Copy this code for your exclusive discount</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black touch-none"
          ref={containerRef}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src={artist.profile_image_url || "/placeholder.svg"}
                  alt={artist.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white font-medium">{artist.name}</span>

              {/* Streak indicator */}
              {streak > 0 && (
                <div className="flex items-center gap-1 bg-amber-500/20 rounded-full px-2 py-0.5 text-amber-300 text-xs">
                  <Flame className="w-3 h-3" />
                  <span>{streak} day streak</span>
                </div>
              )}
            </div>

            {/* Expiry timer */}
            {timeLeft && (
              <div className="flex items-center gap-1 bg-red-500/20 rounded-full px-2 py-1 text-red-300 text-xs mr-2">
                <Clock className="w-3 h-3" />
                <span>Expires in {timeLeft}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="absolute top-14 left-0 right-0 z-10 flex gap-1 px-4">
            {perks.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full flex-1 transition-all duration-300",
                  i === currentIndex ? "bg-white" : "bg-white/30",
                )}
              />
            ))}
          </div>

          {/* Streak progress */}
          {streak > 0 && (
            <div className="absolute top-[4.5rem] left-0 right-0 z-10 px-4">
              <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                <span>Streak progress</span>
                <span>
                  {streak} / {nextStreakMilestone}
                </span>
              </div>
              <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <Progress value={streakProgress} className="h-full" />
              </div>
            </div>
          )}

          {/* Content */}
          <motion.div drag="x" dragConstraints={containerRef} onDragEnd={handleDragEnd} className="w-full h-full">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                initial={{ opacity: 0, x: direction * 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 300 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 w-full h-full"
              >
                {currentPerk && renderPerkContent(currentPerk)}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Navigation buttons */}
          <div className="absolute inset-y-0 left-0 z-10 flex items-center">
            {currentIndex > 0 && (
              <button
                onClick={goToPrev}
                className="w-12 h-12 flex items-center justify-center text-white opacity-70 hover:opacity-100"
              >
                <ChevronLeft size={24} />
              </button>
            )}
          </div>
          <div className="absolute inset-y-0 right-0 z-10 flex items-center">
            {currentIndex < perks.length - 1 && (
              <button
                onClick={goToNext}
                className="w-12 h-12 flex items-center justify-center text-white opacity-70 hover:opacity-100"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Tap areas for navigation */}
          <div
            className="absolute top-20 bottom-0 left-0 w-1/3 z-5"
            onClick={currentIndex > 0 ? goToPrev : undefined}
          />
          <div
            className="absolute top-20 bottom-0 right-0 w-1/3 z-5"
            onClick={currentIndex < perks.length - 1 ? goToNext : undefined}
          />

          {/* Streak milestone celebration */}
          <AnimatePresence>
            {showStreakMilestone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 flex items-center justify-center bg-black/70 z-20"
              >
                <div className="bg-gradient-to-b from-amber-500/20 to-amber-700/20 backdrop-blur-md rounded-xl p-8 max-w-sm text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-amber-500 rounded-full p-4">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{streak} Day Streak!</h3>
                  <p className="text-white/80 mb-6">
                    Amazing! You've visited {streak} days in a row. Keep coming back for more exclusive content!
                  </p>
                  <Button onClick={() => setShowStreakMilestone(false)}>Continue</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reward claim overlay */}
          <AnimatePresence>
            {showRewardClaim && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 flex items-center justify-center bg-black/70 z-20"
              >
                <div className="bg-gradient-to-b from-emerald-500/20 to-emerald-700/20 backdrop-blur-md rounded-xl p-8 max-w-sm text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-emerald-500 rounded-full p-4">
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Special Reward Unlocked!</h3>
                  <p className="text-white/80 mb-6">
                    Your dedication has earned you a special reward from the artist. Claim it now before it expires!
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button onClick={handleClaimReward} className="bg-emerald-500 hover:bg-emerald-600">
                      Claim Reward
                    </Button>
                    <Button variant="ghost" onClick={() => setShowRewardClaim(false)}>
                      Later
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expiry warning */}
          {timeLeft && timeLeft.includes("1h") && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 text-red-300 text-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>This content expires soon! Don't miss out.</span>
              </motion.div>
            </div>
          )}

          {/* Coming soon teaser */}
          {streak > 0 && streak < 5 && (
            <div className="absolute bottom-4 left-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-white/70 text-xs"
              >
                <Lock className="w-3 h-3" />
                <span>Unlock special content at 5 day streak!</span>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
