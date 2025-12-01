"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { ArtworkSeries, JourneyPosition } from "@/types/artwork-series"
import { SeriesNode } from "./SeriesNode"

interface JourneyMapCanvasProps {
  series: ArtworkSeries[]
  onSeriesClick: (seriesId: string) => void
  onPositionUpdate: (seriesId: string, position: JourneyPosition) => void
  onConnectionUpdate?: (fromSeriesId: string, toSeriesId: string) => void
}

// Grid constants - chess board style
const GRID_SIZE = 120 // Size of each grid square in pixels
const CARD_SIZE = 100 // Size of card (slightly smaller than grid for spacing)

export function JourneyMapCanvas({
  series,
  onSeriesClick,
  onPositionUpdate,
  onConnectionUpdate,
}: JourneyMapCanvasProps) {
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [draggedPosition, setDraggedPosition] = useState<{ x: number; y: number } | null>(null)
  const [connectionDragging, setConnectionDragging] = useState<{
    fromSeriesId: string
    fromPosition: { x: number; y: number }
    currentPosition: { x: number; y: number }
  } | null>(null)
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

  // Handle connection node drag start
  const handleConnectionNodeStart = useCallback(
    (seriesId: string, nodePosition: { x: number; y: number }, side: 'top' | 'bottom' | 'left' | 'right') => {
      setConnectionDragging({
        fromSeriesId: seriesId,
        fromPosition: nodePosition,
        currentPosition: nodePosition,
      })
    },
    []
  )

  // Handle mouse move for connection dragging
  useEffect(() => {
    if (!connectionDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - containerRect.left
        const y = e.clientY - containerRect.top
        setConnectionDragging((prev) =>
          prev ? { ...prev, currentPosition: { x, y } } : null
        )
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!connectionDragging) return

      // Find which series node we're over
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - containerRect.left
        const y = e.clientY - containerRect.top

        // Check if we're over any series node
        const targetSeries = series.find((s) => {
          if (s.journey_position?.x === undefined || s.journey_position?.y === undefined) return false
          if (s.id === connectionDragging.fromSeriesId) return false

          const gridPos = getGridPosition(s)
          const cardX = gridPos.x + GRID_SIZE / 2
          const cardY = gridPos.y + GRID_SIZE / 2
          const distance = Math.sqrt(
            Math.pow(x - cardX, 2) + Math.pow(y - cardY, 2)
          )

          return distance < GRID_SIZE / 2
        })

        if (targetSeries && onConnectionUpdate) {
          onConnectionUpdate(connectionDragging.fromSeriesId, targetSeries.id)
        }
      }

      setConnectionDragging(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [connectionDragging, series, onConnectionUpdate])

  // Validate and fix overlapping positions on load
  useEffect(() => {
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
  }, [series, snapToGrid, isPositionOccupied, findNearestFreePosition, onPositionUpdate])

  // Auto-arrange series on grid if they don't have positions
  useEffect(() => {
    const seriesWithoutPositions = series.filter(
      (s) => !s.journey_position || s.journey_position.x === undefined || s.journey_position.y === undefined
    )

    if (seriesWithoutPositions.length === 0) return

    const sorted = [...seriesWithoutPositions].sort((a, b) => {
      const orderA = a.milestone_order ?? a.display_order ?? 0
      const orderB = b.milestone_order ?? b.display_order ?? 0
      return orderA - orderB
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
  }, [series, onPositionUpdate, findNearestFreePosition, isPositionOccupied])

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

  // Build connections - lines that stretch between connected nodes
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

      {/* Connection lines - stretch between connected nodes */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: `${gridWidth}px`, height: `${gridHeight}px` }}
      >
        {/* Existing connections */}
        {connections.map((conn, index) => {
          // Calculate connection points at card centers
          const fromCenterX = conn.from.x + GRID_SIZE / 2
          const fromCenterY = conn.from.y + GRID_SIZE / 2
          const toCenterX = conn.to.x + GRID_SIZE / 2
          const toCenterY = conn.to.y + GRID_SIZE / 2

          return (
            <line
              key={`conn-${index}`}
              x1={fromCenterX}
              y1={fromCenterY}
              x2={toCenterX}
              y2={toCenterY}
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary/50"
              markerEnd="url(#arrowhead)"
            />
          )
        })}

        {/* Temporary wire while dragging */}
        {connectionDragging && (
          <line
            x1={connectionDragging.fromPosition.x}
            y1={connectionDragging.fromPosition.y}
            x2={connectionDragging.currentPosition.x}
            y2={connectionDragging.currentPosition.y}
            stroke="currentColor"
            strokeWidth="3"
            className="text-primary"
            strokeDasharray="5,5"
            markerEnd="url(#arrowhead)"
          />
        )}

        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="currentColor" className="text-primary/50" />
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
              onDragStart={() => {
                setDraggedNode(s.id)
                const currentPos = getGridPosition(s)
                setDraggedPosition(currentPos)
              }}
              onDragMove={(newPosition) => {
                const freePos = findNearestFreePosition(newPosition.x, newPosition.y, s.id)
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
              onConnectionNodeStart={handleConnectionNodeStart}
              isConnectionDragging={!!connectionDragging}
            />
          )
        })}
      </div>
    </div>
  )
}
