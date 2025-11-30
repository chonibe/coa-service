"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
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
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const mapStyle = mapSettings?.map_style || "island"

  // Auto-arrange series if they don't have positions
  useEffect(() => {
    const seriesWithoutPositions = series.filter(
      (s) => !s.journey_position || !s.journey_position.x || !s.journey_position.y
    )

    if (seriesWithoutPositions.length > 0) {
      // Auto-arrange in a grid or based on milestone_order
      seriesWithoutPositions.forEach((s, index) => {
        const level = s.milestone_order || Math.floor(index / 5) // 5 per level
        const positionInLevel = index % 5
        const x = positionInLevel * 200 + 100
        const y = level * 200 + 100

        // Update position via API
        onPositionUpdate(s.id, { x, y, level })
      })
    }
  }, [series, onPositionUpdate])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        // Left mouse button
        setIsDragging(true)
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      }
    },
    [pan]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && !draggedNode) {
        // Panning the canvas
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      }
    },
    [isDragging, dragStart, draggedNode]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedNode(null)
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom((prev) => Math.max(0.5, Math.min(2, prev * delta)))
    },
    []
  )

  const getSeriesPosition = (s: ArtworkSeries) => {
    if (s.journey_position) {
      return {
        x: s.journey_position.x,
        y: s.journey_position.y,
      }
    }
    // Default position
    return { x: 100, y: 100 }
  }

  const getConnections = () => {
    const connections: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = []

    series.forEach((s) => {
      if (s.connected_series_ids && s.connected_series_ids.length > 0) {
        const fromPos = getSeriesPosition(s)
        s.connected_series_ids.forEach((connectedId) => {
          const connectedSeries = series.find((cs) => cs.id === connectedId)
          if (connectedSeries) {
            const toPos = getSeriesPosition(connectedSeries)
            connections.push({ from: fromPos, to: toPos })
          }
        })
      }
    })

    return connections
  }

  const connections = getConnections()

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
      className="relative w-full h-[600px] border rounded-lg overflow-hidden bg-gradient-to-br from-background to-muted/20"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* SVG for connections and nodes */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Background pattern based on map style */}
        {mapStyle === "island" && (
          <defs>
            <pattern id="island-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="currentColor" className="text-muted-foreground/20" />
            </pattern>
          </defs>
        )}

        {/* Connection lines */}
        {connections.map((conn, index) => (
          <line
            key={index}
            x1={conn.from.x}
            y1={conn.from.y}
            x2={conn.to.x}
            y2={conn.to.y}
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="5,5"
            className="text-muted-foreground/30"
            markerEnd="url(#arrowhead)"
          />
        ))}

        {/* Arrow marker for connections */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="currentColor" className="text-muted-foreground/30" />
          </marker>
        </defs>
      </svg>

      {/* Series Nodes */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {series.map((s) => {
          const position = getSeriesPosition(s)
          return (
            <SeriesNode
              key={s.id}
              series={s}
              position={position}
              onDragStart={() => setDraggedNode(s.id)}
              onDragEnd={(newPosition) => {
                onPositionUpdate(s.id, {
                  ...s.journey_position,
                  ...newPosition,
                })
                setDraggedNode(null)
              }}
              onClick={() => onSeriesClick(s.id)}
            />
          )
        })}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-background/80 backdrop-blur-sm border rounded-lg p-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoom((prev) => Math.min(2, prev + 0.1))}
          className="h-8"
        >
          +
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
          className="h-8"
        >
          −
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }}
          className="h-8 text-xs"
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
