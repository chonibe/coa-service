"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { ArtworkSeries, JourneyPosition } from "@/types/artwork-series"
import { SeriesNode } from "./SeriesNode"

interface JourneyMapCanvasProps {
  series: ArtworkSeries[]
  onSeriesClick: (seriesId: string) => void
  onPositionUpdate: (seriesId: string, position: JourneyPosition) => void
}

// Flowchart layout constants
const NODE_WIDTH = 200
const NODE_HEIGHT = 120
const HORIZONTAL_SPACING = 250 // Space between nodes horizontally
const VERTICAL_SPACING = 180 // Space between levels vertically
const START_X = 400 // Center starting position

export function JourneyMapCanvas({
  series,
  onSeriesClick,
  onPositionUpdate,
}: JourneyMapCanvasProps) {
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Build flowchart structure from connections
  const buildFlowchartLayout = useCallback(() => {
    // Find root nodes (not unlocked by others)
    const allUnlockedIds = new Set(
      series.flatMap((s) => s.unlocks_series_ids || [])
    )
    const rootNodes = series.filter((s) => !allUnlockedIds.has(s.id))

    // Build graph structure
    const graph = new Map<string, string[]>()
    series.forEach((s) => {
      const children = [
        ...(s.unlocks_series_ids || []),
        ...(s.connected_series_ids || [])
      ]
      graph.set(s.id, children)
    })

    // Calculate levels using BFS
    const levels = new Map<string, number>()
    const visited = new Set<string>()
    const queue: Array<{ id: string; level: number }> = []

    // Start with root nodes at level 0
    rootNodes.forEach((root) => {
      queue.push({ id: root.id, level: 0 })
      visited.add(root.id)
    })

    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      levels.set(id, level)

      const children = graph.get(id) || []
      children.forEach((childId) => {
        if (!visited.has(childId)) {
          visited.add(childId)
          queue.push({ id: childId, level: level + 1 })
        } else {
          // Update level if this path is shorter
          const currentLevel = levels.get(childId) || Infinity
          if (level + 1 < currentLevel) {
            levels.set(childId, level + 1)
          }
        }
      })
    }

    // Position nodes by level
    const nodesByLevel = new Map<number, ArtworkSeries[]>()
    series.forEach((s) => {
      const level = levels.get(s.id) ?? 0
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, [])
      }
      nodesByLevel.get(level)!.push(s)
    })

    // Calculate positions for each level
    const positions = new Map<string, { x: number; y: number }>()
    
    nodesByLevel.forEach((nodes, level) => {
      const y = level * VERTICAL_SPACING + 100
      const totalWidth = (nodes.length - 1) * HORIZONTAL_SPACING
      const startX = START_X - totalWidth / 2

      nodes.forEach((node, index) => {
        const x = startX + index * HORIZONTAL_SPACING
        positions.set(node.id, { x, y })
      })
    })

    return positions
  }, [series])

  // Auto-arrange in flowchart layout
  useEffect(() => {
    const seriesWithoutPositions = series.filter(
      (s) => !s.journey_position || s.journey_position.x === undefined || s.journey_position.y === undefined
    )

    if (seriesWithoutPositions.length === 0 && series.length > 0) {
      // All have positions, but validate they're not overlapping
      const positions = buildFlowchartLayout()
      positions.forEach((pos, id) => {
        const s = series.find((series) => series.id === id)
        if (s && (!s.journey_position || s.journey_position.x !== pos.x || s.journey_position.y !== pos.y)) {
          onPositionUpdate(id, { x: pos.x, y: pos.y, level: Math.floor(pos.y / VERTICAL_SPACING) })
        }
      })
      return
    }

    if (seriesWithoutPositions.length === 0) return

    // Use flowchart layout
    const positions = buildFlowchartLayout()
    positions.forEach((pos, id) => {
      onPositionUpdate(id, { x: pos.x, y: pos.y, level: Math.floor(pos.y / VERTICAL_SPACING) })
    })
  }, [series, onPositionUpdate, buildFlowchartLayout])

  // Get node position
  const getPosition = (s: ArtworkSeries) => {
    if (s.journey_position?.x !== undefined && s.journey_position?.y !== undefined) {
      return { x: s.journey_position.x, y: s.journey_position.y }
    }
    return { x: START_X, y: 100 }
  }

  // Build connections for flowchart
  const connections = series.flatMap((s) => {
    const connections: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = []
    const from = getPosition(s)

    const allConnections = [
      ...(s.unlocks_series_ids || []),
      ...(s.connected_series_ids || [])
    ]

    allConnections.forEach((connectedId) => {
      const connected = series.find((cs) => cs.id === connectedId)
      if (connected) {
        const to = getPosition(connected)
        // Only show connections going downward (flowchart flow)
        if (to.y > from.y) {
          connections.push({ from, to })
        }
      }
    })

    return connections
  })

  // Calculate canvas dimensions
  const maxX = Math.max(
    ...series
      .filter((s) => s.journey_position?.x !== undefined)
      .map((s) => s.journey_position!.x || 0),
    START_X
  )
  const maxY = Math.max(
    ...series
      .filter((s) => s.journey_position?.y !== undefined)
      .map((s) => s.journey_position!.y || 0),
    600
  )
  const canvasWidth = Math.max(maxX + HORIZONTAL_SPACING * 2, 1000)
  const canvasHeight = Math.max(maxY + VERTICAL_SPACING, 600)

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
      {/* Flowchart connection lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
      >
        {connections.map((conn, index) => {
          const fromX = conn.from.x + NODE_WIDTH / 2
          const fromY = conn.from.y + NODE_HEIGHT
          const toX = conn.to.x + NODE_WIDTH / 2
          const toY = conn.to.y

          // Flowchart-style connection: vertical line down, then horizontal, then vertical to target
          const midY = (fromY + toY) / 2

          return (
            <g key={index}>
              {/* Vertical line from source */}
              <line
                x1={fromX}
                y1={fromY}
                x2={fromX}
                y2={midY}
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary/50"
              />
              {/* Horizontal connector */}
              <line
                x1={fromX}
                y1={midY}
                x2={toX}
                y2={midY}
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary/50"
              />
              {/* Vertical line to target */}
              <line
                x1={toX}
                y1={midY}
                x2={toX}
                y2={toY}
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary/50"
              />
              {/* Arrow at end */}
              <polygon
                points={`${toX - 6},${toY - 4} ${toX},${toY} ${toX - 6},${toY + 4}`}
                fill="currentColor"
                className="text-primary/50"
              />
            </g>
          )
        })}
      </svg>

      {/* Flowchart Nodes */}
      <div
        className="relative"
        style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
      >
        {series.map((s) => {
          const position = getPosition(s)
          return (
            <SeriesNode
              key={s.id}
              series={s}
              position={position}
              nodeWidth={NODE_WIDTH}
              nodeHeight={NODE_HEIGHT}
              containerRef={containerRef}
              onDragStart={() => setDraggedNode(s.id)}
              onDragEnd={(newPosition) => {
                // Snap to nearest grid position (for flowchart alignment)
                const gridX = Math.round(newPosition.x / 50) * 50
                const gridY = Math.round(newPosition.y / 50) * 50
                onPositionUpdate(s.id, {
                  ...s.journey_position,
                  x: gridX,
                  y: gridY,
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
