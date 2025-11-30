"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import type { ArtworkSeries } from "@/types/artwork-series"
import { cn } from "@/lib/utils"

interface SeriesNodeProps {
  series: ArtworkSeries
  position: { x: number; y: number }
  nodeWidth: number
  nodeHeight: number
  containerRef?: React.RefObject<HTMLDivElement>
  onDragStart: () => void
  onDragEnd: (position: { x: number; y: number }) => void
  onClick: () => void
}

export function SeriesNode({
  series,
  position,
  nodeWidth,
  nodeHeight,
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

  return (
    <motion.div
      className={cn(
        "absolute cursor-move group",
        isDragging && "z-50 cursor-grabbing"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${nodeWidth}px`,
        height: `${nodeHeight}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation()
          onClick()
        }
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Flowchart Node Box */}
      <div
        className={cn(
          "relative w-full h-full rounded-lg border-2 shadow-lg transition-all",
          "bg-card overflow-hidden flex flex-col",
          isCompleted && "border-green-500 bg-green-50/50 dark:bg-green-950/50",
          isInProgress && "border-blue-500 bg-blue-50/50 dark:bg-blue-950/50",
          !isCompleted && !isInProgress && "border-border bg-card",
          "hover:shadow-xl hover:border-primary"
        )}
      >
        {/* Thumbnail */}
        <div className="relative h-20 w-full overflow-hidden">
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
        </div>

        {/* Content */}
        <div className="flex-1 p-2 flex flex-col justify-between">
          {/* Series Name */}
          <h3 className="font-semibold text-sm line-clamp-1 mb-1">{series.name}</h3>
          
          {/* Progress Info */}
          {series.completion_progress && (
            <div className="text-xs text-muted-foreground">
              {series.completion_progress.sold_artworks} / {series.completion_progress.total_artworks}
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="absolute top-2 right-2">
          {isCompleted ? (
            <div className="h-3 w-3 rounded-full bg-green-500 border-2 border-background shadow-sm" />
          ) : isInProgress ? (
            <div className="h-3 w-3 rounded-full bg-blue-500 border-2 border-background shadow-sm" />
          ) : (
            <div className="h-3 w-3 rounded-full bg-muted-foreground/30 border-2 border-background" />
          )}
        </div>

        {/* Progress Bar */}
        {isInProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted/50">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
