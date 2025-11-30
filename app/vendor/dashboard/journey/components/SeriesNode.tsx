"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Lock, MapPin } from "lucide-react"
import type { ArtworkSeries, JourneyPosition } from "@/types/artwork-series"
import { cn } from "@/lib/utils"

interface SeriesNodeProps {
  series: ArtworkSeries
  position: { x: number; y: number }
  onDragStart: () => void
  onDragEnd: (position: { x: number; y: number }) => void
  onClick: () => void
}

export function SeriesNode({ series, position, onDragStart, onDragEnd, onClick }: SeriesNodeProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const isCompleted = series.completed_at !== null
  const progress = series.completion_progress?.percentage_complete || 0
  const isInProgress = !isCompleted && progress > 0

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    onDragStart()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.stopPropagation()
      // Position will be updated on mouse up
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      e.stopPropagation()
      setIsDragging(false)
      // Calculate new position based on mouse position
      const container = (e.currentTarget as HTMLElement).closest('[class*="absolute"]')
      if (container) {
        const containerRect = container.getBoundingClientRect()
        const newX = e.clientX - containerRect.left - dragOffset.x
        const newY = e.clientY - containerRect.top - dragOffset.y
        onDragEnd({ x: newX, y: newY })
      }
    }
  }

  return (
    <motion.div
      className={cn(
        "absolute cursor-pointer group",
        "transform -translate-x-1/2 -translate-y-1/2",
        isDragging && "z-50"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation()
          onClick()
        }
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Node Container */}
      <div
        className={cn(
          "relative w-32 h-32 rounded-lg border-2 shadow-lg transition-all",
          "bg-background/90 backdrop-blur-sm",
          isCompleted && "border-green-500 bg-green-50/50 dark:bg-green-900/20",
          isInProgress && "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20",
          !isCompleted && !isInProgress && "border-muted-foreground/30",
          "hover:shadow-xl hover:border-primary"
        )}
      >
        {/* Thumbnail */}
        {series.thumbnail_url ? (
          <img
            src={series.thumbnail_url}
            alt={series.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute -top-2 -right-2">
          {isCompleted ? (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Done
            </Badge>
          ) : isInProgress ? (
            <Badge className="bg-blue-500 text-white">
              <Circle className="h-3 w-3 mr-1" />
              {Math.round(progress)}%
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted">
              <Lock className="h-3 w-3 mr-1" />
              New
            </Badge>
          )}
        </div>

        {/* Progress Ring (for in-progress) */}
        {isInProgress && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted-foreground/20"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                  className="text-blue-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                {Math.round(progress)}%
              </div>
            </div>
          </div>
        )}

        {/* Series Name (on hover) */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-background/95 backdrop-blur-sm border rounded px-2 py-1 text-xs font-medium whitespace-nowrap shadow-lg">
            {series.name}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
