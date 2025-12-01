"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { ArtworkSeries, JourneyPosition } from "@/types/artwork-series"
import { SeriesNode } from "./SeriesNode"

interface JourneyMapCanvasProps {
  series: ArtworkSeries[]
  onSeriesClick: (seriesId: string) => void
  onPositionUpdate: (seriesId: string, position: JourneyPosition) => void
}

// Grid constants - chess board style
const GRID_SIZE = 120 // Size of each grid square in pixels
const CARD_SIZE = 100 // Size of card (slightly smaller than grid for spacing)

export function JourneyMapCanvas({
  series,
  onSeriesClick,
  onPositionUpdate,
}: JourneyMapCanvasProps) {
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [draggedPosition, setDraggedPosition] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasInitializedRef = useRef(false)

  // Snap position to grid
  const snapToGrid = useCallback((x: number, y: number) => {
    const gridX = Math.round(x / GRID_SIZE) * GRID_SIZE
    const gridY = Math.round(y / GRID_SIZE) * GRID_SIZE
    return { x: gridX, y: gridY }
  }, [])

  // Check if position is occupied (strict grid position matching)
  const isPositionOccupied = useCallback(
    (x: number, y: number, excludeId?: string) => {
      const gridX = Math.round(x / GRID_SIZE) * GRID_SIZE
      const gridY = Math.round(y / GRID_SIZE) * GRID_SIZE
      
      return series.some((s) => {
        if (s.id === excludeId) return false
        const pos = s.journey_position
        if (!pos || pos.x === undefined || pos.y === undefined) return false
        
        const storedGridX = Math.round(pos.x / GRID_SIZE) * GRID_SIZE
        const storedGridY = Math.round(pos.y / GRID_SIZE) * GRID_SIZE
        
        return storedGridX === gridX && storedGridY === gridY
      })
    },
    [series]
  )

  // Find nearest free grid position
  const findNearestFreePosition = useCallback(
    (x: number, y: number, excludeId?: string) => {
      const snapped = snapToGrid(x, y)
      
      if (!isPositionOccupied(snapped.x, snapped.y, excludeId)) {
        return snapped
      }

      // Search in expanding spiral pattern
      const maxRadius = 20
      for (let radius = 1; radius <= maxRadius; radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
              const checkX = snapped.x + dx * GRID_SIZE
              const checkY = snapped.y + dy * GRID_SIZE
              
              if (checkX >= 0 && checkY >= 0) {
                if (!isPositionOccupied(checkX, checkY, excludeId)) {
                  return { x: checkX, y: checkY }
                }
              }
            }
          }
        }
      }

      // Fallback: scan grid
      for (let row = 0; row < 50; row++) {
        for (let col = 0; col < 20; col++) {
          const checkX = col * GRID_SIZE
          const checkY = row * GRID_SIZE
          if (!isPositionOccupied(checkX, checkY, excludeId)) {
            return { x: checkX, y: checkY }
          }
        }
      }

      return snapped
    },
    [snapToGrid, isPositionOccupied]
  )

  // Get grid position (always normalized to grid)
  const getGridPosition = useCallback((s: ArtworkSeries) => {
    // If this is the dragged node, use the dragged position
    if (draggedNode === s.id && draggedPosition) {
      return draggedPosition
    }
    
    if (s.journey_position?.x !== undefined && s.journey_position?.y !== undefined) {
      const x = Math.round(s.journey_position.x / GRID_SIZE) * GRID_SIZE
      const y = Math.round(s.journey_position.y / GRID_SIZE) * GRID_SIZE
      return { x, y }
    }
    return { x: 0, y: 0 }
  }, [draggedNode, draggedPosition])

  // Validate and fix overlapping positions on load (only once on mount)
  useEffect(() => {
    if (hasInitializedRef.current) return
    if (series.length === 0) return
    
    // Use a timeout to batch updates and only run once
    const timeoutId = setTimeout(() => {
      if (hasInitializedRef.current) return
      
      series.forEach((s) => {
        if (s.journey_position?.x !== undefined && s.journey_position?.y !== undefined) {
          const normalized = snapToGrid(s.journey_position.x, s.journey_position.y)
          
          if (isPositionOccupied(normalized.x, normalized.y, s.id)) {
            const freePos = findNearestFreePosition(normalized.x, normalized.y, s.id)
            onPositionUpdate(s.id, {
              ...s.journey_position,
              x: freePos.x,
              y: freePos.y,
            })
          } else if (normalized.x !== s.journey_position.x || normalized.y !== s.journey_position.y) {
            onPositionUpdate(s.id, {
              ...s.journey_position,
              x: normalized.x,
              y: normalized.y,
            })
          }
        }
      })
      
      hasInitializedRef.current = true
    }, 100)
    
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Auto-arrange series on grid if they don't have positions (only on initial load)
  useEffect(() => {
    if (hasInitializedRef.current) return
    if (series.length === 0) return
    
    const seriesWithoutPositions = series.filter(
      (s) => !s.journey_position || s.journey_position.x === undefined || s.journey_position.y === undefined
    )

    if (seriesWithoutPositions.length === 0) {
      hasInitializedRef.current = true
      return
    }

    // Use a timeout to batch updates and only run once
    const timeoutId = setTimeout(() => {
      if (hasInitializedRef.current) return
      
      const sorted = [...seriesWithoutPositions].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        // Sort by created_at ascending (oldest first)
        return dateA - dateB
      })

      sorted.forEach((s, index) => {
        const row = Math.floor(index / 8)
        const col = index % 8
        const x = col * GRID_SIZE
        const y = row * GRID_SIZE
        
        const freePos = findNearestFreePosition(x, y, s.id)
        
        if (!isPositionOccupied(freePos.x, freePos.y, s.id)) {
          onPositionUpdate(s.id, { x: freePos.x, y: freePos.y, level: row })
        } else {
          const alternativePos = findNearestFreePosition(x + GRID_SIZE, y, s.id)
          onPositionUpdate(s.id, { x: alternativePos.x, y: alternativePos.y, level: row })
        }
      })
      
      hasInitializedRef.current = true
    }, 100)
    
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Calculate grid dimensions
  const maxX = Math.max(
    ...series
      .filter((s) => s.journey_position?.x !== undefined)
      .map((s) => s.journey_position!.x || 0),
    0
  )
  const maxY = Math.max(
    ...series
      .filter((s) => s.journey_position?.y !== undefined)
      .map((s) => s.journey_position!.y || 0),
    0
  )
  const gridWidth = Math.max(maxX + GRID_SIZE * 2, 1000)
  const gridHeight = Math.max(maxY + GRID_SIZE * 2, 600)

  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/50">
        <p className="text-muted-foreground">No series to display. Create a series to see it on your journey map.</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full border rounded-lg overflow-auto bg-background"
      style={{ height: '600px' }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
      />

      {/* Series Nodes on Grid */}
      <div
        className="relative z-30"
        style={{ width: `${gridWidth}px`, height: `${gridHeight}px` }}
      >
        {series.map((s) => {
          const position = getGridPosition(s)
          return (
            <SeriesNode
              key={s.id}
              series={s}
              position={position}
              gridSize={GRID_SIZE}
              cardSize={CARD_SIZE}
              containerRef={containerRef}
              onDragStart={() => {
                setDraggedNode(s.id)
                const currentPos = getGridPosition(s)
                setDraggedPosition(currentPos)
              }}
              onDragMove={(newPosition) => {
                // Allow free movement while dragging, but snap for visual feedback
                const freePos = findNearestFreePosition(newPosition.x, newPosition.y, s.id)
                // Use the free position for "magnetic" snapping effect while dragging
                // Or just snap to nearest grid point
                const normalizedPos = snapToGrid(freePos.x, freePos.y)
                setDraggedPosition(normalizedPos)
              }}
              onDragEnd={(newPosition) => {
                const freePos = findNearestFreePosition(newPosition.x, newPosition.y, s.id)
                const normalizedPos = snapToGrid(freePos.x, freePos.y)
                
                if (!isPositionOccupied(normalizedPos.x, normalizedPos.y, s.id)) {
                  onPositionUpdate(s.id, {
                    ...s.journey_position,
                    x: normalizedPos.x,
                    y: normalizedPos.y,
                  })
                } else {
                  const altPos = findNearestFreePosition(
                    normalizedPos.x + GRID_SIZE,
                    normalizedPos.y,
                    s.id
                  )
                  onPositionUpdate(s.id, {
                    ...s.journey_position,
                    x: altPos.x,
                    y: altPos.y,
                  })
                }
                setDraggedNode(null)
                setDraggedPosition(null)
              }}
              onClick={() => onSeriesClick(s.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
