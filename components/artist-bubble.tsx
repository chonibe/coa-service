"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Clock, Flame, Gift } from "lucide-react"

interface ArtistBubbleProps {
  artist: {
    id: string
    name: string
    profileImageUrl: string
  }
  onOpen: () => void
  className?: string
  hasNewContent?: boolean
  expiryTime?: Date | null
  streak?: number
  showScarcity?: boolean
  hasUnclaimedRewards?: boolean
}

export function ArtistBubble({
  artist,
  onOpen,
  className,
  hasNewContent = false,
  expiryTime = null,
  streak = 0,
  showScarcity = false,
  hasUnclaimedRewards = false,
}: ArtistBubbleProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const [pulseEffect, setPulseEffect] = useState(false)

  // Animate in after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

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

      // Add pulse effect when less than 2 hours remain
      if (diff < 2 * 60 * 60 * 1000) {
        setPulseEffect(true)
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [expiryTime])

  // Random subtle movements to attract attention
  const [randomMovement, setRandomMovement] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (hasNewContent || hasUnclaimedRewards) {
      const interval = setInterval(() => {
        setRandomMovement({
          x: Math.random() * 4 - 2, // -2 to 2
          y: Math.random() * 4 - 2, // -2 to 2
        })
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [hasNewContent, hasUnclaimedRewards])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            x: randomMovement.x,
            y: randomMovement.y,
          }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          className={cn("fixed bottom-6 right-6 z-50 cursor-pointer", "md:bottom-8 md:right-8", className)}
          onClick={onOpen}
        >
          <div className="relative">
            {/* Main bubble */}
            <div
              className={cn(
                "w-16 h-16 rounded-full overflow-hidden border-2 shadow-lg",
                "md:w-18 md:h-18",
                hasNewContent && "border-pink-500",
                !hasNewContent && "border-white",
                pulseEffect && "animate-pulse",
              )}
            >
              <Image
                src={artist.profileImageUrl || "/placeholder.svg"}
                alt={artist.name}
                width={72}
                height={72}
                className="w-full h-full object-cover"
              />

              {/* Glow effect for new content */}
              {hasNewContent && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/30 to-purple-500/30"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 2,
                  }}
                />
              )}
            </div>

            {/* New content indicator */}
            {hasNewContent && (
              <motion.div
                className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-md"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span>New</span>
              </motion.div>
            )}

            {/* Streak indicator */}
            {streak >= 3 && (
              <motion.div
                className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center shadow-md"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                style={{ width: streak >= 10 ? "24px" : "20px", height: streak >= 10 ? "24px" : "20px" }}
              >
                <Flame className="w-3 h-3" />
                <span className="text-xs">{streak}</span>
              </motion.div>
            )}

            {/* Unclaimed rewards indicator */}
            {hasUnclaimedRewards && (
              <motion.div
                className="absolute -bottom-1 -left-1 bg-emerald-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-md"
                initial={{ scale: 0 }}
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2,
                  delay: 0.5,
                }}
              >
                <Gift className="w-3 h-3" />
              </motion.div>
            )}

            {/* Expiry timer */}
            {timeLeft && (
              <motion.div
                className={cn(
                  "absolute -top-8 right-0 bg-black/80 text-white text-xs rounded-full px-2 py-1 flex items-center gap-1",
                  pulseEffect && "text-red-300",
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Clock className="w-3 h-3" />
                <span>{timeLeft}</span>
              </motion.div>
            )}

            {/* Scarcity message */}
            {showScarcity && (
              <motion.div
                className="absolute -top-8 -left-20 bg-black/80 text-white text-xs rounded-full px-2 py-1 whitespace-nowrap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                Limited availability
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
