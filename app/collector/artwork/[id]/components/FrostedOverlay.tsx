"use client"

import React from "react"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface FrostedOverlayProps {
  message?: string
  submessage?: string
  className?: string
}

export function FrostedOverlay({
  message = "Tap to reveal",
  submessage = "exclusive content",
  className,
}: FrostedOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        "frosted-glass-dark rounded-lg",
        className
      )}
    >
      <div className="text-center max-w-[280px] bg-background/20 backdrop-blur-sm p-6 rounded-xl border border-white/20">
        <div className="w-12 h-12 rounded-full bg-background/30 backdrop-blur-sm mx-auto mb-3 flex items-center justify-center">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <p className="text-white font-semibold text-lg mb-1">{message}</p>
        <p className="text-white/80 text-sm">{submessage}</p>
      </div>
    </div>
  )
}
