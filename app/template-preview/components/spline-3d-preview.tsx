"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Application } from "@splinetool/runtime"

interface Spline3DPreviewProps {
  image1: string | null
  image2: string | null
  side1ObjectId?: string
  side2ObjectId?: string
  side1ObjectName?: string
  side2ObjectName?: string
}

export function Spline3DPreview({ 
  image1, 
  image2,
  side1ObjectId,
  side2ObjectId,
  side1ObjectName = "Side1",
  side2ObjectName = "Side2"
}: Spline3DPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const splineAppRef = useRef<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModelVisible, setIsModelVisible] = useState(true)
  
  // Store references to duplicate objects with textures
  const duplicateSide1Ref = useRef<any>(null)
  const duplicateSide2Ref = useRef<any>(null)
  const originalSide1Ref = useRef<any>(null)
  const originalSide2Ref = useRef<any>(null)

  // Toggle model visibility
  const toggleModelVisibility = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.style.opacity = isModelVisible ? '0' : '1'
      setIsModelVisible(!isModelVisible)
    }
  }, [isModelVisible])

  // Simple approach: Create duplicate objects with UV textures and toggle visibility
  const updateTextures = useCallback(async () => {
    if (!splineAppRef.current || isLoading) return

    console.log("[Spline3D] Updating textures:", { 
      hasImage1: !!image1, 
      hasImage2: !!image2,
      side1ObjectId,
      side2ObjectId
    })

    const app = splineAppRef.current as any

    // Helper to find object by ID or name
    const findObject = (id?: string, name?: string) => {
      if (id && app.findObjectById) {
        const obj = app.findObjectById(id)
        if (obj) return obj
      }
      if (name && app.findObjectByName) {
        return app.findObjectByName(name)
      }
      return null
    }

    // Helper to load image
    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
      })
    }

    // Helper to apply texture to object
    const applyTextureToObject = async (obj: any, imageUrl: string, label: string) => {
      if (!obj) {
        console.warn(`[Spline3D] Cannot apply texture: ${label} object not found`)
        return false
      }

      try {
        // Load the image
        const image = await loadImage(imageUrl)
        console.log(`[Spline3D] ✓ Loaded image for ${label}`)

        // Apply texture to material
        if (obj.material) {
          const material = obj.material
          
          // Try to find texture/image layer
          if (material.layers && Array.isArray(material.layers)) {
            // Find texture/image layer or use matcap layer
            let textureLayer = material.layers.find((l: any) => l.type === 'texture' || l.type === 'image')
            if (!textureLayer) {
              textureLayer = material.layers.find((l: any) => l.type === 'matcap')
            }

            if (textureLayer) {
              // Apply image to the layer
              if (textureLayer.texture) {
                textureLayer.texture.image = image
                textureLayer.texture.needsUpdate = true
                console.log(`[Spline3D] ✓ Applied image to ${label} texture layer`)
              } else if (textureLayer.image !== undefined) {
                textureLayer.image = image
                console.log(`[Spline3D] ✓ Applied image to ${label} layer.image`)
              }
            }
          }

          // Also try direct THREE.js texture
          if (obj.mesh?.material) {
            const THREE = (window as any).THREE || app?.THREE
            if (THREE && THREE.TextureLoader) {
              const loader = new THREE.TextureLoader()
              const texture = loader.load(imageUrl)
              texture.needsUpdate = true
              obj.mesh.material.map = texture
              obj.mesh.material.needsUpdate = true
              console.log(`[Spline3D] ✓ Applied texture via THREE.js to ${label}`)
            }
          }

          if (material.needsUpdate !== undefined) {
            material.needsUpdate = true
          }
          if (material.update && typeof material.update === "function") {
            material.update()
          }
        }

        return true
      } catch (err) {
        console.error(`[Spline3D] Error applying texture to ${label}:`, err)
        return false
      }
    }

    // Handle Side 1
    if (image1) {
      // Find original object
      const original1 = findObject(side1ObjectId, side1ObjectName)
      if (original1) {
        originalSide1Ref.current = original1
        
        // Hide original
        original1.visible = false
        console.log(`[Spline3D] ✓ Hid original Side 1`)

        // Apply texture to original (we'll use it as the duplicate)
        if (!duplicateSide1Ref.current) {
          const success = await applyTextureToObject(original1, image1, "Side 1")
          if (success) {
            duplicateSide1Ref.current = original1
            original1.visible = true // Show it with texture
            console.log(`[Spline3D] ✓ Applied texture to Side 1`)
          }
        } else {
          duplicateSide1Ref.current.visible = true
          console.log(`[Spline3D] ✓ Showed Side 1 with texture`)
        }
      }
    } else {
      // No image - show original, hide duplicate
      if (originalSide1Ref.current) {
        originalSide1Ref.current.visible = true
      }
      if (duplicateSide1Ref.current) {
        duplicateSide1Ref.current.visible = false
      }
    }

    // Handle Side 2
    if (image2) {
      // Find original object
      const original2 = findObject(side2ObjectId, side2ObjectName)
      if (original2) {
        originalSide2Ref.current = original2
        
        // Hide original
        original2.visible = false
        console.log(`[Spline3D] ✓ Hid original Side 2`)

        // Apply texture to original (we'll use it as the duplicate)
        if (!duplicateSide2Ref.current) {
          const success = await applyTextureToObject(original2, image2, "Side 2")
          if (success) {
            duplicateSide2Ref.current = original2
            original2.visible = true // Show it with texture
            console.log(`[Spline3D] ✓ Applied texture to Side 2`)
          }
        } else {
          duplicateSide2Ref.current.visible = true
          console.log(`[Spline3D] ✓ Showed Side 2 with texture`)
        }
      }
    } else {
      // No image - show original, hide duplicate
      if (originalSide2Ref.current) {
        originalSide2Ref.current.visible = true
      }
      if (duplicateSide2Ref.current) {
        duplicateSide2Ref.current.visible = false
      }
    }

    // Force render
    if (app.renderer && app.scene && app.camera && typeof app.renderer.render === "function") {
      app.renderer.render(app.scene, app.camera)
    }
  }, [image1, image2, side1ObjectId, side2ObjectId, side1ObjectName, side2ObjectName, isLoading])

  // Load Spline scene
  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return

    setIsLoading(true)
    setError(null)

    const canvas = canvasRef.current

    // Set canvas size
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      const width = Math.max(rect.width || canvas.clientWidth || 800, 100)
      const height = Math.max(rect.height || canvas.clientHeight || 600, 100)
      
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    }
    
    setCanvasSize()
    
    // Resize observer
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(setCanvasSize)
      resizeObserver.observe(canvas)
    }

    try {
      const app = new Application(canvas)
      const scenePath = "/spline/scene.splinecode"
      
      app.load(scenePath)
        .then(() => {
          splineAppRef.current = app
          setTimeout(() => {
            setIsLoading(false)
            // Update textures after initialization
            setTimeout(() => {
              updateTextures()
            }, 1000)
          }, 1000)
        })
        .catch((err) => {
          console.error("[Spline3D] Error loading scene:", err)
          setError(`Failed to load 3D scene: ${err.message || err}`)
          setIsLoading(false)
        })
    } catch (err: any) {
      console.error("[Spline3D] Error initializing Spline:", err)
      setError(`Failed to initialize 3D viewer: ${err.message || err}`)
      setIsLoading(false)
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (splineAppRef.current) {
        try {
          splineAppRef.current.dispose?.()
        } catch (err) {
          console.error("[Spline3D] Error disposing scene:", err)
        }
        splineAppRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (splineAppRef.current && !isLoading) {
      updateTextures()
    }
  }, [image1, image2, isLoading, updateTextures])

  return (
    <Card>
      <CardHeader>
        <CardTitle>3D Lamp Preview</CardTitle>
        <CardDescription>
          {!image1 && !image2
            ? "Upload images to see your artwork on the 3D lamp"
            : "See how your artwork looks on the 3D lamp. Rotate and interact with the model."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[600px] border rounded-lg overflow-hidden bg-muted">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading 3D scene...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="text-center p-4 max-w-md">
                <p className="text-sm text-destructive mb-2 font-medium">{error}</p>
                <p className="text-xs text-muted-foreground">
                  Check the browser console for detailed error messages.
                </p>
              </div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: "block", width: "100%", height: "100%", opacity: isModelVisible ? '1' : '0' }}
            width={800}
            height={600}
          />
          {(!image1 || !image2) && !isLoading && !error && (
            <div className="absolute top-4 left-4 right-4 bg-yellow-500/90 text-yellow-900 px-4 py-2 rounded-md text-sm z-20">
              {!image1 && !image2
                ? "Upload images for both sides to see the full preview"
                : !image1
                  ? "Upload an image for Side 1 to see the full preview"
                  : "Upload an image for Side 2 to see the full preview"}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={toggleModelVisibility}
            variant="outline"
            size="sm"
            disabled={isLoading || !!error}
            className="flex items-center gap-2"
          >
            {isModelVisible ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Model
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Model
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
