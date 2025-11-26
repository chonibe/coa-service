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
  const redrawTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const settingsRef = useRef(settings) // Store settings in ref to avoid callback recreation
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // Update ref when settings change
  settingsRef.current = settings

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

  // Single optimized draw function - use refs to avoid dependency issues
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Prevent multiple simultaneous draws using ref (faster than state)
    const isDrawingRef = { current: false }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    animationFrameRef.current = requestAnimationFrame(() => {
      try {
        // Set canvas size for high DPI displays
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

        // Get current values from refs to avoid stale closures
        const img = imageRef.current
        const currentSettings = settingsRef.current

        // If no image or not loaded yet
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

        // Apply transformations using current settings from ref
        const centerX = MASK_OUTER_SIZE / 2
        const centerY = MASK_OUTER_SIZE / 2
        
        // Get fresh settings from ref to avoid stale closure
        const scale = currentSettings.scale || defaultScale
        const x = currentSettings.x || 0
        const y = currentSettings.y || 0
        const rotation = currentSettings.rotation || 0
        
        ctx.translate(centerX, centerY)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.scale(scale, scale)
        ctx.translate(x, y)
        
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
      } catch (error) {
        console.error("Error drawing canvas:", error)
      }
    })
  }, [imageLoaded, defaultScale, drawRoundRect, image.src]) // Use refs for settings, only depend on stable values

  // Load image only when src changes
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
    }
    
    img.onerror = () => {
      imageRef.current = null
      setImageLoaded(false)
    }
    
    img.src = image.src
    
    // Cleanup
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [image.src]) // Only depend on image.src

  // Debounced redraw when settings change - only trigger on actual value changes
  useEffect(() => {
    if (!imageLoaded) return
    
    // Clear any pending timeout
    if (redrawTimeoutRef.current) {
      clearTimeout(redrawTimeoutRef.current)
    }
    
    // Debounce redraw to prevent excessive updates
    redrawTimeoutRef.current = setTimeout(() => {
      drawCanvas()
    }, 150) // Increased debounce time for better performance
    
    return () => {
      if (redrawTimeoutRef.current) {
        clearTimeout(redrawTimeoutRef.current)
      }
    }
  }, [currentScale, currentX, currentY, currentRotation, imageLoaded, drawCanvas])
  
  // Separate effect for image loading state changes
  useEffect(() => {
    if (imageLoaded) {
      // Small delay to ensure image is rendered in DOM
      const timeout = setTimeout(() => drawCanvas(), 50)
      return () => clearTimeout(timeout)
    }
  }, [imageLoaded, drawCanvas])

  // Optimized update handler - doesn't trigger immediate redraw
  const handleUpdate = useCallback((newSettings: ProductImage["maskSettings"]) => {
    // Update parent immediately
    onUpdate(newSettings)
    
    // Redraw will be triggered by the useEffect watching settings changes
    // No need to call drawCanvas here
  }, [onUpdate])

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

  // Generate and export masked image - only called when needed
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
      if (redrawTimeoutRef.current) {
        clearTimeout(redrawTimeoutRef.current)
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
