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
  const containerRef = useRef<HTMLDivElement>(null)

  // Snap position to grid
  const snapToGrid = useCallback((x: number, y: number) => {
    const gridX = Math.round(x / GRID_SIZE) * GRID_SIZE
    const gridY = Math.round(y / GRID_SIZE) * GRID_SIZE
    return { x: gridX, y: gridY }
  }, [])

  // Check if position is occupied (strict grid position matching)
  const isPositionOccupied = useCallback(
    (x: number, y: number, excludeId?: string) => {
      // Normalize to grid coordinates
      const gridX = Math.round(x / GRID_SIZE) * GRID_SIZE
      const gridY = Math.round(y / GRID_SIZE) * GRID_SIZE
      
      return series.some((s) => {
        if (s.id === excludeId) return false
        const pos = s.journey_position
        if (!pos || pos.x === undefined || pos.y === undefined) return false
        
        // Normalize stored position to grid
        const storedGridX = Math.round(pos.x / GRID_SIZE) * GRID_SIZE
        const storedGridY = Math.round(pos.y / GRID_SIZE) * GRID_SIZE
        
        return storedGridX === gridX && storedGridY === gridY
      })
    },
    [series]
  )

  // Find nearest free grid position (guaranteed to find a free square)
  const findNearestFreePosition = useCallback(
    (x: number, y: number, excludeId?: string) => {
      const snapped = snapToGrid(x, y)
      
      // If snapped position is free, use it
      if (!isPositionOccupied(snapped.x, snapped.y, excludeId)) {
        return snapped
      }

      // Search in expanding spiral pattern for nearest free position
      const maxRadius = 20
      for (let radius = 1; radius <= maxRadius; radius++) {
        // Check all positions at this radius
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            // Only check positions on the perimeter of this radius
            if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
              const checkX = snapped.x + dx * GRID_SIZE
              const checkY = snapped.y + dy * GRID_SIZE
              
              // Ensure non-negative coordinates
              if (checkX >= 0 && checkY >= 0) {
                if (!isPositionOccupied(checkX, checkY, excludeId)) {
                  return { x: checkX, y: checkY }
                }
              }
            }
          }
        }
      }

      // Final fallback: scan entire grid systematically
      for (let row = 0; row < 50; row++) {
        for (let col = 0; col < 20; col++) {
          const checkX = col * GRID_SIZE
          const checkY = row * GRID_SIZE
          if (!isPositionOccupied(checkX, checkY, excludeId)) {
            return { x: checkX, y: checkY }
          }
        }
      }

      // Last resort: return original snapped position (shouldn't happen)
      console.warn('Could not find free position, using snapped position')
      return snapped
    },
    [snapToGrid, isPositionOccupied]
  )

  // Validate and fix overlapping positions on load
  useEffect(() => {
    // Normalize all existing positions to grid and fix overlaps
    series.forEach((s) => {
      if (s.journey_position?.x !== undefined && s.journey_position?.y !== undefined) {
        const normalized = snapToGrid(s.journey_position.x, s.journey_position.y)
        
        // Check if normalized position is occupied by another series
        if (isPositionOccupied(normalized.x, normalized.y, s.id)) {
          // Find free position for this series
          const freePos = findNearestFreePosition(normalized.x, normalized.y, s.id)
          onPositionUpdate(s.id, {
            ...s.journey_position,
            x: freePos.x,
            y: freePos.y,
          })
        } else if (normalized.x !== s.journey_position.x || normalized.y !== s.journey_position.y) {
          // Position not on grid, normalize it
          onPositionUpdate(s.id, {
            ...s.journey_position,
            x: normalized.x,
            y: normalized.y,
          })
        }
      }
    })
  }, [series, snapToGrid, isPositionOccupied, findNearestFreePosition, onPositionUpdate])

  // Auto-arrange series on grid if they don't have positions
  useEffect(() => {
    const seriesWithoutPositions = series.filter(
      (s) => !s.journey_position || s.journey_position.x === undefined || s.journey_position.y === undefined
    )

    if (seriesWithoutPositions.length === 0) return

    // Sort by order
    const sorted = [...seriesWithoutPositions].sort((a, b) => {
      const orderA = a.milestone_order ?? a.display_order ?? 0
      const orderB = b.milestone_order ?? b.display_order ?? 0
      return orderA - orderB
    })

    // Place each series on grid, ensuring no overlaps
    sorted.forEach((s, index) => {
      const row = Math.floor(index / 8) // 8 columns
      const col = index % 8
      const x = col * GRID_SIZE
      const y = row * GRID_SIZE
      
      // Find free position (guaranteed to be unique)
      const freePos = findNearestFreePosition(x, y, s.id)
      
      // Double-check it's actually free before placing
      if (!isPositionOccupied(freePos.x, freePos.y, s.id)) {
        onPositionUpdate(s.id, { x: freePos.x, y: freePos.y, level: row })
      } else {
        // If somehow still occupied, find another position
        const alternativePos = findNearestFreePosition(x + GRID_SIZE, y, s.id)
        onPositionUpdate(s.id, { x: alternativePos.x, y: alternativePos.y, level: row })
      }
    })
  }, [series, onPositionUpdate, findNearestFreePosition])

  // Get grid position (always normalized to grid)
  const getGridPosition = (s: ArtworkSeries) => {
    if (s.journey_position?.x !== undefined && s.journey_position?.y !== undefined) {
      // Normalize to ensure it's on grid
      const x = Math.round(s.journey_position.x / GRID_SIZE) * GRID_SIZE
      const y = Math.round(s.journey_position.y / GRID_SIZE) * GRID_SIZE
      return { x, y }
    }
    return { x: 0, y: 0 }
  }
  
  // Get all occupied grid positions for visual feedback
  const getOccupiedPositions = useCallback(() => {
    const occupied = new Set<string>()
    series.forEach((s) => {
      const pos = getGridPosition(s)
      const key = `${pos.x},${pos.y}`
      occupied.add(key)
    })
    return occupied
  }, [series])

  // Build connections
  const connections = series.flatMap((s) => {
    const connections: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = []
    const from = getGridPosition(s)

    const allConnections = [
      ...(s.unlocks_series_ids || []),
      ...(s.connected_series_ids || [])
    ]

    allConnections.forEach((connectedId) => {
      const connected = series.find((cs) => cs.id === connectedId)
      if (connected) {
        const to = getGridPosition(connected)
        connections.push({ from, to })
      }
    })

    return connections
  })

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

      {/* Connection lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: `${gridWidth}px`, height: `${gridHeight}px` }}
      >
        {connections.map((conn, index) => {
          const fromCenterX = conn.from.x + CARD_SIZE / 2
          const fromCenterY = conn.from.y + CARD_SIZE / 2
          const toCenterX = conn.to.x + CARD_SIZE / 2
          const toCenterY = conn.to.y + CARD_SIZE / 2

          return (
            <line
              key={index}
              x1={fromCenterX}
              y1={fromCenterY}
              x2={toCenterX}
              y2={toCenterY}
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary/40"
              markerEnd="url(#arrowhead)"
            />
          )
        })}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="currentColor" className="text-primary/40" />
          </marker>
        </defs>
      </svg>

      {/* Series Nodes on Grid */}
      <div
        className="relative"
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
              onDragStart={() => setDraggedNode(s.id)}
              onDragEnd={(newPosition) => {
                // Snap to grid and ensure no overlap
                const freePos = findNearestFreePosition(newPosition.x, newPosition.y, s.id)
                
                // Normalize position to grid and verify it's free
                const normalizedPos = snapToGrid(freePos.x, freePos.y)
                
                // Final check: ensure position is free
                if (!isPositionOccupied(normalizedPos.x, normalizedPos.y, s.id)) {
                  onPositionUpdate(s.id, {
                    ...s.journey_position,
                    x: normalizedPos.x,
                    y: normalizedPos.y,
                  })
                } else {
                  // If still occupied, find alternative position
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
              }}
              onClick={() => onSeriesClick(s.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
