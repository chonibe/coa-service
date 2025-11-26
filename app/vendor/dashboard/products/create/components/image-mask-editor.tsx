"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { RotateCcw, ZoomIn, Move } from "lucide-react"
import type { ProductImage } from "@/types/product-submission"

interface ImageMaskEditorProps {
  image: ProductImage
  onUpdate: (settings: ProductImage["maskSettings"]) => void
  onGenerateMask?: (generateFunction: () => Promise<string>) => void
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
  const isRedrawingRef = useRef(false)
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  const settings = image.maskSettings || {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  }

  // Store all dynamic values in refs to avoid callback recreation
  const settingsRef = useRef(settings)
  const imageSrcRef = useRef(image.src)
  const imageLoadedRef = useRef(imageLoaded)
  
  // Update refs when props change
  useEffect(() => {
    settingsRef.current = settings
    imageSrcRef.current = image.src
    imageLoadedRef.current = imageLoaded
  }, [settings, image.src, imageLoaded])

  // Default scale calculation
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

  // Helper function to draw rounded rectangle (stable, no dependencies)
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

  // Single optimized draw function - reads from refs, no dependencies
  const drawCanvas = useCallback(() => {
    // Prevent concurrent redraws
    if (isRedrawingRef.current) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Cancel any pending timeout
    if (redrawTimeoutRef.current) {
      clearTimeout(redrawTimeoutRef.current)
      redrawTimeoutRef.current = null
    }

    isRedrawingRef.current = true

    animationFrameRef.current = requestAnimationFrame(() => {
      try {
        const ctx = canvas.getContext("2d", { alpha: false })
        if (!ctx) {
          isRedrawingRef.current = false
          return
        }

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

        // Draw frame borders
        ctx.strokeStyle = "#e5e7eb"
        ctx.lineWidth = 4
        ctx.strokeRect(2, 2, MASK_OUTER_SIZE - 4, MASK_OUTER_SIZE - 4)

        ctx.strokeStyle = "#9ca3af"
        ctx.lineWidth = 2
        drawRoundRect(ctx, MASK_INNER_X, MASK_INNER_Y, MASK_INNER_WIDTH, MASK_INNER_HEIGHT, MASK_CORNER_RADIUS)
        ctx.stroke()

        // Get current values from refs
        const img = imageRef.current
        const currentSettings = settingsRef.current
        const imgSrc = imageSrcRef.current
        const loaded = imageLoadedRef.current

        // If no image or not loaded yet
        if (!imgSrc || imgSrc.trim().length === 0 || !img || !loaded) {
          ctx.fillStyle = "#9ca3af"
          ctx.font = "18px Arial"
          ctx.textAlign = "center"
          ctx.fillText("Upload an image to position it", MASK_OUTER_SIZE / 2, MASK_OUTER_SIZE / 2 - 10)
          ctx.font = "14px Arial"
          ctx.fillText("within the frame above", MASK_OUTER_SIZE / 2, MASK_OUTER_SIZE / 2 + 15)
          isRedrawingRef.current = false
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
      } finally {
        isRedrawingRef.current = false
      }
    })
  }, [defaultScale]) // Only depend on stable defaultScale

  // Throttled redraw function - only redraws when actually needed
  const scheduleRedraw = useCallback(() => {
    // Clear any pending timeout
    if (redrawTimeoutRef.current) {
      clearTimeout(redrawTimeoutRef.current)
    }
    
    // Throttle redraws - only redraw after user stops interacting
    redrawTimeoutRef.current = setTimeout(() => {
      drawCanvas()
    }, 100) // Increased throttle for better performance
  }, [drawCanvas])

  // Load image only when src changes
  useEffect(() => {
    if (!image.src || image.src.trim().length === 0) {
      imageRef.current = null
      setImageLoaded(false)
      scheduleRedraw()
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
      scheduleRedraw()
    }
    
    img.onerror = () => {
      imageRef.current = null
      setImageLoaded(false)
      scheduleRedraw()
    }
    
    img.src = image.src
    
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [image.src, scheduleRedraw])

  // Single effect to handle settings changes - heavily throttled
  useEffect(() => {
    if (!imageLoaded) return
    
    // Use scheduleRedraw which has built-in throttling
    scheduleRedraw()
  }, [currentScale, currentX, currentY, currentRotation, imageLoaded, scheduleRedraw])

  // Update handler - updates parent and schedules redraw
  const handleUpdate = useCallback((newSettings: ProductImage["maskSettings"]) => {
    // Update parent immediately
    onUpdate(newSettings)
    
    // Schedule a throttled redraw
    scheduleRedraw()
  }, [onUpdate, scheduleRedraw])

  const displaySize = useMemo(() => {
    return Math.min(600, typeof window !== "undefined" ? Math.min(600, window.innerWidth - 100) : 600)
  }, [])

  // Optimized mouse handlers - use throttling for drag
  const dragUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const scale = displaySize / MASK_OUTER_SIZE
      const currentSettings = settingsRef.current
      setDragStart({
        x: (e.clientX - rect.left) / scale - (currentSettings.x || 0),
        y: (e.clientY - rect.top) / scale - (currentSettings.y || 0),
      })
    }
  }, [displaySize])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const scale = displaySize / MASK_OUTER_SIZE
    const newX = (e.clientX - rect.left) / scale - dragStart.x
    const newY = (e.clientY - rect.top) / scale - dragStart.y
    
    // Clear any pending update
    if (dragUpdateTimeoutRef.current) {
      clearTimeout(dragUpdateTimeoutRef.current)
    }
    
    // Throttle updates during drag to prevent excessive state updates
    dragUpdateTimeoutRef.current = setTimeout(() => {
      const currentSettings = settingsRef.current
      handleUpdate({
        ...currentSettings,
        x: newX,
        y: newY,
      })
    }, 50) // Update every 50ms during drag
  }, [isDragging, dragStart, displaySize, handleUpdate])

  const handleMouseUp = useCallback(() => {
    // Clear any pending drag update
    if (dragUpdateTimeoutRef.current) {
      clearTimeout(dragUpdateTimeoutRef.current)
      dragUpdateTimeoutRef.current = null
    }
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

  // Debounced slider handler to prevent excessive updates
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleSliderChange = useCallback((field: 'scale' | 'rotation', value: number) => {
    // Clear any pending update
    if (sliderTimeoutRef.current) {
      clearTimeout(sliderTimeoutRef.current)
    }
    
    // Debounce slider updates
    sliderTimeoutRef.current = setTimeout(() => {
      const currentSettings = settingsRef.current
      handleUpdate({
        ...currentSettings,
        [field]: value,
      })
    }, 100) // Wait 100ms after user stops sliding
  }, [handleUpdate])

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

    // Apply transformations using current settings
    const centerX = MASK_OUTER_SIZE / 2
    const centerY = MASK_OUTER_SIZE / 2
    
    const currentSettings = settingsRef.current
    const scale = currentSettings.scale || defaultScale
    const x = currentSettings.x || 0
    const y = currentSettings.y || 0
    const rotation = currentSettings.rotation || 0
    
    exportCtx.save()
    exportCtx.translate(centerX, centerY)
    exportCtx.rotate((rotation * Math.PI) / 180)
    exportCtx.scale(scale, scale)
    exportCtx.translate(x, y)
    
    exportCtx.drawImage(imageRef.current, -imageRef.current.width / 2, -imageRef.current.height / 2)
    exportCtx.restore()

    // Add inner shadow effect to exported image only
    const blurRadius = 30
    const steps = 6
    
    exportCtx.save()
    for (let i = 0; i < steps; i++) {
      const progress = i / steps
      const offset = blurRadius * progress
      const opacity = (0.3 / steps) * (steps - i)
      
      exportCtx.globalAlpha = opacity
      exportCtx.strokeStyle = "rgba(0, 0, 0, 1)"
      exportCtx.lineWidth = 2
      
      drawRoundRect(
        exportCtx,
        MASK_INNER_X + offset,
        MASK_INNER_Y + offset,
        MASK_INNER_WIDTH - (offset * 2),
        MASK_INNER_HEIGHT - (offset * 2),
        Math.max(0, MASK_CORNER_RADIUS - offset)
      )
      exportCtx.stroke()
    }
    exportCtx.globalAlpha = 1
    exportCtx.restore()

    // Export as base64 data URL
    return exportCanvas.toDataURL("image/png", 0.95)
  }, [defaultScale])

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
      if (dragUpdateTimeoutRef.current) {
        clearTimeout(dragUpdateTimeoutRef.current)
      }
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current)
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
            onValueChange={([value]) => handleSliderChange('scale', value)}
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
            onValueChange={([value]) => handleSliderChange('rotation', value)}
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
