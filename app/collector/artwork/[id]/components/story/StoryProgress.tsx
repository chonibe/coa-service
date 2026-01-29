"use client"

import { useEffect, useRef, useState } from "react"
import type { StoryProgressProps } from "@/lib/story/types"

/**
 * StoryProgress - Progress bars for the story viewer
 * 
 * Shows one segment per story from the current user.
 * The current story animates its fill over the duration.
 * Completed stories are full, upcoming are empty.
 * 
 * Uses CSS animation with animation-play-state for proper pause behavior.
 */
export function StoryProgress({
  totalCount,
  currentIndex,
  isPaused,
  duration = 5000,
}: StoryProgressProps) {
  const [key, setKey] = useState(0)

  // Reset animation when currentIndex changes
  useEffect(() => {
    setKey(prev => prev + 1)
  }, [currentIndex])

  return (
    <>
      {/* CSS keyframes for the progress animation */}
      <style jsx>{`
        @keyframes progressFill {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .progress-bar-animated {
          animation: progressFill ${duration}ms linear forwards;
        }
      `}</style>
      
      <div className="flex gap-1 w-full px-2 py-2">
        {Array.from({ length: totalCount }).map((_, index) => (
          <div
            key={index}
            className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden"
          >
            {index < currentIndex ? (
              // Completed segment - full
              <div className="w-full h-full bg-white rounded-full" />
            ) : index === currentIndex ? (
              // Current segment - animated with CSS
              <div
                key={`progress-${key}`}
                className="h-full bg-white rounded-full progress-bar-animated"
                style={{
                  animationPlayState: isPaused ? "paused" : "running",
                }}
              />
            ) : (
              // Upcoming segment - empty (already has bg-white/30 from parent)
              null
            )}
          </div>
        ))}
      </div>
    </>
  )
}

export default StoryProgress
