"use client"

import { useState, useRef } from "react"
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
      ref={nodeRef}
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
      {/* Node Container */}
      <div
        className={cn(
          "relative w-20 h-20 rounded border transition-all",
          "bg-background",
          isCompleted && "border-green-500 bg-green-50 dark:bg-green-950",
          isInProgress && "border-blue-500 bg-blue-50 dark:bg-blue-950",
          !isCompleted && !isInProgress && "border-border bg-muted",
          "hover:border-primary"
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

        {/* Path Order Indicator */}
        {series.milestone_order !== null && series.milestone_order !== undefined && (
          <div className="absolute -top-2 -left-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold border-2 border-background">
            {series.milestone_order + 1}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute -top-1 -right-1">
          {isCompleted ? (
            <div className="h-3 w-3 rounded-full bg-green-500 border border-background" />
          ) : isInProgress ? (
            <div className="h-3 w-3 rounded-full bg-blue-500 border border-background" />
          ) : (
            <div className="h-3 w-3 rounded-full bg-muted-foreground/30 border border-background" />
          )}
        </div>

        {/* Progress indicator (simple bar at bottom) */}
        {isInProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div 
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Series Name (on hover) */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-background border rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap">
            {series.name}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
