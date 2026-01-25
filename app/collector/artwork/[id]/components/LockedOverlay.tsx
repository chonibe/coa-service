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
      className="absolute inset-0 z-10 frosted-overlay flex flex-col items-center justify-center p-6 rounded-lg"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative"
      >
        {/* Animated glow effect */}
        <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse rounded-full" />
        
        {/* Lock icon */}
        <div className="relative bg-background/90 rounded-full p-6 shadow-2xl border border-primary/20">
          <Lock className="h-12 w-12 text-primary" />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-6 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-lg">{message}</h3>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">{submessage}</p>
      </motion.div>
    </motion.div>
  )
}
