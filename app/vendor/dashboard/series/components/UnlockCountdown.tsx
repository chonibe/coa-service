"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface UnlockCountdownProps {
  unlockAt?: string
  unlockSchedule?: any
  className?: string
}

export function UnlockCountdown({
  unlockAt,
  unlockSchedule,
  className,
}: UnlockCountdownProps) {
  const [countdown, setCountdown] = useState<string>("")
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()

      if (unlockAt) {
        const unlockTime = new Date(unlockAt)
        const diff = unlockTime.getTime() - now.getTime()

        if (diff <= 0) {
          setIsUnlocked(true)
          setCountdown("Unlocked")
          return
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        if (days > 0) {
          setCountdown(`${days}d ${hours}h`)
        } else if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m`)
        } else if (minutes > 0) {
          setCountdown(`${minutes}m ${seconds}s`)
        } else {
          setCountdown(`${seconds}s`)
        }
      } else if (unlockSchedule) {
        // Handle recurring schedule
        const [hours, minutes] = unlockSchedule.time.split(":").map(Number)
        const nextUnlock = new Date(now)
        nextUnlock.setHours(hours, minutes, 0, 0)

        if (now >= nextUnlock) {
          nextUnlock.setDate(nextUnlock.getDate() + 1)
        }

        const diff = nextUnlock.getTime() - now.getTime()
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60))
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        if (hoursLeft > 0) {
          setCountdown(`Unlocks in ${hoursLeft}h ${minutesLeft}m`)
        } else {
          setCountdown(`Unlocks in ${minutesLeft}m`)
        }
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [unlockAt, unlockSchedule])

  if (!unlockAt && !unlockSchedule) return null

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 text-sm",
        isUnlocked ? "text-green-600" : "text-muted-foreground",
        className
      )}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Clock className="h-4 w-4" />
      <span className="font-medium">{countdown}</span>
    </motion.div>
  )
}

