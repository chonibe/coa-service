"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { RotateCcw, ZoomIn, Move, Check } from "lucide-react"
import type { ProductImage } from "@/types/product-submission"

interface ImageMaskEditorProps {
  image: ProductImage
  onUpdate: (settings: ProductImage["maskSettings"]) => void
  onApplyMask?: (maskedImageUrl: string) => void // Callback to save masked image
}

// Mask dimensions
const MASK_OUTER_SIZE = 1400
const MASK_INNER_WIDTH = 827
const MASK_INNER_HEIGHT = 1197
const MASK_CORNER_RADIUS = 138

// Calculate centered position for inner rectangle
const MASK_INNER_X = (MASK_OUTER_SIZE - MASK_INNER_WIDTH) / 2
const MASK_INNER_Y = (MASK_OUTER_SIZE - MASK_INNER_HEIGHT) / 2

export function ImageMaskEditor({ image, onUpdate, onApplyMask }: ImageMaskEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isGenerating, setIsGenerating] = useState(false)
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
      // Set canvas size for high DPI displays
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
      const displaySize = Math.min(600, typeof window !== "undefined" ? Math.min(600, window.innerWidth - 100) : 600)
      
      canvas.width = MASK_OUTER_SIZE * dpr
      canvas.height = MASK_OUTER_SIZE * dpr
      canvas.style.width = `${displaySize}px`
      canvas.style.height = `${displaySize}px`
      
      ctx.scale(dpr, dpr)

      // Clear canvas
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

  // Redraw when settings change (debounced)
  useEffect(() => {
    if (imageLoaded) {
      drawCanvas()
    }
  }, [currentScale, currentX, currentY, currentRotation, imageLoaded, drawCanvas])

  // Debounced update function
  const debouncedUpdate = useRef<NodeJS.Timeout | null>(null)
  const handleUpdate = useCallback((newSettings: ProductImage["maskSettings"]) => {
    onUpdate(newSettings)
    
    // Debounce canvas redraw for smoother interaction
    if (debouncedUpdate.current) {
      clearTimeout(debouncedUpdate.current)
    }
    debouncedUpdate.current = setTimeout(() => {
      drawCanvas()
    }, 16) // ~60fps
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
  const handleApplyMask = useCallback(async () => {
    if (!imageRef.current || !onApplyMask) return

    setIsGenerating(true)
    
    try {
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
      
      exportCtx.translate(centerX, centerY)
      exportCtx.rotate((currentRotation * Math.PI) / 180)
      exportCtx.scale(currentScale, currentScale)
      exportCtx.translate(currentX, currentY)
      
      exportCtx.drawImage(imageRef.current, -imageRef.current.width / 2, -imageRef.current.height / 2)

      // Export as base64 data URL
      const maskedImageUrl = exportCanvas.toDataURL("image/png", 0.95)
      
      // Call the callback to save the masked image
      onApplyMask(maskedImageUrl)
      
      setIsGenerating(false)
    } catch (error) {
      console.error("Error generating masked image:", error)
      setIsGenerating(false)
    }
  }, [currentScale, currentX, currentY, currentRotation, onApplyMask, drawRoundRect])

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (debouncedUpdate.current) {
        clearTimeout(debouncedUpdate.current)
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
            {onApplyMask && imageLoaded && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleApplyMask}
                disabled={isGenerating}
              >
                <Check className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Apply Mask"}
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Click and drag the image to reposition it within the frame. Use the sliders to adjust
          scale and rotation. Click "Apply Mask" to save the masked image as your primary product image.
        </p>
      </div>
    </div>
  )
}
