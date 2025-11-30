"use client"

import { useState, useRef, useEffect } from "react"
import type { ArtworkSeries, JourneyMapSettings, JourneyPosition } from "@/types/artwork-series"
import { SeriesNode } from "./SeriesNode"
import { cn } from "@/lib/utils"

interface JourneyMapCanvasProps {
  series: ArtworkSeries[]
  mapSettings: JourneyMapSettings | null
  onSeriesClick: (seriesId: string) => void
  onPositionUpdate: (seriesId: string, position: JourneyPosition) => void
}

export function JourneyMapCanvas({
  series,
  mapSettings,
  onSeriesClick,
  onPositionUpdate,
}: JourneyMapCanvasProps) {
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Arrange series in a tree/path structure
  useEffect(() => {
    const seriesWithoutPositions = series.filter(
      (s) => !s.journey_position || !s.journey_position.x || !s.journey_position.y
    )

    if (seriesWithoutPositions.length === 0) return

    // Sort by milestone_order or display_order for path progression
    const sorted = [...series].sort((a, b) => {
      const orderA = a.milestone_order ?? a.display_order ?? 0
      const orderB = b.milestone_order ?? b.display_order ?? 0
      return orderA - orderB
    })

    // Build tree: find root nodes (series not unlocked by others)
    const allUnlockedIds = new Set(
      series.flatMap((s) => s.unlocks_series_ids || [])
    )
    const rootNodes = sorted.filter((s) => !allUnlockedIds.has(s.id))

    // Path layout constants
    const horizontalSpacing = 200
    const verticalSpacing = 150
    const startX = 100
    const startY = 100

    // Recursive function to position series in tree
    const positionSeries = (
      seriesItem: ArtworkSeries,
      x: number,
      y: number,
      level: number
    ) => {
      if (seriesItem.journey_position?.x && seriesItem.journey_position?.y) {
        return // Already positioned
      }

      onPositionUpdate(seriesItem.id, { x, y, level })

      // Position series that this one unlocks
      const unlocks = sorted.filter((s) =>
        seriesItem.unlocks_series_ids?.includes(s.id)
      )

      if (unlocks.length > 0) {
        // If multiple unlocks, arrange them horizontally below
        const branchStartX = x - ((unlocks.length - 1) * horizontalSpacing) / 2
        unlocks.forEach((unlocked, index) => {
          positionSeries(
            unlocked,
            branchStartX + index * horizontalSpacing,
            y + verticalSpacing,
            level + 1
          )
        })
      }
    }

    // Position root nodes horizontally
    rootNodes.forEach((root, index) => {
      positionSeries(root, startX + index * horizontalSpacing, startY, 0)
    })

    // Position any remaining series in order (fallback for series without unlock relationships)
    sorted.forEach((s) => {
      if (!s.journey_position?.x || !s.journey_position?.y) {
        // Find max X position to continue path
        const maxX = Math.max(
          ...series
            .filter((other) => other.journey_position?.x)
            .map((other) => other.journey_position!.x || 0),
          startX
        )
        const maxY = Math.max(
          ...series
            .filter((other) => other.journey_position?.y)
            .map((other) => other.journey_position!.y || 0),
          startY
        )
        onPositionUpdate(s.id, {
          x: maxX + horizontalSpacing,
          y: maxY,
          level: 0,
        })
      }
    })
  }, [series, onPositionUpdate])

  // Simple position getter
  const getPosition = (s: ArtworkSeries) => {
    return s.journey_position ? { x: s.journey_position.x, y: s.journey_position.y } : { x: 100, y: 100 }
  }

  // Build path connections: show progression from one series to next
  const connections = series.flatMap((s) => {
    const connections: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = []
    const from = getPosition(s)

    // Show unlocks_series_ids as path connections (progression)
    if (s.unlocks_series_ids?.length) {
      s.unlocks_series_ids.forEach((unlockedId) => {
        const unlocked = series.find((cs) => cs.id === unlockedId)
        if (unlocked) {
          connections.push({ from, to: getPosition(unlocked) })
        }
      })
    }

    // Also show connected_series_ids (related series)
    if (s.connected_series_ids?.length) {
      s.connected_series_ids.forEach((connectedId) => {
        const connected = series.find((cs) => cs.id === connectedId)
        if (connected) {
          connections.push({ from, to: getPosition(connected) })
        }
      })
    }

    return connections
  })

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
      className="relative w-full h-[600px] border rounded-lg overflow-auto bg-background"
    >
      {/* Path lines - show progression */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {connections.map((conn, index) => (
          <g key={index}>
            {/* Path line */}
            <line
              x1={conn.from.x}
              y1={conn.from.y}
              x2={conn.to.x}
              y2={conn.to.y}
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary/40"
              strokeDasharray="4,4"
            />
            {/* Arrow at end */}
            <polygon
              points={`${conn.to.x - 8},${conn.to.y - 4} ${conn.to.x},${conn.to.y} ${conn.to.x - 8},${conn.to.y + 4}`}
              fill="currentColor"
              className="text-primary/40"
            />
          </g>
        ))}
      </svg>

      {/* Series Nodes */}
      <div className="relative w-full h-full">
        {series.map((s) => {
          const position = getPosition(s)
          return (
            <SeriesNode
              key={s.id}
              series={s}
              position={position}
              containerRef={containerRef}
              onDragStart={() => setDraggedNode(s.id)}
              onDragEnd={(newPosition) => {
                onPositionUpdate(s.id, {
                  ...s.journey_position,
                  x: newPosition.x,
                  y: newPosition.y,
                })
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
