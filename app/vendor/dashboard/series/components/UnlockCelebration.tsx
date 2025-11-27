"use client"

import { motion } from "framer-motion"
import { Sparkles, Trophy, Star } from "lucide-react"

interface UnlockCelebrationProps {
  show: boolean
  onComplete: () => void
  message?: string
}

export function UnlockCelebration({ show, onComplete, message = "Unlocked!" }: UnlockCelebrationProps) {
  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2000)
      }}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <div className="relative">
        {/* Background overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-full"
        />

        {/* Celebration content */}
        <div className="relative flex flex-col items-center justify-center p-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Trophy className="h-24 w-24 text-yellow-400" />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-white mt-4"
          >
            {message}
          </motion.h2>

          {/* Sparkles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                x: Math.cos((i * Math.PI * 2) / 12) * 100,
                y: Math.sin((i * Math.PI * 2) / 12) * 100,
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.1,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
              className="absolute"
            >
              <Star className="h-4 w-4 text-yellow-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

