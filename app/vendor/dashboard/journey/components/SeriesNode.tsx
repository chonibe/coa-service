"use client"

import { useState, useEffect, useRef } from "react"
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
  onDragMove?: (position: { x: number; y: number }) => void
  onClick: () => void
  onConnectionNodeStart?: (seriesId: string, nodePosition: { x: number; y: number }, side: 'top' | 'bottom' | 'left' | 'right') => void
  isConnectionDragging?: boolean
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
  onConnectionNodeStart,
  isConnectionDragging = false,
}: SeriesNodeProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null)
  const nodeRef = useRef<HTMLDivElement>(null)

  const isCompleted = series.completed_at !== null
  const progress = series.completion_progress?.percentage_complete || 0
  const isInProgress = !isCompleted && progress > 0

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking on a connection node
    if ((e.target as HTMLElement).closest('[data-connection-node]')) {
      return
    }
    
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

  const handleConnectionNodeMouseDown = (e: React.MouseEvent, side: 'top' | 'bottom' | 'left' | 'right') => {
    e.stopPropagation()
    e.preventDefault()
    
    if (onConnectionNodeStart && containerRef?.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const cardRect = e.currentTarget.getBoundingClientRect()
      
      // Calculate node position relative to container
      const nodeX = cardRect.left - containerRect.left + cardRect.width / 2
      const nodeY = cardRect.top - containerRect.top + cardRect.height / 2
      
      onConnectionNodeStart(series.id, { x: nodeX, y: nodeY }, side)
    }
  }

  // Center card in grid square
  const offsetX = (gridSize - cardSize) / 2
  const offsetY = (gridSize - cardSize) / 2

  // Connection node positions
  const nodeSize = 12
  const nodeOffset = 2

  return (
    <motion.div
      ref={nodeRef}
      className={cn(
        "absolute cursor-move group",
        isDragging && "z-50 cursor-grabbing",
        isConnectionDragging && "pointer-events-none"
      )}
      style={{
        left: `${position.x + offsetX}px`,
        top: `${position.y + offsetY}px`,
        width: `${cardSize}px`,
        height: `${cardSize}px`,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        if (!isDragging && !isConnectionDragging) {
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
        {/* Thumbnail */}
        {series.thumbnail_url ? (
          <img
            src={series.thumbnail_url}
            alt={series.name}
            className="w-full h-full object-cover rounded-lg pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg pointer-events-none">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Status Indicator */}
        <div className="absolute top-1 right-1 z-10 pointer-events-none">
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
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50 rounded-b-lg pointer-events-none">
            <div
              className="h-full bg-blue-500 transition-all rounded-b-lg"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Connection Nodes - Top, Bottom, Left, Right */}
        {onConnectionNodeStart && (
          <>
            {/* Top Node */}
            <div
              data-connection-node
              className={cn(
                "absolute left-1/2 -translate-x-1/2 cursor-crosshair z-20 transition-all",
                "hover:scale-125",
                hoveredNode === 'top' && "scale-125"
              )}
              style={{
                top: `${-nodeSize / 2 - nodeOffset}px`,
                width: `${nodeSize}px`,
                height: `${nodeSize}px`,
              }}
              onMouseDown={(e) => handleConnectionNodeMouseDown(e, 'top')}
              onMouseEnter={() => setHoveredNode('top')}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className="w-full h-full rounded-full bg-primary border-2 border-background shadow-lg hover:bg-primary/80" />
            </div>

            {/* Bottom Node */}
            <div
              data-connection-node
              className={cn(
                "absolute left-1/2 -translate-x-1/2 cursor-crosshair z-20 transition-all",
                "hover:scale-125",
                hoveredNode === 'bottom' && "scale-125"
              )}
              style={{
                bottom: `${-nodeSize / 2 - nodeOffset}px`,
                width: `${nodeSize}px`,
                height: `${nodeSize}px`,
              }}
              onMouseDown={(e) => handleConnectionNodeMouseDown(e, 'bottom')}
              onMouseEnter={() => setHoveredNode('bottom')}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className="w-full h-full rounded-full bg-primary border-2 border-background shadow-lg hover:bg-primary/80" />
            </div>

            {/* Left Node */}
            <div
              data-connection-node
              className={cn(
                "absolute top-1/2 -translate-y-1/2 cursor-crosshair z-20 transition-all",
                "hover:scale-125",
                hoveredNode === 'left' && "scale-125"
              )}
              style={{
                left: `${-nodeSize / 2 - nodeOffset}px`,
                width: `${nodeSize}px`,
                height: `${nodeSize}px`,
              }}
              onMouseDown={(e) => handleConnectionNodeMouseDown(e, 'left')}
              onMouseEnter={() => setHoveredNode('left')}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className="w-full h-full rounded-full bg-primary border-2 border-background shadow-lg hover:bg-primary/80" />
            </div>

            {/* Right Node */}
            <div
              data-connection-node
              className={cn(
                "absolute top-1/2 -translate-y-1/2 cursor-crosshair z-20 transition-all",
                "hover:scale-125",
                hoveredNode === 'right' && "scale-125"
              )}
              style={{
                right: `${-nodeSize / 2 - nodeOffset}px`,
                width: `${nodeSize}px`,
                height: `${nodeSize}px`,
              }}
              onMouseDown={(e) => handleConnectionNodeMouseDown(e, 'right')}
              onMouseEnter={() => setHoveredNode('right')}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className="w-full h-full rounded-full bg-primary border-2 border-background shadow-lg hover:bg-primary/80" />
            </div>
          </>
        )}

        {/* Series Name Tooltip */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
          <div className="bg-background border rounded px-2 py-1 text-xs font-medium shadow-lg">
            {series.name}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
