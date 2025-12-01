"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { MapPin, ArrowRight } from "lucide-react"
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
  onDragMove?: (position: { x: number; y: number }) => void
  onClick: () => void
}

// Format unlock type for display
const formatUnlockType = (type: string) => {
  const types: Record<string, string> = {
    'any_purchase': 'Any Purchase',
    'sequential': 'Sequential',
    'threshold': 'VIP',
    'custom': 'Custom'
  }
  return types[type] || type
}

export function SeriesNode({
  series,
  position,
  gridSize,
  cardSize,
  containerRef,
  onDragStart,
  onDragEnd,
  onDragMove,
  onClick,
}: SeriesNodeProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const nodeRef = useRef<HTMLDivElement>(null)

  const isCompleted = series.completed_at !== null
  const progress = series.completion_progress?.percentage_complete || 0
  const isInProgress = !isCompleted && progress > 0

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (containerRef?.current && nodeRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const nodeRect = nodeRef.current.getBoundingClientRect()
      
      // Calculate offset from mouse to node position
      const offsetX = e.clientX - nodeRect.left - nodeRect.width / 2
      const offsetY = e.clientY - nodeRect.top - nodeRect.height / 2
      
      setDragOffset({ x: offsetX, y: offsetY })
      setIsDragging(true)
      onDragStart()
    }
  }

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef?.current && nodeRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - containerRect.left - dragOffset.x - cardSize / 2
        const y = e.clientY - containerRect.top - dragOffset.y - cardSize / 2
        
        if (onDragMove) {
          onDragMove({ x, y })
        }
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false)
        
        if (containerRef?.current) {
          const containerRect = containerRef.current.getBoundingClientRect()
          const x = e.clientX - containerRect.left - dragOffset.x - cardSize / 2
          const y = e.clientY - containerRect.top - dragOffset.y - cardSize / 2
          onDragEnd({ x, y })
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, containerRef, cardSize, onDragMove, onDragEnd])

  // Center card in grid square
  const offsetX = (gridSize - cardSize) / 2
  const offsetY = (gridSize - cardSize) / 2

  return (
    <motion.div
      ref={nodeRef}
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
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation()
          onClick()
        }
      }}
      whileHover={!isDragging ? { scale: 1.05 } : {}}
      whileTap={!isDragging ? { scale: 0.95 } : {}}
    >
      {/* Card */}
      <div
        className={cn(
          "relative w-full h-full rounded-lg border-2 shadow-md transition-all",
          "bg-card overflow-visible",
          isCompleted && "border-green-500 bg-green-50/50 dark:bg-green-950/50",
          isInProgress && "border-blue-500 bg-blue-50/50 dark:bg-blue-950/50",
          !isCompleted && !isInProgress && "border-border bg-card",
          "hover:shadow-lg hover:border-primary",
          isDragging && "opacity-90"
        )}
      >
        {/* Thumbnail with overlay gradient for text readability */}
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          {series.thumbnail_url ? (
            <img
              src={series.thumbnail_url}
              alt={series.name}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted pointer-events-none">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          {/* Gradient overlay for text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
        </div>

        {/* Series Name - Always visible at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 pointer-events-none z-10">
          <div className="text-xs font-semibold text-white drop-shadow-lg line-clamp-1">
            {series.name}
          </div>
        </div>

        {/* Unlock Type Badge - Top Left */}
        <div className="absolute top-1 left-1 z-10 pointer-events-none">
          <div className="bg-primary/90 text-primary-foreground text-[9px] font-medium px-1.5 py-0.5 rounded shadow-sm">
            {formatUnlockType(series.unlock_type)}
          </div>
        </div>

        {/* Status Indicator - Top Right */}
        <div className="absolute top-1 right-1 z-10 pointer-events-none">
          {isCompleted ? (
            <div className="h-3 w-3 rounded-full bg-green-500 border border-background shadow-sm" />
          ) : isInProgress ? (
            <div className="h-3 w-3 rounded-full bg-blue-500 border border-background shadow-sm" />
          ) : (
            <div className="h-3 w-3 rounded-full bg-muted-foreground/30 border border-background" />
          )}
        </div>

        {/* Hover Arrow Indicator - Center Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 z-20 pointer-events-none rounded-lg">
          <div className="bg-background/90 p-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <ArrowRight className="h-5 w-5 text-foreground" />
          </div>
        </div>

        {/* Progress Bar */}
        {isInProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50 rounded-b-lg pointer-events-none">
            <div
              className="h-full bg-blue-500 transition-all rounded-b-lg"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
