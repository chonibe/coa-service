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

  // Arrange series in vertical timeline with family tree branching
  useEffect(() => {
    const seriesWithoutPositions = series.filter(
      (s) => !s.journey_position || !s.journey_position.x || !s.journey_position.y
    )

    if (seriesWithoutPositions.length === 0) return

    // Sort by milestone_order or display_order for timeline progression
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

    // Timeline layout constants - vertical progression
    const cardWidth = 256 // w-64 = 256px
    const verticalSpacing = 240 // Space between timeline levels (card height + spacing)
    const horizontalBranchSpacing = 320 // Space for branches
    const centerX = 400 // Center of timeline (will be adjusted by container width)
    const startY = 80

    // Track positioned series to calculate next position
    const positioned = new Set<string>()

    // Recursive function to position series in family tree
    const positionSeries = (
      seriesItem: ArtworkSeries,
      x: number,
      y: number,
      level: number
    ) => {
      if (positioned.has(seriesItem.id)) return
      positioned.add(seriesItem.id)

      onPositionUpdate(seriesItem.id, { x, y, level })

      // Get series that this one unlocks or connects to
      const children = sorted.filter((s) =>
        seriesItem.unlocks_series_ids?.includes(s.id) ||
        seriesItem.connected_series_ids?.includes(s.id)
      )

      if (children.length > 0) {
        // Arrange children in branches below
        if (children.length === 1) {
          // Single child: continue straight down
          positionSeries(children[0], x, y + verticalSpacing, level + 1)
        } else {
          // Multiple children: branch out horizontally
          const branchStartX = x - ((children.length - 1) * horizontalBranchSpacing) / 2
          children.forEach((child, index) => {
            positionSeries(
              child,
              branchStartX + index * horizontalBranchSpacing,
              y + verticalSpacing,
              level + 1
            )
          })
        }
      }
    }

    // Position root nodes at top center
    if (rootNodes.length === 1) {
      positionSeries(rootNodes[0], centerX, startY, 0)
    } else if (rootNodes.length > 1) {
      // Multiple roots: arrange horizontally at top
      const rootStartX = centerX - ((rootNodes.length - 1) * horizontalBranchSpacing) / 2
      rootNodes.forEach((root, index) => {
        positionSeries(root, rootStartX + index * horizontalBranchSpacing, startY, 0)
      })
    }

    // Position any remaining series in timeline order (fallback)
    sorted.forEach((s) => {
      if (!positioned.has(s.id)) {
        const maxY = Math.max(
          ...series
            .filter((other) => other.journey_position?.y)
            .map((other) => other.journey_position!.y || 0),
          startY
        )
        onPositionUpdate(s.id, {
          x: centerX,
          y: maxY + verticalSpacing,
          level: 0,
        })
      }
    })
  }, [series, onPositionUpdate])

  // Simple position getter
  const getPosition = (s: ArtworkSeries) => {
    return s.journey_position ? { x: s.journey_position.x, y: s.journey_position.y } : { x: 100, y: 100 }
  }

  // Build family tree connections: show all relationships
  const connections = series.flatMap((s) => {
    const connections: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = []
    const from = getPosition(s)

    // Combine unlocks and connected series for family tree
    const allConnections = [
      ...(s.unlocks_series_ids || []),
      ...(s.connected_series_ids || [])
    ]

    allConnections.forEach((connectedId) => {
      const connected = series.find((cs) => cs.id === connectedId)
      if (connected) {
        const to = getPosition(connected)
        // Only show connection if 'to' is below 'from' (timeline progression)
        if (to.y > from.y) {
          connections.push({ from, to })
        }
      }
    })

    return connections
  })

  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/50">
        <p className="text-muted-foreground">No series to display. Create a series to see it on your journey map.</p>
      </div>
    )
  }

  // Calculate container height based on positioned series
  const maxY = Math.max(
    ...series
      .filter((s) => s.journey_position?.y)
      .map((s) => s.journey_position!.y || 0),
    600
  )
  const containerHeight = Math.max(maxY + 300, 600)

  return (
    <div
      ref={containerRef}
      className="relative w-full border rounded-lg overflow-y-auto bg-background"
      style={{ height: '600px', minHeight: '600px' }}
    >
      {/* Timeline lines - show family tree connections */}
      <svg 
        className="absolute inset-0 w-full pointer-events-none"
        style={{ height: `${containerHeight}px` }}
      >
        {connections.map((conn, index) => {
          // Calculate connection path for family tree style
          // Account for card dimensions (card is ~180px tall including content)
          const cardHeight = 180
          const fromBottom = conn.from.y + cardHeight / 2
          const toTop = conn.to.y - cardHeight / 2
          const midY = (fromBottom + toTop) / 2
          
          return (
            <g key={index}>
              {/* Vertical line from parent card bottom */}
              <line
                x1={conn.from.x}
                y1={fromBottom}
                x2={conn.from.x}
                y2={midY}
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary/50"
              />
              {/* Horizontal branch line */}
              <line
                x1={conn.from.x}
                y1={midY}
                x2={conn.to.x}
                y2={midY}
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary/50"
              />
              {/* Vertical line to child card top */}
              <line
                x1={conn.to.x}
                y1={midY}
                x2={conn.to.x}
                y2={toTop}
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary/50"
              />
            </g>
          )
        })}
      </svg>

      {/* Series Nodes - Timeline Cards */}
      <div 
        className="relative w-full"
        style={{ height: `${containerHeight}px` }}
      >
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
