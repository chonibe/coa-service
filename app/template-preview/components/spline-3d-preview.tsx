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
  const updateTextures = useCallback(() => {
    if (!splineAppRef.current || isLoading) return

    console.log("[Spline3D] Updating textures:", { 
      hasImage1: !!image1, 
      hasImage2: !!image2,
      side1ObjectId,
      side2ObjectId,
      side1ObjectName,
      side2ObjectName
    })

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

    // Update Side 1
    if (image1) {
      try {
        const object = findObject(side1ObjectId, side1ObjectName)
        if (object) {
          console.log("[Spline3D] Found Side 1 object:", object)
          const material = (object as any).material
          if (material && material.layers) {
            // Find the texture layer (could be 'image' or 'texture' type)
            const textureLayer = material.layers.find((layer: any) => 
              layer.type === "image" || layer.type === "texture"
            )
            if (textureLayer) {
              console.log("[Spline3D] Found texture layer:", { type: textureLayer.type, properties: Object.keys(textureLayer) })
              
              // Try updateTexture method first (if available)
              if (typeof textureLayer.updateTexture === "function") {
                textureLayer.updateTexture(image1).catch((err: any) => {
                  console.warn("[Spline3D] updateTexture failed, trying direct property update:", err)
                  // Fallback to direct property update
                  if (textureLayer.image !== undefined) {
                    textureLayer.image = image1
                  } else if (textureLayer.texture !== undefined) {
                    textureLayer.texture = image1
                  } else if (textureLayer.url !== undefined) {
                    textureLayer.url = image1
                  } else {
                    textureLayer.image = image1
                  }
                  if (material.needsUpdate !== undefined) {
                    material.needsUpdate = true
                  }
                })
              } else {
                // Direct property update
                if (textureLayer.image !== undefined) {
                  textureLayer.image = image1
                } else if (textureLayer.texture !== undefined) {
                  textureLayer.texture = image1
                } else if (textureLayer.url !== undefined) {
                  textureLayer.url = image1
                } else {
                  // Try setting image property directly
                  textureLayer.image = image1
                }
                // Mark material as needing update
                if (material.needsUpdate !== undefined) {
                  material.needsUpdate = true
                }
              }
              console.log("[Spline3D] Updated Side 1 texture", { layerType: textureLayer.type })
            } else {
              console.warn("[Spline3D] No texture/image layer found on Side 1 material. Available layers:", material.layers.map((l: any) => l.type))
            }
          } else {
            console.warn("[Spline3D] No material or layers found on Side 1 object. Material:", material)
          }
        } else {
          const identifier = side1ObjectId || side1ObjectName
          console.warn(`[Spline3D] Object "${identifier}" not found in scene.`, {
            searchedById: !!side1ObjectId,
            searchedByName: !!side1ObjectName,
            availableObjects: splineAppRef.current.getAllObjects?.()?.map((o: any) => ({
              id: o.id || o.uuid,
              name: o.name
            })) || "unknown"
          })
        }
      } catch (err) {
        console.error("[Spline3D] Error updating Side 1:", err)
      }
    }

    // Update Side 2
    if (image2) {
      try {
        const object = findObject(side2ObjectId, side2ObjectName)
        if (object) {
          console.log("[Spline3D] Found Side 2 object:", object)
          const material = (object as any).material
          if (material && material.layers) {
            // Find the texture layer (could be 'image' or 'texture' type)
            const textureLayer = material.layers.find((layer: any) => 
              layer.type === "image" || layer.type === "texture"
            )
            if (textureLayer) {
              console.log("[Spline3D] Found texture layer:", { type: textureLayer.type, properties: Object.keys(textureLayer) })
              
              // Try updateTexture method first (if available)
              if (typeof textureLayer.updateTexture === "function") {
                textureLayer.updateTexture(image2).catch((err: any) => {
                  console.warn("[Spline3D] updateTexture failed, trying direct property update:", err)
                  // Fallback to direct property update
                  if (textureLayer.image !== undefined) {
                    textureLayer.image = image2
                  } else if (textureLayer.texture !== undefined) {
                    textureLayer.texture = image2
                  } else if (textureLayer.url !== undefined) {
                    textureLayer.url = image2
                  } else {
                    textureLayer.image = image2
                  }
                  if (material.needsUpdate !== undefined) {
                    material.needsUpdate = true
                  }
                })
              } else {
                // Direct property update
                if (textureLayer.image !== undefined) {
                  textureLayer.image = image2
                } else if (textureLayer.texture !== undefined) {
                  textureLayer.texture = image2
                } else if (textureLayer.url !== undefined) {
                  textureLayer.url = image2
                } else {
                  // Try setting image property directly
                  textureLayer.image = image2
                }
                // Mark material as needing update
                if (material.needsUpdate !== undefined) {
                  material.needsUpdate = true
                }
              }
              console.log("[Spline3D] Updated Side 2 texture", { layerType: textureLayer.type })
            } else {
              console.warn("[Spline3D] No texture/image layer found on Side 2 material. Available layers:", material.layers.map((l: any) => l.type))
            }
          } else {
            console.warn("[Spline3D] No material or layers found on Side 2 object. Material:", material)
          }
        } else {
          const identifier = side2ObjectId || side2ObjectName
          console.warn(`[Spline3D] Object "${identifier}" not found in scene.`, {
            searchedById: !!side2ObjectId,
            searchedByName: !!side2ObjectName,
            availableObjects: splineAppRef.current.getAllObjects?.()?.map((o: any) => ({
              id: o.id || o.uuid,
              name: o.name
            })) || "unknown"
          })
        }
      } catch (err) {
        console.error("[Spline3D] Error updating Side 2:", err)
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
