"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Unlock, Sparkles } from "lucide-react"

interface UnlockRevealProps {
  artworkName: string
  onComplete: () => void
}

/**
 * UnlockReveal - Smooth blur-dissolve unlock animation
 * 
 * Features:
 * - Blur-to-clear transition (instead of confetti)
 * - Elegant fade animation
 * - Haptic feedback on mobile (if available)
 * - Fast, premium feel (0.8s)
 */
const UnlockReveal: React.FC<UnlockRevealProps> = ({ artworkName, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Trigger haptic feedback on mobile
    if ("vibrate" in navigator) {
      navigator.vibrate([50, 100, 50])
    }

    // Auto-dismiss after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 500) // Wait for exit animation
    }, 2500)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl"
          onClick={() => {
            setIsVisible(false)
            setTimeout(onComplete, 500)
          }}
        >
          {/* Blur Dissolve Effect */}
          <motion.div
            initial={{ scale: 0.8, filter: "blur(20px)", opacity: 0 }}
            animate={{
              scale: 1,
              filter: "blur(0px)",
              opacity: 1,
            }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1], // Custom easing for smooth feel
            }}
            className="relative"
          >
            {/* Main Content */}
            <div className="relative bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-green-500/20 backdrop-blur-xl rounded-3xl p-12 border-2 border-green-500/30 shadow-2xl max-w-md mx-4">
              {/* Sparkle Effects */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="absolute -top-6 -right-6"
              >
                <Sparkles className="h-12 w-12 text-green-400 drop-shadow-lg" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="absolute -bottom-6 -left-6"
              >
                <Sparkles className="h-10 w-10 text-emerald-400 drop-shadow-lg" />
              </motion.div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.6, type: "spring", bounce: 0.5 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/50"
              >
                <Unlock className="h-12 w-12 text-white" />
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-center"
              >
                <h2 className="text-3xl font-bold text-white mb-3">
                  Unlocked!
                </h2>
                <p className="text-gray-300 text-lg">
                  {artworkName}
                </p>
                <p className="text-gray-400 text-sm mt-4">
                  Exclusive content now available
                </p>
              </motion.div>

              {/* Tap to Continue Hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="text-center text-gray-500 text-xs mt-6"
              >
                Tap anywhere to continue
              </motion.p>
            </div>
          </motion.div>

          {/* Background Glow Effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.3, scale: 2 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-gradient-radial from-green-500/20 via-transparent to-transparent blur-3xl pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default UnlockReveal
