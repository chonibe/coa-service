"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { RotateCcw, ZoomIn, Move } from "lucide-react"
import type { ProductImage } from "@/types/product-submission"

interface ImageMaskEditorProps {
  image: ProductImage
  onUpdate: (settings: ProductImage["maskSettings"]) => void
  onGenerateMask?: (generateFunction: () => Promise<string>) => void // Callback to expose generate function
}

// Mask dimensions
const MASK_OUTER_SIZE = 1400
const MASK_INNER_WIDTH = 827
const MASK_INNER_HEIGHT = 1197
const MASK_CORNER_RADIUS = 138

// Calculate centered position for inner rectangle
const MASK_INNER_X = (MASK_OUTER_SIZE - MASK_INNER_WIDTH) / 2
const MASK_INNER_Y = (MASK_OUTER_SIZE - MASK_INNER_HEIGHT) / 2

export function ImageMaskEditor({ image, onUpdate, onGenerateMask }: ImageMaskEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  const settings = image.maskSettings || {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  }

  // Default scale to fit the inner mask rectangle
  const defaultScale = useMemo(() => {
    if (typeof window === "undefined") return 0.5
    return Math.min(
      Math.max(
        MASK_INNER_WIDTH / Math.max(window.innerWidth, 800),
        MASK_INNER_HEIGHT / Math.max(window.innerHeight, 800),
      ),
      1
    )
  }, [])

  const currentScale = settings.scale || defaultScale
  const currentX = settings.x || 0
  const currentY = settings.y || 0
  const currentRotation = settings.rotation || 0

  // Helper function to draw rounded rectangle
  const drawRoundRect = useCallback((
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
  }, [])

  // Helper function to create inner shadow - Only used in export
  const drawInnerShadowExport = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save()
    
    // Create inner shadow using simple gradient approach (faster)
    const blurRadius = 30
    const steps = 6 // Reduced from 10 for better performance
    
    for (let i = 0; i < steps; i++) {
      const progress = i / steps
      const offset = blurRadius * progress
      const opacity = (0.3 / steps) * (steps - i) // Fade from 30% to 0%
      
      ctx.globalAlpha = opacity
      ctx.strokeStyle = "rgba(0, 0, 0, 1)"
      ctx.lineWidth = 2
      
      // Draw inset rounded rectangle for inner shadow
      drawRoundRect(
        ctx,
        MASK_INNER_X + offset,
        MASK_INNER_Y + offset,
        MASK_INNER_WIDTH - (offset * 2),
        MASK_INNER_HEIGHT - (offset * 2),
        Math.max(0, MASK_CORNER_RADIUS - offset)
      )
      ctx.stroke()
    }
    
    ctx.globalAlpha = 1
    ctx.restore()
  }, [drawRoundRect])

  // Optimized draw function using requestAnimationFrame
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      // Set canvas size for high DPI displays (only once)
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
      const displaySize = Math.min(600, typeof window !== "undefined" ? Math.min(600, window.innerWidth - 100) : 600)
      
      // Only resize if dimensions changed
      const expectedWidth = MASK_OUTER_SIZE * dpr
      const expectedHeight = MASK_OUTER_SIZE * dpr
      
      if (canvas.width !== expectedWidth || canvas.height !== expectedHeight) {
        canvas.width = expectedWidth
        canvas.height = expectedHeight
        canvas.style.width = `${displaySize}px`
        canvas.style.height = `${displaySize}px`
      }
      
      // Reset transform and clear
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, MASK_OUTER_SIZE, MASK_OUTER_SIZE)

      // Clear canvas background
      ctx.fillStyle = "#f3f4f6"
      ctx.fillRect(0, 0, MASK_OUTER_SIZE, MASK_OUTER_SIZE)

      // Draw frame borders (always visible)
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 4
      ctx.strokeRect(2, 2, MASK_OUTER_SIZE - 4, MASK_OUTER_SIZE - 4)

      ctx.strokeStyle = "#9ca3af"
      ctx.lineWidth = 2
      drawRoundRect(ctx, MASK_INNER_X, MASK_INNER_Y, MASK_INNER_WIDTH, MASK_INNER_HEIGHT, MASK_CORNER_RADIUS)
      ctx.stroke()

      // If no image or not loaded yet
      const img = imageRef.current
      if (!image.src || image.src.trim().length === 0 || !img || !imageLoaded) {
        ctx.fillStyle = "#9ca3af"
        ctx.font = "18px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Upload an image to position it", MASK_OUTER_SIZE / 2, MASK_OUTER_SIZE / 2 - 10)
        ctx.font = "14px Arial"
        ctx.fillText("within the frame above", MASK_OUTER_SIZE / 2, MASK_OUTER_SIZE / 2 + 15)
        return
      }

      // Draw the masked image
      ctx.save()

      // Create clipping path for the inner rectangle
      drawRoundRect(ctx, MASK_INNER_X, MASK_INNER_Y, MASK_INNER_WIDTH, MASK_INNER_HEIGHT, MASK_CORNER_RADIUS)
      ctx.clip()

      // Apply transformations
      const centerX = MASK_OUTER_SIZE / 2
      const centerY = MASK_OUTER_SIZE / 2
      
      ctx.translate(centerX, centerY)
      ctx.rotate((currentRotation * Math.PI) / 180)
      ctx.scale(currentScale, currentScale)
      ctx.translate(currentX, currentY)
      
      // Draw image centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      ctx.restore()

      // NOTE: Shadow is NOT drawn in preview for performance
      // Shadow will be applied only in the final export

      // Redraw borders on top
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 4
      ctx.strokeRect(2, 2, MASK_OUTER_SIZE - 4, MASK_OUTER_SIZE - 4)

      ctx.strokeStyle = "#9ca3af"
      ctx.lineWidth = 2
      drawRoundRect(ctx, MASK_INNER_X, MASK_INNER_Y, MASK_INNER_WIDTH, MASK_INNER_HEIGHT, MASK_CORNER_RADIUS)
      ctx.stroke()
    })
  }, [currentScale, currentX, currentY, currentRotation, image.src, imageLoaded, drawRoundRect])

  // Load and cache image
  useEffect(() => {
    if (!image.src || image.src.trim().length === 0) {
      imageRef.current = null
      setImageLoaded(false)
      drawCanvas()
      return
    }

    // If image already loaded with same src, skip reloading
    if (imageRef.current?.src === image.src && imageLoaded) {
      return
    }

    setImageLoaded(false)
    const img = new Image()
    
    if (
      typeof window !== "undefined" &&
      !image.src.startsWith("data:") &&
      !image.src.includes(window.location.hostname)
    ) {
      img.crossOrigin = "anonymous"
    }
    
    img.onload = () => {
      imageRef.current = img
      setImageLoaded(true)
      drawCanvas()
    }
    
    img.onerror = () => {
      imageRef.current = null
      setImageLoaded(false)
      drawCanvas()
    }
    
    img.src = image.src
  }, [image.src, drawCanvas])

  // Redraw when settings change - throttled to prevent excessive redraws
  useEffect(() => {
    if (!imageLoaded) return
    
    const timeoutId = setTimeout(() => {
      drawCanvas()
    }, 50) // Throttle to max 20fps during interaction
    
    return () => clearTimeout(timeoutId)
  }, [currentScale, currentX, currentY, currentRotation, imageLoaded, drawCanvas])

  // Throttled update function for smoother interaction
  const lastUpdateTime = useRef<number>(0)
  const handleUpdate = useCallback((newSettings: ProductImage["maskSettings"]) => {
    onUpdate(newSettings)
    
    // Throttle updates to prevent excessive redraws
    const now = Date.now()
    if (now - lastUpdateTime.current > 50) { // Max 20 updates per second
      lastUpdateTime.current = now
      drawCanvas()
    }
  }, [onUpdate, drawCanvas])

  const displaySize = useMemo(() => {
    return Math.min(600, typeof window !== "undefined" ? Math.min(600, window.innerWidth - 100) : 600)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const scale = displaySize / MASK_OUTER_SIZE
      setDragStart({
        x: (e.clientX - rect.left) / scale - currentX,
        y: (e.clientY - rect.top) / scale - currentY,
      })
    }
  }, [currentX, currentY, displaySize])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const scale = displaySize / MASK_OUTER_SIZE
      const newX = (e.clientX - rect.left) / scale - dragStart.x
      const newY = (e.clientY - rect.top) / scale - dragStart.y
      
      handleUpdate({
        ...settings,
        x: newX,
        y: newY,
      })
    }
  }, [isDragging, dragStart, settings, displaySize, handleUpdate])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleReset = useCallback(() => {
    handleUpdate({
      x: 0,
      y: 0,
      scale: defaultScale,
      rotation: 0,
    })
  }, [defaultScale, handleUpdate])

  // Generate and export masked image
  const generateMaskedImage = useCallback(async (): Promise<string> => {
    if (!imageRef.current) {
      throw new Error("Image not loaded")
    }
    
    // Create a new canvas for the final masked image
    const exportCanvas = document.createElement("canvas")
    exportCanvas.width = MASK_OUTER_SIZE
    exportCanvas.height = MASK_OUTER_SIZE
    const exportCtx = exportCanvas.getContext("2d", { alpha: false })
    
    if (!exportCtx) {
      throw new Error("Failed to create export canvas context")
    }

    // Fill white background
    exportCtx.fillStyle = "#ffffff"
    exportCtx.fillRect(0, 0, MASK_OUTER_SIZE, MASK_OUTER_SIZE)

    // Create clipping path for the inner rectangle
    drawRoundRect(exportCtx, MASK_INNER_X, MASK_INNER_Y, MASK_INNER_WIDTH, MASK_INNER_HEIGHT, MASK_CORNER_RADIUS)
    exportCtx.clip()

    // Apply transformations and draw image
    const centerX = MASK_OUTER_SIZE / 2
    const centerY = MASK_OUTER_SIZE / 2
    
    exportCtx.save()
    exportCtx.translate(centerX, centerY)
    exportCtx.rotate((currentRotation * Math.PI) / 180)
    exportCtx.scale(currentScale, currentScale)
    exportCtx.translate(currentX, currentY)
    
    exportCtx.drawImage(imageRef.current, -imageRef.current.width / 2, -imageRef.current.height / 2)
    exportCtx.restore()

    // Add inner shadow effect to exported image only
    drawInnerShadowExport(exportCtx)

    // Export as base64 data URL
    return exportCanvas.toDataURL("image/png", 0.95)
  }, [currentScale, currentX, currentY, currentRotation, drawRoundRect, drawInnerShadowExport])

  // Expose generate function to parent
  useEffect(() => {
    if (onGenerateMask && imageLoaded) {
      onGenerateMask(generateMaskedImage)
    }
  }, [onGenerateMask, imageLoaded, generateMaskedImage])

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="relative border rounded-lg overflow-hidden bg-gray-100">
        <div className="flex items-center justify-center w-full bg-gray-50 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            className="max-w-full cursor-move border rounded-md shadow-sm bg-white"
            style={{
              maxWidth: "600px",
              aspectRatio: "1/1",
              display: "block",
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
              handleUpdate({
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
              handleUpdate({
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

        {/* Position Info and Controls */}
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
          scale and rotation. The masked image will be automatically applied when you proceed to the next step.
        </p>
      </div>
    </div>
  )
}
