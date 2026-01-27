"use client"

import React, { useEffect } from "react"
import { motion } from "framer-motion"
import { Sparkles, CheckCircle2 } from "lucide-react"

interface UnlockRevealProps {
  artworkName: string
  onComplete?: () => void
}

export default function UnlockReveal({ artworkName, onComplete }: UnlockRevealProps) {
  useEffect(() => {
    // Trigger haptic feedback if available
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100])
    }

    // Auto-complete after animation (shorter duration)
    const timer = setTimeout(() => {
      onComplete?.()
    }, 2000) // Reduced from 4000ms to 2000ms

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 1, filter: "blur(20px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center space-y-6 px-6 max-w-md"
      >
        {/* Success Icon */}
        <div className="relative mx-auto w-24 h-24">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", damping: 12, stiffness: 200 }}
            className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            className="absolute -inset-4 bg-green-600 rounded-full -z-10"
          />
        </div>

        {/* Message */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-green-500" />
            <h2 className="text-3xl font-bold text-white">Authenticated!</h2>
            <Sparkles className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-lg text-gray-300">
            {artworkName}
          </p>
          <p className="text-sm text-gray-400">
            Exclusive content unlocked
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
