"use client"

import React, { useEffect } from "react"
import { motion } from "framer-motion"
import Confetti from "react-confetti"
import { Sparkles, CheckCircle2 } from "lucide-react"
import { useWindowSize } from "@/hooks/use-window-size"

interface UnlockRevealProps {
  artworkName: string
  onComplete?: () => void
}

export function UnlockReveal({ artworkName, onComplete }: UnlockRevealProps) {
  const { width, height } = useWindowSize()

  useEffect(() => {
    // Trigger haptic feedback if available
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200])
    }

    // Auto-complete after animation
    const timer = setTimeout(() => {
      onComplete?.()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md"
    >
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.3}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", damping: 15 }}
        className="text-center space-y-6 px-6 max-w-md"
      >
        {/* Success Icon */}
        <div className="relative mx-auto w-24 h-24">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", damping: 12, stiffness: 200 }}
            className="w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <CheckCircle2 className="w-12 h-12 text-primary-foreground" />
          </motion.div>
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute -inset-4 bg-primary rounded-full -z-10"
          />
        </div>

        {/* Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold">Unlocked!</h2>
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <p className="text-lg text-muted-foreground">
            {artworkName} is now authenticated
          </p>
          <p className="text-sm text-muted-foreground">
            Scroll down to explore exclusive content from the artist
          </p>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center justify-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
