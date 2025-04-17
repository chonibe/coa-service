"use client"

import { useState, useEffect } from "react"
import type { PresenceType } from "@/lib/artwork-presence"
import { cn } from "@/lib/utils"

interface ArtworkPresenceIndicatorProps {
  presenceType: PresenceType
  onClick?: () => void
}

export function ArtworkPresenceIndicator({ presenceType, onClick }: ArtworkPresenceIndicatorProps) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    // Start animation after a short delay
    const timer = setTimeout(() => {
      setAnimate(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Define different visual representations for each presence type
  const presenceStyles: Record<PresenceType, string> = {
    ambient: "bg-blue-500/20 border-blue-500/40",
    provocative: "bg-red-500/20 border-red-500/40",
    evolving: "bg-purple-500/20 border-purple-500/40",
    responsive: "bg-green-500/20 border-green-500/40",
    territorial: "bg-amber-500/20 border-amber-500/40",
  }

  // Define different animation patterns for each presence type
  const presenceAnimations: Record<PresenceType, string> = {
    ambient: "animate-pulse-slow",
    provocative: "animate-flicker",
    evolving: "animate-morph",
    responsive: "animate-breathe",
    territorial: "animate-expand",
  }

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none transition-opacity duration-1000",
        animate ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Ambient glow/aura around the artwork */}
      <div
        className={cn(
          "absolute inset-0 border-2 rounded-lg transition-all duration-1000",
          presenceStyles[presenceType],
          animate && presenceAnimations[presenceType],
        )}
      />

      {/* Interactive element */}
      {onClick && (
        <button
          onClick={onClick}
          className={cn(
            "absolute bottom-4 left-4 rounded-full w-10 h-10 flex items-center justify-center",
            "pointer-events-auto cursor-pointer transition-all duration-300",
            "backdrop-blur-sm border",
            presenceStyles[presenceType],
            "hover:scale-110",
          )}
          aria-label="Explore artwork presence"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-800"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M12 18v-6"></path>
            <path d="M8 15h8"></path>
          </svg>
        </button>
      )}
    </div>
  )
}
