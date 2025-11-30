"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import type { ArtworkSeries, JourneyPosition } from "@/types/artwork-series"
import { cn } from "@/lib/utils"

interface SeriesNodeProps {
  series: ArtworkSeries
  position: { x: number; y: number }
  containerRef?: React.RefObject<HTMLDivElement>
  onDragStart: () => void
  onDragEnd: (position: { x: number; y: number }) => void
  onClick: () => void
}

export function SeriesNode({ series, position, containerRef, onDragStart, onDragEnd, onClick }: SeriesNodeProps) {
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
      
      // Simple position calculation - just get mouse position relative to container
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
        "transform -translate-x-1/2 -translate-y-1/2",
        isDragging && "z-50 cursor-grabbing"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
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
      {/* Card Container - Timeline Style */}
      <div
        className={cn(
          "relative w-64 rounded-lg border-2 shadow-md transition-all",
          "bg-card",
          isCompleted && "border-green-500 bg-green-50/50 dark:bg-green-950/50",
          isInProgress && "border-blue-500 bg-blue-50/50 dark:bg-blue-950/50",
          !isCompleted && !isInProgress && "border-border bg-card",
          "hover:shadow-lg hover:border-primary"
        )}
      >
        {/* Thumbnail */}
        <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
          {series.thumbnail_url ? (
            <img
              src={series.thumbnail_url}
              alt={series.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <MapPin className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>

        {/* Card Content */}
        <div className="p-3 space-y-2">
          {/* Series Name */}
          <h3 className="font-semibold text-sm line-clamp-2">{series.name}</h3>
          
          {/* Progress Info */}
          {series.completion_progress && (
            <div className="text-xs text-muted-foreground">
              {series.completion_progress.sold_artworks} / {series.completion_progress.total_artworks} sold
            </div>
          )}
        </div>

        {/* Timeline Order Badge */}
        {series.milestone_order !== null && series.milestone_order !== undefined && (
          <div className="absolute -top-3 -left-3 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold border-2 border-background shadow-md">
            {series.milestone_order + 1}
          </div>
        )}

        {/* Status Indicator */}
        <div className="absolute top-2 right-2">
          {isCompleted ? (
            <div className="h-4 w-4 rounded-full bg-green-500 border-2 border-background shadow-sm" title="Completed" />
          ) : isInProgress ? (
            <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-background shadow-sm" title="In Progress" />
          ) : (
            <div className="h-4 w-4 rounded-full bg-muted-foreground/30 border-2 border-background" title="Not Started" />
          )}
        </div>

        {/* Progress Bar */}
        {isInProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted/50 rounded-b-lg overflow-hidden">
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
