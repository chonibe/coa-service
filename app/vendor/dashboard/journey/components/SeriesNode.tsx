"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import type { ArtworkSeries } from "@/types/artwork-series"
import { cn } from "@/lib/utils"

interface SeriesNodeProps {
  series: ArtworkSeries
  position: { x: number; y: number }
  gridSize: number
  cardSize: number
  containerRef?: React.RefObject<HTMLDivElement>
  onDragStart: () => void
  onDragEnd: (position: { x: number; y: number }) => void
  onClick: () => void
}

export function SeriesNode({
  series,
  position,
  gridSize,
  cardSize,
  containerRef,
  onDragStart,
  onDragEnd,
  onClick,
}: SeriesNodeProps) {
  const [isDragging, setIsDragging] = useState(false)

  const isCompleted = series.completed_at !== null
  const progress = series.completion_progress?.percentage_complete || 0
  const isInProgress = !isCompleted && progress > 0

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    onDragStart()
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      e.stopPropagation()
      setIsDragging(false)

      if (containerRef?.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - containerRect.left
        const y = e.clientY - containerRect.top
        onDragEnd({ x, y })
      }
    }
  }

  // Center card in grid square
  const offsetX = (gridSize - cardSize) / 2
  const offsetY = (gridSize - cardSize) / 2

  return (
    <motion.div
      className={cn(
        "absolute cursor-move group",
        isDragging && "z-50 cursor-grabbing"
      )}
      style={{
        left: `${position.x + offsetX}px`,
        top: `${position.y + offsetY}px`,
        width: `${cardSize}px`,
        height: `${cardSize}px`,
      }}
      onMouseDown={handleMouseDown}
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
      {/* Card */}
      <div
        className={cn(
          "relative w-full h-full rounded-lg border-2 shadow-md transition-all",
          "bg-card overflow-hidden",
          isCompleted && "border-green-500 bg-green-50/50 dark:bg-green-950/50",
          isInProgress && "border-blue-500 bg-blue-50/50 dark:bg-blue-950/50",
          !isCompleted && !isInProgress && "border-border bg-card",
          "hover:shadow-lg hover:border-primary"
        )}
      >
        {/* Thumbnail */}
        {series.thumbnail_url ? (
          <img
            src={series.thumbnail_url}
            alt={series.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Status Indicator */}
        <div className="absolute top-1 right-1">
          {isCompleted ? (
            <div className="h-3 w-3 rounded-full bg-green-500 border border-background shadow-sm" />
          ) : isInProgress ? (
            <div className="h-3 w-3 rounded-full bg-blue-500 border border-background shadow-sm" />
          ) : (
            <div className="h-3 w-3 rounded-full bg-muted-foreground/30 border border-background" />
          )}
        </div>

        {/* Progress Bar */}
        {isInProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Series Name Tooltip */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          <div className="bg-background border rounded px-2 py-1 text-xs font-medium shadow-lg">
            {series.name}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
