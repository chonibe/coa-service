"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Application } from "@splinetool/runtime"
import * as THREE from "three"

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
  
  // Store references to objects with image layers
  const side1ObjectRef = useRef<any>(null)
  const side2ObjectRef = useRef<any>(null)

  // Toggle model visibility
  const toggleModelVisibility = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.style.opacity = isModelVisible ? '0' : '1'
      setIsModelVisible(!isModelVisible)
    }
  }, [isModelVisible])

  // Clone mesh, create new material with UV texture, toggle visibility
  const updateTextures = useCallback(async () => {
    if (!splineAppRef.current || isLoading) return

    console.log("[Spline3D] Adding image layers to materials:", { 
      hasImage1: !!image1, 
      hasImage2: !!image2,
      side1ObjectId,
      side2ObjectId
    })

    const app = splineAppRef.current as any
    
    // Get the THREE.js scene from Spline
    const scene = app.scene || app._scene
    if (!scene) {
      console.error("[Spline3D] Scene not available")
      return
    }

    console.log("[Spline3D] ✓ Using imported THREE.js")

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

    // Helper to add image layer to Spline material
    const addImageLayerToMaterial = async (obj: any, imageUrl: string, label: string) => {
      if (!obj) {
        console.warn(`[Spline3D] Cannot add image layer: ${label} object not found`)
        return false
      }

      try {
        console.log(`[Spline3D] Attempting to add image layer to ${label} material...`)
        
        // Get material from object
        let material = obj.material
        if (!material && obj.mesh) {
          material = obj.mesh.material
        }
        
        if (!material) {
          console.warn(`[Spline3D] No material found on ${label} object`)
          return false
        }

        console.log(`[Spline3D] Found material for ${label}:`, {
          hasLayers: !!material.layers,
          layersCount: material.layers?.length,
          layerTypes: material.layers?.map((l: any) => l.type)
        })

        // Load image as HTMLImageElement
        const imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = imageUrl
        })

        console.log(`[Spline3D] ✓ Loaded image element for ${label}`, {
          width: imageElement.width,
          height: imageElement.height
        })

        // Try multiple approaches to add image layer

        // Approach 1: Try to create a new image layer using Spline API
        if (material.addLayer && typeof material.addLayer === 'function') {
          try {
            const newLayer = material.addLayer('image')
            if (newLayer) {
              newLayer.image = imageElement
              newLayer.visible = true
              material.needsUpdate = true
              console.log(`[Spline3D] ✓ Approach 1: Added image layer via addLayer() for ${label}`)
              return true
            }
          } catch (e) {
            console.warn(`[Spline3D] Approach 1 failed:`, e)
          }
        }

        // Approach 2: Try to push a new layer to layers array
        if (material.layers && Array.isArray(material.layers)) {
          try {
            // Create a new layer object
            const newLayer: any = {
              type: 'image',
              image: imageElement,
              visible: true,
              alpha: 1,
              mode: 0
            }
            material.layers.push(newLayer)
            material.needsUpdate = true
            console.log(`[Spline3D] ✓ Approach 2: Pushed new image layer to layers array for ${label}`)
            return true
          } catch (e) {
            console.warn(`[Spline3D] Approach 2 failed:`, e)
          }
        }

        // Approach 3: Try to update existing texture/image layer
        if (material.layers && Array.isArray(material.layers)) {
          for (let i = 0; i < material.layers.length; i++) {
            const layer = material.layers[i]
            if (layer.type === 'texture' || layer.type === 'image' || layer.type === 'matcap') {
              try {
                // Try setting image directly
                if (layer.image !== undefined) {
                  layer.image = imageElement
                  layer.visible = true
                  layer.alpha = 1
                  if (layer.updateTexture) {
                    layer.updateTexture(imageElement)
                  }
                  material.needsUpdate = true
                  console.log(`[Spline3D] ✓ Approach 3: Updated existing ${layer.type} layer ${i} for ${label}`)
                  return true
                }
              } catch (e) {
                console.warn(`[Spline3D] Approach 3 failed for layer ${i}:`, e)
              }
            }
          }
        }

        // Approach 4: Try using Spline's createLayer method if available
        if (app.createLayer && typeof app.createLayer === 'function') {
          try {
            const newLayer = app.createLayer(material, 'image')
            if (newLayer) {
              newLayer.image = imageElement
              newLayer.visible = true
              material.needsUpdate = true
              console.log(`[Spline3D] ✓ Approach 4: Created layer via app.createLayer() for ${label}`)
              return true
            }
          } catch (e) {
            console.warn(`[Spline3D] Approach 4 failed:`, e)
          }
        }

        // Approach 5: Try to modify material directly
        try {
          // Try setting image on material itself
          if (material.setImage) {
            material.setImage(imageElement)
            material.needsUpdate = true
            console.log(`[Spline3D] ✓ Approach 5: Set image via material.setImage() for ${label}`)
            return true
          }
        } catch (e) {
          console.warn(`[Spline3D] Approach 5 failed:`, e)
        }

        console.warn(`[Spline3D] All approaches failed to add image layer for ${label}`)
        return false
      } catch (err) {
        console.error(`[Spline3D] Error adding image layer to ${label}:`, err)
        return false
      }
    }

    // Handle Side 1 - Add image layer to material
    if (image1) {
      const obj1 = findObject(side1ObjectId, side1ObjectName)
      if (obj1) {
        side1ObjectRef.current = obj1
        const success = await addImageLayerToMaterial(obj1, image1, "Side 1")
        if (success) {
          console.log(`[Spline3D] ✓ Successfully added image layer to Side 1`)
        } else {
          console.warn(`[Spline3D] Failed to add image layer to Side 1`)
        }
      } else {
        console.warn(`[Spline3D] Side 1 object not found`)
      }
    } else {
      side1ObjectRef.current = null
    }

    // Handle Side 2 - Add image layer to material
    if (image2) {
      const obj2 = findObject(side2ObjectId, side2ObjectName)
      if (obj2) {
        side2ObjectRef.current = obj2
        const success = await addImageLayerToMaterial(obj2, image2, "Side 2")
        if (success) {
          console.log(`[Spline3D] ✓ Successfully added image layer to Side 2`)
        } else {
          console.warn(`[Spline3D] Failed to add image layer to Side 2`)
        }
      } else {
        console.warn(`[Spline3D] Side 2 object not found`)
      }
    } else {
      side2ObjectRef.current = null
    }

    // Force render
    if (app.renderer && scene && app.camera && typeof app.renderer.render === "function") {
      app.renderer.render(scene, app.camera)
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
