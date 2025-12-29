"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Application } from "@splinetool/runtime"

interface Spline3DPreviewProps {
  image1: string | null
  image2: string | null
  // Object IDs (UUIDs) - preferred method, more reliable than names
  side1ObjectId?: string
  side2ObjectId?: string
  // Object names - fallback if IDs not provided
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

  // Update textures when images change
  const updateTextures = useCallback(async () => {
    if (!splineAppRef.current || isLoading) return

    console.log("[Spline3D] Updating textures:", { 
      hasImage1: !!image1, 
      hasImage2: !!image2,
      side1ObjectId,
      side2ObjectId,
      side1ObjectName,
      side2ObjectName
    })

    // List all objects in the scene for debugging with full details
    try {
      const allObjects = splineAppRef.current.getAllObjects?.() || []
      console.log("[Spline3D] ========== ALL OBJECTS IN SCENE ==========")
      allObjects.forEach((o: any, index: number) => {
        const obj = o as any
        console.log(`[Spline3D] Object ${index + 1}:`, {
          id: obj.id || obj.uuid,
          name: obj.name,
          type: obj.type,
          hasMaterial: !!obj.material,
          material: obj.material ? {
            layers: obj.material.layers?.map((l: any) => ({
              type: l.type,
              properties: Object.keys(l).filter(k => !k.startsWith('_')),
              hasImage: l.image !== undefined,
              hasTexture: l.texture !== undefined,
              hasUrl: l.url !== undefined,
              image: l.image,
              texture: l.texture,
              url: l.url
            })) || []
          } : null,
          children: obj.children?.length || 0
        })
      })
      console.log("[Spline3D] ==========================================")
    } catch (err) {
      console.warn("[Spline3D] Could not list all objects:", err)
    }

    // Helper function to find object by ID or name
    const findObject = (id?: string, name?: string) => {
      if (id && splineAppRef.current?.findObjectById) {
        const objById = splineAppRef.current.findObjectById(id)
        if (objById) return objById
      }
      if (name && splineAppRef.current?.findObjectByName) {
        return splineAppRef.current.findObjectByName(name)
      }
      return null
    }

    // Helper function to load image and create texture
    const loadImageAsTexture = (imageUrl: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = imageUrl
      })
    }

    // Helper function to try updating texture on any object
    const tryUpdateTextureOnObject = async (obj: any, imageUrl: string, label: string) => {
      if (!obj) return false
      
      console.log(`[Spline3D] Trying to update texture on ${label}:`, {
        id: (obj as any).id || (obj as any).uuid,
        name: (obj as any).name,
        type: (obj as any).type,
        hasMaterial: !!(obj as any).material
      })

      const material = (obj as any).material
      if (!material || !material.layers) {
        console.warn(`[Spline3D] ${label} has no material or layers`)
        return false
      }

      // Try to load the image first
      let imageElement: HTMLImageElement | null = null
      try {
        imageElement = await loadImageAsTexture(imageUrl)
        console.log(`[Spline3D] Loaded image for ${label}:`, imageElement.width, 'x', imageElement.height)
      } catch (err) {
        console.warn(`[Spline3D] Failed to load image for ${label}:`, err)
      }

      // Get all layers and prioritize 'texture' and 'image' layers
      const allLayers = material.layers || []
      console.log(`[Spline3D] ${label} all layers (${allLayers.length}):`, allLayers.map((l: any) => ({
        type: l.type,
        properties: Object.keys(l).filter(k => !k.startsWith('_')),
        hasImage: l.image !== undefined,
        hasTexture: l.texture !== undefined,
        hasUrl: l.url !== undefined,
        hasSource: l.source !== undefined
      })))

      // Sort layers: prioritize 'texture' and 'image' types, then others
      const sortedLayers = [...allLayers].sort((a, b) => {
        const aPriority = a.type === 'texture' || a.type === 'image' ? 0 : 1
        const bPriority = b.type === 'texture' || b.type === 'image' ? 0 : 1
        return aPriority - bPriority
      })

      // Try each layer with all methods
      for (const layer of sortedLayers) {
        const layerType = layer.type
        console.log(`[Spline3D] Attempting to update ${label} layer type: ${layerType}`)
        
        try {
          // Method 1: updateTexture method (prioritize for texture/image layers)
          if (typeof layer.updateTexture === "function") {
            try {
              await layer.updateTexture(imageUrl)
              console.log(`[Spline3D] ✓ Updated ${label} via layer.updateTexture()`, { layerType })
              if (material.needsUpdate !== undefined) material.needsUpdate = true
              if (material.update && typeof material.update === "function") material.update()
              // Only return true if this is a texture/image layer, otherwise continue
              if (layerType === 'texture' || layerType === 'image') {
                return true
              }
            } catch (err) {
              console.warn(`[Spline3D] ✗ updateTexture() failed for ${label} (${layerType}):`, err)
            }
          }

          // Method 2: Try setting image element directly if we have it
          if (imageElement && layer.image !== undefined) {
            try {
              layer.image = imageElement
              console.log(`[Spline3D] ✓ Set ${label} layer.image = imageElement`, { layerType })
              if (material.needsUpdate !== undefined) material.needsUpdate = true
              if (material.update && typeof material.update === "function") material.update()
              if (layerType === 'texture' || layerType === 'image') {
                return true
              }
            } catch (err) {
              console.warn(`[Spline3D] ✗ Setting image element failed for ${label} (${layerType}):`, err)
            }
          }

          // Method 3: Try setting image URL
          if (layer.image !== undefined) {
            try {
              layer.image = imageUrl
              console.log(`[Spline3D] ✓ Set ${label} layer.image = imageUrl`, { layerType })
              if (material.needsUpdate !== undefined) material.needsUpdate = true
              if (material.update && typeof material.update === "function") material.update()
              if (layerType === 'texture' || layerType === 'image') {
                return true
              }
            } catch (err) {
              console.warn(`[Spline3D] ✗ Setting image URL failed for ${label} (${layerType}):`, err)
            }
          }

          // Method 4: Try texture property
          if (layer.texture) {
            try {
              if (typeof layer.texture.setImage === "function") {
                layer.texture.setImage(imageElement || imageUrl)
                console.log(`[Spline3D] ✓ Updated ${label} via texture.setImage()`, { layerType })
                if (material.needsUpdate !== undefined) material.needsUpdate = true
                if (material.update && typeof material.update === "function") material.update()
                if (layerType === 'texture' || layerType === 'image') {
                  return true
                }
              } else if (layer.texture.image !== undefined) {
                layer.texture.image = imageElement || imageUrl
                console.log(`[Spline3D] ✓ Set ${label} texture.image`, { layerType })
                if (material.needsUpdate !== undefined) material.needsUpdate = true
                if (material.update && typeof material.update === "function") material.update()
                if (layerType === 'texture' || layerType === 'image') {
                  return true
                }
              }
            } catch (err) {
              console.warn(`[Spline3D] ✗ Updating texture failed for ${label} (${layerType}):`, err)
            }
          }

          // Method 5: Try other properties (url, source, src, map)
          const propsToTry = ['url', 'source', 'src', 'map']
          for (const prop of propsToTry) {
            if (layer[prop] !== undefined) {
              try {
                layer[prop] = imageUrl
                console.log(`[Spline3D] ✓ Set ${label} layer.${prop} = imageUrl`, { layerType })
                if (material.needsUpdate !== undefined) material.needsUpdate = true
                if (material.update && typeof material.update === "function") material.update()
                if (layerType === 'texture' || layerType === 'image') {
                  return true
                }
              } catch (err) {
                // Continue to next property
              }
            }
          }
        } catch (err) {
          console.warn(`[Spline3D] ✗ Error updating ${label} layer (${layerType}):`, err)
        }
      }

      console.warn(`[Spline3D] ✗ Failed to update ${label} - no method worked on any layer`)
      return false
    }

    // Update Side 1 - try primary object first, then try all objects
    if (image1) {
      try {
        const primaryObject = findObject(side1ObjectId, side1ObjectName)
        let updated = false

        // Try primary object first
        if (primaryObject) {
          updated = await tryUpdateTextureOnObject(primaryObject, image1, "Side 1 (Primary)")
          if (updated) {
            console.log("[Spline3D] ✓ Successfully updated Side 1 on primary object")
          }
        }

        // Always try all objects in the scene (not just as fallback)
        if (splineAppRef.current) {
          console.log("[Spline3D] Trying to update Side 1 on all objects in scene...")
          try {
            const allObjects = splineAppRef.current.getAllObjects?.() || []
            console.log(`[Spline3D] Found ${allObjects.length} objects to try`)
            for (const obj of allObjects) {
              const objName = (obj as any).name || (obj as any).id || (obj as any).uuid || 'unnamed'
              const objId = (obj as any).id || (obj as any).uuid || 'no-id'
              // Skip if this is the primary object we already tried
              if (primaryObject && ((obj as any).id === (primaryObject as any).id || (obj as any).uuid === (primaryObject as any).uuid)) {
                continue
              }
              if (await tryUpdateTextureOnObject(obj, image1, `Side 1 (${objName} - ${objId})`)) {
                updated = true
                console.log(`[Spline3D] ✓ Successfully updated Side 1 on object: ${objName} (${objId})`)
                // Don't break - try to update multiple objects
              }
            }
          } catch (err) {
            console.error("[Spline3D] ✗ Error trying all objects for Side 1:", err)
          }
        } else {
          console.warn("[Spline3D] splineAppRef.current is null, cannot try all objects")
        }

        if (!updated) {
          console.error("[Spline3D] ✗ Failed to update Side 1 texture on any object")
        } else {
          console.log("[Spline3D] ✓ Side 1 update completed (may have updated multiple objects)")
        }
      } catch (err) {
        console.error("[Spline3D] ✗ Error updating Side 1:", err)
      }
    }

    // Update Side 2 - try primary object first, then try all objects
    if (image2) {
      try {
        const primaryObject = findObject(side2ObjectId, side2ObjectName)
        let updated = false

        // Try primary object first
        if (primaryObject) {
          updated = await tryUpdateTextureOnObject(primaryObject, image2, "Side 2 (Primary)")
          if (updated) {
            console.log("[Spline3D] ✓ Successfully updated Side 2 on primary object")
          }
        }

        // Always try all objects in the scene (not just as fallback)
        if (splineAppRef.current) {
          console.log("[Spline3D] Trying to update Side 2 on all objects in scene...")
          try {
            const allObjects = splineAppRef.current.getAllObjects?.() || []
            console.log(`[Spline3D] Found ${allObjects.length} objects to try`)
            for (const obj of allObjects) {
              const objName = (obj as any).name || (obj as any).id || (obj as any).uuid || 'unnamed'
              const objId = (obj as any).id || (obj as any).uuid || 'no-id'
              // Skip if this is the primary object we already tried
              if (primaryObject && ((obj as any).id === (primaryObject as any).id || (obj as any).uuid === (primaryObject as any).uuid)) {
                continue
              }
              if (await tryUpdateTextureOnObject(obj, image2, `Side 2 (${objName} - ${objId})`)) {
                updated = true
                console.log(`[Spline3D] ✓ Successfully updated Side 2 on object: ${objName} (${objId})`)
                // Don't break - try to update multiple objects
              }
            }
          } catch (err) {
            console.error("[Spline3D] ✗ Error trying all objects for Side 2:", err)
          }
        } else {
          console.warn("[Spline3D] splineAppRef.current is null, cannot try all objects")
        }

        if (!updated) {
          console.error("[Spline3D] ✗ Failed to update Side 2 texture on any object")
        } else {
          console.log("[Spline3D] ✓ Side 2 update completed (may have updated multiple objects)")
        }
      } catch (err) {
        console.error("[Spline3D] ✗ Error updating Side 2:", err)
      }
    }
  }, [image1, image2, side1ObjectId, side2ObjectId, side1ObjectName, side2ObjectName, isLoading])

  // Load Spline scene from local file
  useEffect(() => {
    if (!canvasRef.current || typeof window === "undefined") return

    setIsLoading(true)
    setError(null)

    try {
      const app = new Application(canvasRef.current)
      
      // Load scene from public directory
      app.load("/spline/scene.splinecode")
        .then(() => {
          splineAppRef.current = app
          setIsLoading(false)
          console.log("[Spline3D] Scene loaded successfully")
          // Update textures after scene loads
          setTimeout(() => {
            updateTextures()
          }, 500)
        })
        .catch((err) => {
          console.error("[Spline3D] Error loading scene:", err)
          setError(`Failed to load 3D scene: ${err.message || err}. Please check the console for details.`)
          setIsLoading(false)
        })
    } catch (err: any) {
      console.error("[Spline3D] Error initializing Spline:", err)
      setError(`Failed to initialize 3D viewer: ${err.message || err}. Please refresh the page.`)
      setIsLoading(false)
    }

    return () => {
      if (splineAppRef.current) {
        try {
          splineAppRef.current.dispose?.()
        } catch (err) {
          console.error("[Spline3D] Error disposing scene:", err)
        }
        splineAppRef.current = null
      }
    }
  }, [updateTextures])

  useEffect(() => {
    if (splineAppRef.current && !isLoading) {
      updateTextures()
    }
  }, [image1, image2, isLoading, updateTextures])

  if (!image1 && !image2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>3D Lamp Preview</CardTitle>
          <CardDescription>
            Upload images to see your artwork on the 3D lamp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[600px] border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-center">
              Upload images for both sides of the lamp to see the 3D preview
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>3D Lamp Preview</CardTitle>
        <CardDescription>
          See how your artwork looks on the 3D lamp. Rotate and interact with the model.
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
            style={{ display: "block" }}
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
      </CardContent>
    </Card>
  )
}
