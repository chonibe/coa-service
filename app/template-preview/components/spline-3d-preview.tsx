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
  
  // Store discovered layers for toggling
  interface LayerInfo {
    objectName: string
    objectId: string
    layerIndex: number
    layerType: string
    layerName: string
    visible: boolean
    layerRef: any
    materialRef: any
  }
  const [discoveredLayers, setDiscoveredLayers] = useState<LayerInfo[]>([])

  // Toggle model visibility
  const toggleModelVisibility = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.style.opacity = isModelVisible ? '0' : '1'
      setIsModelVisible(!isModelVisible)
    }
  }, [isModelVisible])

  // Toggle individual layer visibility
  const toggleLayerVisibility = useCallback((layerInfo: LayerInfo) => {
    const app = splineAppRef.current as any
    if (!app || !layerInfo.layerRef || !layerInfo.materialRef) {
      console.warn(`[Spline3D] Cannot toggle layer: missing references`)
      return
    }

    try {
      const newVisible = !layerInfo.visible
      layerInfo.layerRef.visible = newVisible
      
      // Update material
      layerInfo.materialRef.needsUpdate = true
      if (layerInfo.materialRef.version !== undefined) {
        layerInfo.materialRef.version++
      }
      
      // Force app update
      if (app.update && typeof app.update === 'function') {
        app.update()
      }
      
      // Update state
      setDiscoveredLayers(prev => 
        prev.map(layer => 
          layer.objectId === layerInfo.objectId && 
          layer.layerIndex === layerInfo.layerIndex
            ? { ...layer, visible: newVisible }
            : layer
        )
      )
      
      console.log(`[Spline3D] Toggled ${layerInfo.objectName} layer ${layerInfo.layerIndex} (${layerInfo.layerType}) to ${newVisible ? 'visible' : 'hidden'}`)
    } catch (err) {
      console.error(`[Spline3D] Error toggling layer:`, err)
    }
  }, [])

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

        // Log all layers with detailed info
        const layerInfo = material.layers?.map((l: any, idx: number) => ({
          index: idx,
          type: l.type,
          visible: l.visible,
          alpha: l.alpha,
          hasImage: l.image !== undefined,
          hasMap: l.map !== undefined,
          hasTexture: l.texture !== undefined,
          name: l.name || l.id || 'unnamed'
        })) || []
        
        console.log(`[Spline3D] Found material for ${label}:`, {
          hasLayers: !!material.layers,
          layersCount: material.layers?.length,
          layerTypes: material.layers?.map((l: any) => l.type),
          layerDetails: layerInfo
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

        // Approach 1: Try to update existing image layer (prioritize image type layers first)
        if (material.layers && Array.isArray(material.layers)) {
          // First pass: Look specifically for 'image' type layers (added in Spline)
          for (let i = 0; i < material.layers.length; i++) {
            const layer = material.layers[i]
            if (layer.type === 'image') {
              try {
                console.log(`[Spline3D] Found image layer ${i} for ${label} - attempting to update`, {
                  hasImage: layer.image !== undefined,
                  hasMap: layer.map !== undefined,
                  visible: layer.visible,
                  alpha: layer.alpha,
                  layerName: layer.name || layer.id || 'unnamed'
                })
                
                // Try setting image directly - image layers should support this
                layer.image = imageElement
                if (layer.map !== undefined) layer.map = imageElement
                if (layer.texture !== undefined) layer.texture = imageElement
                
                layer.visible = true
                layer.alpha = 1
                if (layer.opacity !== undefined) layer.opacity = 1
                
                // Try update methods
                if (layer.updateTexture && typeof layer.updateTexture === 'function') {
                  layer.updateTexture(imageElement)
                }
                if (layer.update && typeof layer.update === 'function') {
                  layer.update()
                }
                if (layer.setImage && typeof layer.setImage === 'function') {
                  layer.setImage(imageElement)
                }
                
                material.needsUpdate = true
                if (material.version !== undefined) {
                  material.version++
                }
                
                // Force app update
                if (app.update && typeof app.update === 'function') {
                  app.update()
                }
                
                console.log(`[Spline3D] ✓ Approach 1a: Updated existing image layer ${i} for ${label}`, {
                  layerVisible: layer.visible,
                  layerAlpha: layer.alpha,
                  layerImageSet: layer.image === imageElement
                })
                return true
              } catch (e) {
                console.warn(`[Spline3D] Approach 1a failed for image layer ${i}:`, e)
              }
            }
          }
          
          // Second pass: Try texture/matcap layers if no image layer found
          for (let i = 0; i < material.layers.length; i++) {
            const layer = material.layers[i]
            if (layer.type === 'texture' || layer.type === 'matcap') {
              try {
                console.log(`[Spline3D] Attempting to update existing ${layer.type} layer ${i} for ${label}`, {
                  hasImage: layer.image !== undefined,
                  visible: layer.visible,
                  alpha: layer.alpha
                })
                
                // Try setting image directly
                if (layer.image !== undefined || layer.map !== undefined) {
                  if (layer.image !== undefined) layer.image = imageElement
                  if (layer.map !== undefined) layer.map = imageElement
                  if (layer.texture !== undefined) layer.texture = imageElement
                  
                  layer.visible = true
                  layer.alpha = 1
                  if (layer.opacity !== undefined) layer.opacity = 1
                  
                  // Try update methods
                  if (layer.updateTexture && typeof layer.updateTexture === 'function') {
                    layer.updateTexture(imageElement)
                  }
                  if (layer.update && typeof layer.update === 'function') {
                    layer.update()
                  }
                  if (layer.setImage && typeof layer.setImage === 'function') {
                    layer.setImage(imageElement)
                  }
                  
                  material.needsUpdate = true
                  if (material.version !== undefined) {
                    material.version++
                  }
                  
                  // Force app update
                  if (app.update && typeof app.update === 'function') {
                    app.update()
                  }
                  
                  console.log(`[Spline3D] ✓ Approach 1b: Updated existing ${layer.type} layer ${i} for ${label}`, {
                    layerVisible: layer.visible,
                    layerAlpha: layer.alpha
                  })
                  return true
                }
              } catch (e) {
                console.warn(`[Spline3D] Approach 1b failed for layer ${i}:`, e)
              }
            }
          }
        }

        // Approach 2: Try to push a new layer to layers array
        if (material.layers && Array.isArray(material.layers)) {
          try {
            // Create a new layer object with all possible properties
            const newLayer: any = {
              type: 'image',
              image: imageElement,
              visible: true,
              alpha: 1,
              mode: 0, // Normal blend mode
              isMask: false,
              opacity: 1,
              // Try to set as base/primary layer
              blendMode: 'normal',
              // Set texture properties if they exist
              map: imageElement,
              texture: imageElement,
              url: imageUrl
            }
            
            // Try to add at the beginning of the array (might make it more visible)
            material.layers.unshift(newLayer)
            
            // Also try setting it as the primary/base layer if such property exists
            if (material.baseLayer !== undefined) {
              material.baseLayer = newLayer
            }
            if (material.primaryLayer !== undefined) {
              material.primaryLayer = newLayer
            }
            
            // Force multiple update flags
            material.needsUpdate = true
            if (material.version !== undefined) {
              material.version++
            }
            
            // Try to trigger update on the layer itself
            if (newLayer.update) {
              newLayer.update()
            }
            if (newLayer.updateTexture) {
              newLayer.updateTexture(imageElement)
            }
            
            // Force app update
            if (app.update && typeof app.update === 'function') {
              app.update()
            }
            
            console.log(`[Spline3D] ✓ Approach 2: Pushed new image layer to layers array for ${label}`, {
              layerIndex: 0,
              totalLayers: material.layers.length,
              layerProperties: Object.keys(newLayer)
            })
            return true
          } catch (e) {
            console.warn(`[Spline3D] Approach 2 failed:`, e)
          }
        }

        // Approach 3: Try to create a new image layer using Spline API
        if (material.addLayer && typeof material.addLayer === 'function') {
          try {
            const newLayer = material.addLayer('image')
            if (newLayer) {
              newLayer.image = imageElement
              newLayer.visible = true
              newLayer.alpha = 1
              material.needsUpdate = true
              if (app.update && typeof app.update === 'function') {
                app.update()
              }
              console.log(`[Spline3D] ✓ Approach 3: Added image layer via addLayer() for ${label}`)
              return true
            }
          } catch (e) {
            console.warn(`[Spline3D] Approach 3 failed:`, e)
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
            
            // Inspect PC material layers
            const inspectPCMaterials = () => {
              const app = splineAppRef.current as any
              if (!app) return
              
              console.log("[Spline3D] ===== INSPECTING PC MATERIALS =====")
              
              // Try to find PC Trans A and PC Trans B objects
              const side1Id = "2de1e7d2-4b53-4738-a749-be197641fa9a"
              const side2Id = "2e33392b-21d8-441d-87b0-11527f3a8b70"
              
              const objectsToCheck = [
                { id: side1Id, name: "Side 1 (PC Trans A)" },
                { id: side2Id, name: "Side 2 (PC Trans B)" }
              ]
              
              const allLayers: LayerInfo[] = []
              
              objectsToCheck.forEach(({ id, name }) => {
                const obj = app.findObjectById?.(id) || app.findObjectByName?.(name.split(" ")[0])
                if (!obj) {
                  console.warn(`[Spline3D] ${name} object not found`)
                  return
                }
                
                console.log(`[Spline3D] --- ${name} Material Inspection ---`)
                console.log(`[Spline3D] Object found:`, {
                  id: obj.id,
                  name: obj.name,
                  type: obj.type,
                  uuid: obj.uuid
                })
                
                // Get material
                let material = obj.material
                if (!material && obj.mesh) {
                  material = obj.mesh.material
                }
                
                if (!material) {
                  console.warn(`[Spline3D] No material found on ${name}`)
                  return
                }
                
                console.log(`[Spline3D] Material found:`, {
                  type: material.type,
                  name: material.name,
                  uuid: material.uuid,
                  hasLayers: !!material.layers,
                  layersCount: material.layers?.length
                })
                
                // Log all layers in detail and store them
                if (material.layers && Array.isArray(material.layers)) {
                  console.log(`[Spline3D] Total layers: ${material.layers.length}`)
                  material.layers.forEach((layer: any, index: number) => {
                    const layerInfo = {
                      type: layer.type,
                      visible: layer.visible,
                      alpha: layer.alpha,
                      opacity: layer.opacity,
                      mode: layer.mode,
                      isMask: layer.isMask,
                      hasImage: layer.image !== undefined,
                      hasMap: layer.map !== undefined,
                      hasTexture: layer.texture !== undefined,
                      imageType: layer.image?.constructor?.name,
                      imageSrc: layer.image?.src || layer.image?.currentSrc || 'N/A',
                      name: layer.name || layer.id || 'unnamed',
                      allProperties: Object.keys(layer)
                    }
                    
                    console.log(`[Spline3D] Layer ${index}:`, layerInfo)
                    
                    // Store layer for toggling
                    allLayers.push({
                      objectName: name,
                      objectId: id,
                      layerIndex: index,
                      layerType: layer.type,
                      layerName: layer.name || layer.id || `Layer ${index}`,
                      visible: layer.visible !== false,
                      layerRef: layer,
                      materialRef: material
                    })
                    
                    // If it's an image layer, log more details
                    if (layer.type === 'image') {
                      console.log(`[Spline3D]   → IMAGE LAYER DETAILS:`, {
                        image: layer.image,
                        imageWidth: layer.image?.width,
                        imageHeight: layer.image?.height,
                        imageComplete: layer.image?.complete,
                        imageNaturalWidth: layer.image?.naturalWidth,
                        imageNaturalHeight: layer.image?.naturalHeight
                      })
                    }
                  })
                } else {
                  console.warn(`[Spline3D] Material has no layers array`)
                }
                
                console.log(`[Spline3D] --- End ${name} Inspection ---\n`)
              })
              
              // Store all discovered layers in state
              setDiscoveredLayers(allLayers)
              
              console.log("[Spline3D] ===== END PC MATERIAL INSPECTION =====")
              console.log(`[Spline3D] Stored ${allLayers.length} layers for toggling`)
            }
            
            // Inspect materials after a short delay to ensure scene is fully loaded
            setTimeout(() => {
              inspectPCMaterials()
            }, 500)
            
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

        <div className="flex flex-col gap-4 mt-4">
          <div className="flex gap-2">
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

          {/* Layer Toggle Controls */}
          {discoveredLayers.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="text-sm font-semibold mb-3">Layer Controls</h3>
              <div className="space-y-3">
                {discoveredLayers.map((layerInfo, idx) => (
                  <div key={`${layerInfo.objectId}-${layerInfo.layerIndex}`} className="flex items-center gap-2">
                    <Button
                      onClick={() => toggleLayerVisibility(layerInfo)}
                      variant={layerInfo.visible ? "default" : "outline"}
                      size="sm"
                      disabled={isLoading || !!error}
                      className="flex items-center gap-2 flex-1 justify-start"
                    >
                      {layerInfo.visible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                      <span className="text-xs">
                        {layerInfo.objectName} - Layer {layerInfo.layerIndex} ({layerInfo.layerType})
                      </span>
                      {layerInfo.layerType === 'image' && (
                        <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-0.5 rounded">IMAGE</span>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Toggle layers on/off to isolate which one is the image layer
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
