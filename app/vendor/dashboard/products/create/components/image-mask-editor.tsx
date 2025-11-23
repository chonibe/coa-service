"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { RotateCcw, ZoomIn, ZoomOut, Move } from "lucide-react"
import type { ProductImage } from "@/types/product-submission"

interface ImageMaskEditorProps {
  image: ProductImage
  onUpdate: (settings: ProductImage["maskSettings"]) => void
}

// Mask dimensions
const MASK_OUTER_SIZE = 1400
const MASK_INNER_WIDTH = 827
const MASK_INNER_HEIGHT = 1197
const MASK_CORNER_RADIUS = 138

// Calculate centered position for inner rectangle
const MASK_INNER_X = (MASK_OUTER_SIZE - MASK_INNER_WIDTH) / 2
const MASK_INNER_Y = (MASK_OUTER_SIZE - MASK_INNER_HEIGHT) / 2

export function ImageMaskEditor({ image, onUpdate }: ImageMaskEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const settings = image.maskSettings || {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  }

  // Default scale to fit the inner mask rectangle - calculate in useEffect
  const [defaultScale, setDefaultScale] = useState(0.5)
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const calcDefaultScale = Math.max(
        MASK_INNER_WIDTH / Math.max(window.innerWidth, 800),
        MASK_INNER_HEIGHT / Math.max(window.innerHeight, 800),
      )
      setDefaultScale(Math.min(calcDefaultScale, 1))
    }
  }, [])

  const currentScale = settings.scale || defaultScale
  const currentX = settings.x || 0
  const currentY = settings.y || 0
  const currentRotation = settings.rotation || 0

  // Helper function to draw rounded rectangle
  const drawRoundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  // Draw the masked image
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image.src) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size for high DPI displays
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
    const displaySize = Math.min(
      600,
      typeof window !== "undefined" ? Math.min(600, window.innerWidth - 100) : 600,
    )
    
    canvas.width = MASK_OUTER_SIZE * dpr
    canvas.height = MASK_OUTER_SIZE * dpr
    canvas.style.width = `${displaySize}px`
    canvas.style.height = `${displaySize}px`
    
    ctx.scale(dpr, dpr)

    // Clear canvas with light gray background
    ctx.fillStyle = "#f3f4f6"
    ctx.fillRect(0, 0, MASK_OUTER_SIZE, MASK_OUTER_SIZE)

    // Load and draw image
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      ctx.save()

      // Create clipping path for the inner rectangle with rounded corners
      drawRoundRect(ctx, MASK_INNER_X, MASK_INNER_Y, MASK_INNER_WIDTH, MASK_INNER_HEIGHT, MASK_CORNER_RADIUS)
      ctx.clip()

      // Apply transformations
      // Translate to center of canvas
      const centerX = MASK_OUTER_SIZE / 2
      const centerY = MASK_OUTER_SIZE / 2
      
      ctx.translate(centerX, centerY)
      
      // Apply rotation
      ctx.rotate((currentRotation * Math.PI) / 180)
      
      // Apply scale
      ctx.scale(currentScale, currentScale)
      
      // Apply position offset
      ctx.translate(currentX, currentY)
      
      // Draw image centered at origin (after all transforms)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      ctx.restore()

      // Draw the frame (outer border)
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 4
      ctx.strokeRect(2, 2, MASK_OUTER_SIZE - 4, MASK_OUTER_SIZE - 4)

      // Draw the inner rectangle outline
      ctx.strokeStyle = "#9ca3af"
      ctx.lineWidth = 2
      drawRoundRect(ctx, MASK_INNER_X, MASK_INNER_Y, MASK_INNER_WIDTH, MASK_INNER_HEIGHT, MASK_CORNER_RADIUS)
      ctx.stroke()
    }
    
    img.onerror = () => {
      // Show error state
      ctx.fillStyle = "#ef4444"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Failed to load image", MASK_OUTER_SIZE / 2, MASK_OUTER_SIZE / 2)
    }
    
    img.src = image.src
  }, [image.src, currentScale, currentX, currentY, currentRotation])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - currentX,
        y: e.clientY - rect.top - currentY,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const newX = e.clientX - rect.left - dragStart.x
      const newY = e.clientY - rect.top - dragStart.y
      onUpdate({
        ...settings,
        x: newX,
        y: newY,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleReset = () => {
    onUpdate({
      x: 0,
      y: 0,
      scale: defaultScale,
      rotation: 0,
    })
  }

  return (
    <div className="space-y-4">
      <div className="relative border rounded-lg overflow-hidden bg-gray-100" ref={containerRef}>
        <div className="flex items-center justify-center w-full bg-gray-50 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            className="max-w-full cursor-move border rounded-md shadow-sm"
            style={{
              maxWidth: "600px",
              aspectRatio: "1/1",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Scale Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              Scale
            </label>
            <span className="text-sm text-muted-foreground">
              {Math.round(currentScale * 100)}%
            </span>
          </div>
          <Slider
            value={[currentScale]}
            onValueChange={([value]) =>
              onUpdate({
                ...settings,
                scale: value,
              })
            }
            min={0.1}
            max={3}
            step={0.05}
            className="w-full"
          />
        </div>

        {/* Rotation Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Rotation
            </label>
            <span className="text-sm text-muted-foreground">{Math.round(currentRotation)}°</span>
          </div>
          <Slider
            value={[currentRotation]}
            onValueChange={([value]) =>
              onUpdate({
                ...settings,
                rotation: value,
              })
            }
            min={-180}
            max={180}
            step={1}
            className="w-full"
          />
        </div>

        {/* Position Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Position: X: {Math.round(currentX)}, Y: {Math.round(currentY)}
          </span>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Click and drag the image to reposition it within the frame. Use the sliders to adjust
          scale and rotation.
        </p>
      </div>
    </div>
  )
}


