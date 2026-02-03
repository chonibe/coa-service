"use client"

import { Lock, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

interface LockedOverlayProps {
  message?: string
  submessage?: string
}

export function LockedOverlay({ 
  message = "Exclusive Content", 
  submessage = "Pair your NFC tag to unlock" 
}: LockedOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-xl"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative"
      >
        {/* Animated glow effect */}
        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl animate-pulse rounded-full" />
        
        {/* Lock icon */}
        <div className="relative bg-white rounded-full p-5 shadow-xl border border-gray-200">
          <Lock className="h-10 w-10 text-gray-700" />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-5 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <h3 className="font-semibold text-lg text-gray-900">{message}</h3>
          <Sparkles className="h-4 w-4 text-indigo-500" />
        </div>
        <p className="text-sm text-gray-500">{submessage}</p>
      </motion.div>
    </motion.div>
  )
}
