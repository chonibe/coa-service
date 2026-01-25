"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"

import { Slider } from "@/components/ui/slider"
import { RotateCcw, ZoomIn, Move, Save, CheckCircle2, Loader2 } from "lucide-react"
import type { ProductImage } from "@/types/product-submission"

import { Button } from "@/components/ui"
interface ImageMaskEditorProps {
  image: ProductImage
  onUpdate: (settings: ProductImage["maskSettings"]) => void
  onMaskSaved?: (maskedImageUrl: string) => void // Callback when masked image is saved
  hideSaveButton?: boolean // Hide the save button (for preview contexts without next step)
}

// Mask dimensions
const MASK_OUTER_SIZE = 1400
const MASK_INNER_WIDTH = 827
const MASK_INNER_HEIGHT = 1197
const MASK_CORNER_RADIUS = 138

// Calculate centered position for inner rectangle
const MASK_INNER_X = (MASK_OUTER_SIZE - MASK_INNER_WIDTH) / 2
const MASK_INNER_Y = (MASK_OUTER_SIZE - MASK_INNER_HEIGHT) / 2

// Helper function to draw rounded rectangle - stored in module-level object for stable reference
// This pattern is more resilient to minification issues
const canvasHelpers = {
  drawRoundRect: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void => {
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
  },
}

// Export for external access if needed
export const drawRoundRect = canvasHelpers.drawRoundRect

export function ImageMaskEditor({ image, onUpdate, onMaskSaved, hideSaveButton = false }: ImageMaskEditorProps) {
  const renderCountRef = useRef(0)
  const renderStartTime = useRef(performance.now())
  
  renderCountRef.current += 1
  const renderCount = renderCountRef.current
  
  // Warn if too many renders
  if (renderCount > 50) {
    console.warn("[MaskEditor] Excessive renders detected!", {
      renderCount,
      timestamp: new Date().toISOString(),
    })
  }
  
  // Log every 10th render to avoid spam
  if (renderCount % 10 === 0 || renderCount <= 5) {
    const timeSinceLastRender = performance.now() - renderStartTime.current
    console.log("[MaskEditor] Component render", {
      renderCount,
      timestamp: new Date().toISOString(),
      timeSinceLastRender: `${timeSinceLastRender.toFixed(2)}ms`,
      imageSrc: image.src?.substring(0, 50),
      maskSettings: image.maskSettings,
    })
    renderStartTime.current = performance.now()
  }
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const redrawTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRedrawingRef = useRef(false)
  const lastRedrawTimeRef = useRef<number>(0)
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isSavingMask, setIsSavingMask] = useState(false)
  const [maskSaved, setMaskSaved] = useState(false)

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
  const prevPropsRef = useRef({ imageSrc: image.src, maskSettings: image.maskSettings })
  
  // Update refs when props change and track prop changes
  useEffect(() => {
    const imageSrcChanged = prevPropsRef.current.imageSrc !== image.src
    const settingsChanged = JSON.stringify(prevPropsRef.current.maskSettings) !== JSON.stringify(image.maskSettings)
    
    if (imageSrcChanged || settingsChanged) {
      console.log("[MaskEditor] Props changed", {
        timestamp: new Date().toISOString(),
        imageSrcChanged,
        settingsChanged,
        oldImageSrc: prevPropsRef.current.imageSrc?.substring(0, 50),
        newImageSrc: image.src?.substring(0, 50),
        oldSettings: prevPropsRef.current.maskSettings,
        newSettings: image.maskSettings,
        renderCount,
      })
      
      prevPropsRef.current = {
        imageSrc: image.src,
        maskSettings: image.maskSettings,
      }
    }
    
    settingsRef.current = settings
    imageSrcRef.current = image.src
    imageLoadedRef.current = imageLoaded
  }, [settings, image.src, imageLoaded, image.maskSettings, renderCount])

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

  // Single optimized draw function - reads from refs, no dependencies
  // Note: canvasHelpers.drawRoundRect is used for stable reference after minification
  const drawCanvas = useCallback(() => {
    const startTime = performance.now()
    console.log("[MaskEditor] drawCanvas called", {
      timestamp: new Date().toISOString(),
      isRedrawing: isRedrawingRef.current,
      hasCanvas: !!canvasRef.current,
      hasImage: !!imageRef.current,
      imageLoaded: imageLoadedRef.current,
    })
    
    // Prevent concurrent redraws
    if (isRedrawingRef.current) {
      console.warn("[MaskEditor] drawCanvas skipped - already redrawing")
      return
    }
    
    const canvas = canvasRef.current
    if (!canvas) {
      console.warn("[MaskEditor] drawCanvas skipped - no canvas")
      return
    }

    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      console.log("[MaskEditor] Cancelling pending animation frame")
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Cancel any pending timeout
    if (redrawTimeoutRef.current) {
      console.log("[MaskEditor] Cancelling pending timeout")
      clearTimeout(redrawTimeoutRef.current)
      redrawTimeoutRef.current = null
    }

    isRedrawingRef.current = true
    console.log("[MaskEditor] Starting canvas redraw...")

    animationFrameRef.current = requestAnimationFrame(() => {
      const rafStartTime = performance.now()
      console.log("[MaskEditor] Animation frame started", {
        timeSinceDrawCall: rafStartTime - startTime,
      })
      
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
        canvasHelpers.drawRoundRect(ctx, MASK_INNER_X, MASK_INNER_Y, MASK_INNER_WIDTH, MASK_INNER_HEIGHT, MASK_CORNER_RADIUS)
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
        canvasHelpers.drawRoundRect(ctx, MASK_INNER_X, MASK_INNER_Y, MASK_INNER_WIDTH, MASK_INNER_HEIGHT, MASK_CORNER_RADIUS)
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
        canvasHelpers.drawRoundRect(ctx, MASK_INNER_X, MASK_INNER_Y, MASK_INNER_WIDTH, MASK_INNER_HEIGHT, MASK_CORNER_RADIUS)
        ctx.stroke()
        
        const totalTime = performance.now() - startTime
        const rafTime = performance.now() - rafStartTime
        console.log("[MaskEditor] Canvas redraw completed", {
          totalTime: `${totalTime.toFixed(2)}ms`,
          rafTime: `${rafTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("[MaskEditor] Error drawing canvas:", error, {
          errorMessage: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        })
      } finally {
        isRedrawingRef.current = false
      }
    })
  }, [defaultScale]) // Only depend on stable defaultScale

  // Throttled redraw function - only redraws when actually needed
  const scheduleRedraw = useCallback(() => {
    const now = performance.now()
    const timeSinceLastRedraw = now - lastRedrawTimeRef.current
    
    // Warn if redraws are being scheduled too frequently
    if (timeSinceLastRedraw < 50) {
      console.warn("[MaskEditor] Redraw scheduled too frequently!", {
        timeSinceLastRedraw: `${timeSinceLastRedraw.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
      })
    }
    
    console.log("[MaskEditor] scheduleRedraw called", {
      timestamp: new Date().toISOString(),
      hasPendingTimeout: !!redrawTimeoutRef.current,
      timeSinceLastRedraw: `${timeSinceLastRedraw.toFixed(2)}ms`,
    })
    
    // Clear any pending timeout
    if (redrawTimeoutRef.current) {
      console.log("[MaskEditor] Clearing pending redraw timeout")
      clearTimeout(redrawTimeoutRef.current)
    }
    
    // Throttle redraws - only redraw after user stops interacting
    redrawTimeoutRef.current = setTimeout(() => {
      lastRedrawTimeRef.current = performance.now()
      console.log("[MaskEditor] Executing scheduled redraw")
      drawCanvas()
    }, 100) // Increased throttle for better performance
  }, [drawCanvas])

  // Load image only when src changes
  useEffect(() => {
    console.log("[MaskEditor] Image src effect triggered", {
      timestamp: new Date().toISOString(),
      imageSrc: image.src,
      currentImageSrc: imageRef.current?.src,
      imageLoaded,
    })
    
    if (!image.src || image.src.trim().length === 0) {
      console.log("[MaskEditor] Clearing image - no src")
      imageRef.current = null
      setImageLoaded(false)
      setMaskSaved(false) // Reset saved state when image is cleared
      scheduleRedraw()
      return
    }

    // If image already loaded with same src, skip reloading
    if (imageRef.current?.src === image.src && imageLoaded) {
      console.log("[MaskEditor] Image already loaded, skipping")
      return
    }

    console.log("[MaskEditor] Loading new image...")
    setImageLoaded(false)
    setMaskSaved(false) // Reset saved state when new image is loaded
    const imgLoadStartTime = performance.now()
    const img = new Image()
    
    if (
      typeof window !== "undefined" &&
      !image.src.startsWith("data:") &&
      !image.src.includes(window.location.hostname)
    ) {
      img.crossOrigin = "anonymous"
    }
    
    img.onload = () => {
      const loadTime = performance.now() - imgLoadStartTime
      console.log("[MaskEditor] Image loaded successfully", {
        loadTime: `${loadTime.toFixed(2)}ms`,
        imageSize: `${img.width}x${img.height}`,
        timestamp: new Date().toISOString(),
      })
      imageRef.current = img
      setImageLoaded(true)
      scheduleRedraw()
    }
    
    img.onerror = (error) => {
      console.error("[MaskEditor] Image load failed", {
        error,
        imageSrc: image.src,
        timestamp: new Date().toISOString(),
      })
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
    console.log("[MaskEditor] Settings changed effect triggered", {
      timestamp: new Date().toISOString(),
      imageLoaded,
      currentScale,
      currentX,
      currentY,
      currentRotation,
    })
    
    if (!imageLoaded) {
      console.log("[MaskEditor] Skipping redraw - image not loaded")
      return
    }
    
    // Use scheduleRedraw which has built-in throttling
    scheduleRedraw()
  }, [currentScale, currentX, currentY, currentRotation, imageLoaded, scheduleRedraw])

  // Update handler - updates parent (throttled) and schedules redraw
  const handleUpdate = useCallback((newSettings: ProductImage["maskSettings"]) => {
    console.log("[MaskEditor] handleUpdate called", {
      timestamp: new Date().toISOString(),
      newSettings,
      oldSettings: settingsRef.current,
    })
    
    // Update local ref immediately for responsive preview (doesn't trigger re-render)
    settingsRef.current = newSettings
    
    // Update parent (this is throttled in images-step to prevent render loops)
    onUpdate(newSettings)
    
    // Schedule a throttled redraw using the new settings from ref
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
    
    const moveStartTime = performance.now()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) {
      console.warn("[MaskEditor] handleMouseMove: no canvas rect")
      return
    }
    
    const scale = displaySize / MASK_OUTER_SIZE
    const newX = (e.clientX - rect.left) / scale - dragStart.x
    const newY = (e.clientY - rect.top) / scale - dragStart.y
    
    // Clear any pending update
    if (dragUpdateTimeoutRef.current) {
      clearTimeout(dragUpdateTimeoutRef.current)
    }
    
    // Throttle updates during drag to prevent excessive state updates
    dragUpdateTimeoutRef.current = setTimeout(() => {
      const updateStartTime = performance.now()
      const currentSettings = settingsRef.current
      handleUpdate({
        ...currentSettings,
        x: newX,
        y: newY,
      })
      console.log("[MaskEditor] Drag update applied", {
        timeInQueue: `${(updateStartTime - moveStartTime).toFixed(2)}ms`,
        newPosition: { x: newX, y: newY },
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
    console.log("[MaskEditor] Slider change triggered", {
      field,
      value,
      timestamp: new Date().toISOString(),
      hasPendingTimeout: !!sliderTimeoutRef.current,
    })
    
    // Clear any pending update
    if (sliderTimeoutRef.current) {
      console.log("[MaskEditor] Clearing pending slider update")
      clearTimeout(sliderTimeoutRef.current)
    }
    
    // Debounce slider updates
    sliderTimeoutRef.current = setTimeout(() => {
      console.log("[MaskEditor] Applying slider update", { field, value })
      const currentSettings = settingsRef.current
      handleUpdate({
        ...currentSettings,
        [field]: value,
      })
    }, 100) // Wait 100ms after user stops sliding
  }, [handleUpdate])

  // Generate and export masked image - only called when needed
  const generateMaskedImage = useCallback(async (): Promise<string> => {
    console.log("[MaskEditor] generateMaskedImage called", {
      timestamp: new Date().toISOString(),
      hasImageRef: !!imageRef.current,
      imageLoaded: imageLoadedRef.current,
    })
    
    if (!imageRef.current) {
      console.error("[MaskEditor] generateMaskedImage failed - image not loaded")
      throw new Error("Image not loaded")
    }
    
    try {
      // Create a new canvas for the final masked image
      const exportCanvas = document.createElement("canvas")
      exportCanvas.width = MASK_OUTER_SIZE
      exportCanvas.height = MASK_OUTER_SIZE
      const exportCtx = exportCanvas.getContext("2d", { alpha: true })
      
      if (!exportCtx) {
        console.error("[MaskEditor] generateMaskedImage failed - could not get context")
        throw new Error("Failed to create export canvas context")
      }

      console.log("[MaskEditor] Export canvas created", {
        width: exportCanvas.width,
        height: exportCanvas.height,
      })

      // Clear canvas (transparent background)
      exportCtx.clearRect(0, 0, MASK_OUTER_SIZE, MASK_OUTER_SIZE)

      // Create clipping path for the inner rectangle
      // Inline path drawing to avoid minification issues with function references
      const clipX = MASK_INNER_X
      const clipY = MASK_INNER_Y
      const clipW = MASK_INNER_WIDTH
      const clipH = MASK_INNER_HEIGHT
      const clipR = MASK_CORNER_RADIUS
      
      exportCtx.beginPath()
      exportCtx.moveTo(clipX + clipR, clipY)
      exportCtx.lineTo(clipX + clipW - clipR, clipY)
      exportCtx.quadraticCurveTo(clipX + clipW, clipY, clipX + clipW, clipY + clipR)
      exportCtx.lineTo(clipX + clipW, clipY + clipH - clipR)
      exportCtx.quadraticCurveTo(clipX + clipW, clipY + clipH, clipX + clipW - clipR, clipY + clipH)
      exportCtx.lineTo(clipX + clipR, clipY + clipH)
      exportCtx.quadraticCurveTo(clipX, clipY + clipH, clipX, clipY + clipH - clipR)
      exportCtx.lineTo(clipX, clipY + clipR)
      exportCtx.quadraticCurveTo(clipX, clipY, clipX + clipR, clipY)
      exportCtx.closePath()
      exportCtx.clip()

      // Apply transformations using current settings from ref
      const centerX = MASK_OUTER_SIZE / 2
      const centerY = MASK_OUTER_SIZE / 2
      
      const currentSettings = settingsRef.current
      const scale = currentSettings.scale || defaultScale
      const x = currentSettings.x || 0
      const y = currentSettings.y || 0
      const rotation = currentSettings.rotation || 0
      
      console.log("[MaskEditor] Applying transformations", {
        scale,
        x,
        y,
        rotation,
      })
      
      exportCtx.save()
      exportCtx.translate(centerX, centerY)
      exportCtx.rotate((rotation * Math.PI) / 180)
      exportCtx.scale(scale, scale)
      exportCtx.translate(x, y)
      
      // Draw image
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
        
        // Inline path drawing for shadow to avoid minification issues
        const shadowX = MASK_INNER_X + offset
        const shadowY = MASK_INNER_Y + offset
        const shadowW = MASK_INNER_WIDTH - (offset * 2)
        const shadowH = MASK_INNER_HEIGHT - (offset * 2)
        const shadowR = Math.max(0, MASK_CORNER_RADIUS - offset)
        
        exportCtx.beginPath()
        exportCtx.moveTo(shadowX + shadowR, shadowY)
        exportCtx.lineTo(shadowX + shadowW - shadowR, shadowY)
        exportCtx.quadraticCurveTo(shadowX + shadowW, shadowY, shadowX + shadowW, shadowY + shadowR)
        exportCtx.lineTo(shadowX + shadowW, shadowY + shadowH - shadowR)
        exportCtx.quadraticCurveTo(shadowX + shadowW, shadowY + shadowH, shadowX + shadowW - shadowR, shadowY + shadowH)
        exportCtx.lineTo(shadowX + shadowR, shadowY + shadowH)
        exportCtx.quadraticCurveTo(shadowX, shadowY + shadowH, shadowX, shadowY + shadowH - shadowR)
        exportCtx.lineTo(shadowX, shadowY + shadowR)
        exportCtx.quadraticCurveTo(shadowX, shadowY, shadowX + shadowR, shadowY)
        exportCtx.closePath()
        exportCtx.stroke()
      }
      exportCtx.globalAlpha = 1
      exportCtx.restore()

      // Export as base64 data URL
      console.log("[MaskEditor] Converting canvas to data URL...")
      const dataUrl = exportCanvas.toDataURL("image/png", 0.95)
      console.log("[MaskEditor] Masked image generated successfully", {
        dataUrlLength: dataUrl.length,
        firstChars: dataUrl.substring(0, 50),
      })
      return dataUrl
    } catch (error) {
      console.error("[MaskEditor] Error in generateMaskedImage:", error, {
        errorName: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  }, [defaultScale])

  // Handle manual save of masked image
  const handleSaveMaskedImage = useCallback(async () => {
    if (!imageLoaded || !imageRef.current) {
      console.error("[MaskEditor] Cannot save masked image - image not loaded")
      return
    }

    setIsSavingMask(true)
    try {
      console.log("[MaskEditor] Generating masked image on manual save...")
      const maskedImageUrl = await generateMaskedImage()
      setMaskSaved(true)
      if (onMaskSaved) {
        onMaskSaved(maskedImageUrl)
      }
      console.log("[MaskEditor] Masked image saved successfully")
    } catch (error) {
      console.error("[MaskEditor] Error saving masked image:", error)
      setMaskSaved(false)
      // Don't call onMaskSaved on error
    } finally {
      setIsSavingMask(false)
    }
  }, [imageLoaded, generateMaskedImage, onMaskSaved])

  // Component mount/unmount logging
  useEffect(() => {
    console.log("[MaskEditor] Component mounted", {
      timestamp: new Date().toISOString(),
      initialRenderCount: renderCountRef.current,
    })
    
    return () => {
      console.log("[MaskEditor] Component unmounting - cleaning up", {
        timestamp: new Date().toISOString(),
        totalRenders: renderCountRef.current,
      })
      
      if (animationFrameRef.current) {
        console.log("[MaskEditor] Cancelling animation frame on unmount")
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (redrawTimeoutRef.current) {
        console.log("[MaskEditor] Clearing redraw timeout on unmount")
        clearTimeout(redrawTimeoutRef.current)
      }
      if (dragUpdateTimeoutRef.current) {
        console.log("[MaskEditor] Clearing drag timeout on unmount")
        clearTimeout(dragUpdateTimeoutRef.current)
      }
      if (sliderTimeoutRef.current) {
        console.log("[MaskEditor] Clearing slider timeout on unmount")
        clearTimeout(sliderTimeoutRef.current)
      }
    }
  }, [])
  
  // Track when settings ref changes
  useEffect(() => {
    console.log("[MaskEditor] Settings ref updated", {
      timestamp: new Date().toISOString(),
      settings: settingsRef.current,
      renderCount,
    })
  }, [settings, renderCount])

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

        {/* Save Masked Image Button */}
        {!hideSaveButton && (
          <div className="pt-2 border-t">
            <Button
              type="button"
              onClick={handleSaveMaskedImage}
              disabled={!imageLoaded || isSavingMask}
              className="w-full"
              variant={maskSaved ? "default" : "default"}
            >
              {isSavingMask ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving Masked Image...
                </>
              ) : maskSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Masked Image Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Masked Image
                </>
              )}
            </Button>
            {maskSaved && (
              <p className="text-xs text-green-600 mt-2 text-center">
                Masked image has been saved. You can continue to the next step.
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Click and drag the image to reposition it within the frame. Use the sliders to adjust
          scale and rotation.
          {!hideSaveButton && ' Click "Save Masked Image" when you\'re ready to proceed.'}
        </p>
      </div>
    </div>
  )
}
