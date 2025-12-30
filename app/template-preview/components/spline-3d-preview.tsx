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
    originalValue?: any // For direct material properties
    property?: string // For direct material properties
    hasTextureImage?: boolean // Track if layer has texture.image data
  }
  const [discoveredLayers, setDiscoveredLayers] = useState<LayerInfo[]>([])
  
  // Store discovered objects for toggling
  interface ObjectInfo {
    objectName: string
    objectId: string
    objectPath: string
    visible: boolean
    objectRef: any
    meshRef: any
  }

  // Debug function to inspect current texture sizes
  const debugTextureSizes = useCallback(() => {
    console.log("[Spline3D] ===== DEBUGGING TEXTURE SIZES =====")

    const app = splineAppRef.current as any
    if (!app) {
      console.warn("[Spline3D] No app available for debugging")
      return
    }

    const scene = app.scene || app._scene
    if (!scene) {
      console.warn("[Spline3D] No scene available for debugging")
      return
    }

    // Find objects and inspect their textures
    const findAndInspectTextures = (obj: any, path = "") => {
      if (!obj) return

      const currentPath = path ? `${path} > ${obj.name || obj.type}` : obj.name || obj.type

      // Check if this object has materials/layers
      let material = obj.material
      if (!material && obj.mesh) {
        material = obj.mesh.material
      }

      if (material && material.layers) {
        console.log(`[Spline3D] Inspecting ${currentPath}:`)
        material.layers.forEach((layer: any, index: number) => {
          if (layer.texture && layer.texture.image) {
            console.log(`  Layer ${index} (${layer.type}):`, {
              textureRepeat: layer.texture.repeat,
              textureOffset: layer.texture.offset,
              textureRotation: layer.texture.rotation,
              imageRepeat: layer.texture.image.repeat,
              imageOffset: layer.texture.image.offset,
              imageRotation: layer.texture.image.rotation,
              imageSize: `${layer.texture.image.width}x${layer.texture.image.height}`,
              textureScale: layer.texture.scale
            })
          }
        })
      }

      // Recursively check children
      if (obj.children) {
        obj.children.forEach((child: any) => findAndInspectTextures(child, currentPath))
      }

      // Check mesh children
      if (obj.mesh && obj.mesh.children) {
        obj.mesh.children.forEach((child: any) => findAndInspectTextures(child, `${currentPath} (mesh)`))
      }
    }

    findAndInspectTextures(scene)
    console.log("[Spline3D] ===== END TEXTURE SIZE DEBUG =====")
  }, [])
  const [discoveredObjects, setDiscoveredObjects] = useState<ObjectInfo[]>([])
  
  // Store PC Trans B object layers for focused testing
  const [pcTransBLayers, setPcTransBLayers] = useState<LayerInfo[]>([])
  const [showOtherControls, setShowOtherControls] = useState(false) // Hide other controls by default

  // Toggle model visibility
  const toggleModelVisibility = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.style.opacity = isModelVisible ? '0' : '1'
      setIsModelVisible(!isModelVisible)
    }
  }, [isModelVisible])

  // Store original values for direct material properties
  const originalMaterialValuesRef = useRef<Map<string, any>>(new Map())
  
  // Toggle entire object visibility
  const toggleObjectVisibility = useCallback((objectInfo: ObjectInfo) => {
    const app = splineAppRef.current as any
    if (!app || !objectInfo.objectRef) {
      console.warn(`[Spline3D] Cannot toggle object: missing references`)
      return
    }

    try {
      const newVisible = !objectInfo.visible
      const obj = objectInfo.objectRef
      const mesh = objectInfo.meshRef || obj.mesh
      
      // Try multiple ways to hide/show the object
      if (obj.visible !== undefined) {
        obj.visible = newVisible
      }
      if (mesh && mesh.visible !== undefined) {
        mesh.visible = newVisible
      }
      
      // Try Spline API methods
      if (obj.setVisible && typeof obj.setVisible === 'function') {
        obj.setVisible(newVisible)
      }
      if (obj.hide && typeof obj.hide === 'function' && !newVisible) {
        obj.hide()
      }
      if (obj.show && typeof obj.show === 'function' && newVisible) {
        obj.show()
      }
      
      // Try THREE.js methods
      if (mesh && mesh.visible !== undefined) {
        mesh.visible = newVisible
      }
      
      // Force app update
      if (app.update && typeof app.update === 'function') {
        app.update()
      }
      
      // Force render
      if (app.renderer && app.scene && app.camera) {
        app.renderer.render(app.scene, app.camera)
      }
      
      // Update state
      setDiscoveredObjects(prev => 
        prev.map(obj => 
          obj.objectId === objectInfo.objectId
            ? { ...obj, visible: newVisible }
            : obj
        )
      )
      
      console.log(`[Spline3D] Toggled object ${objectInfo.objectName} to ${newVisible ? 'visible' : 'hidden'}`)
    } catch (err) {
      console.error(`[Spline3D] Error toggling object:`, err)
    }
  }, [])

  // Toggle individual layer visibility
  const toggleLayerVisibility = useCallback((layerInfo: LayerInfo) => {
    const app = splineAppRef.current as any
    if (!app || !layerInfo.layerRef || !layerInfo.materialRef) {
      console.warn(`[Spline3D] Cannot toggle layer: missing references`)
      return
    }

    try {
      const newVisible = !layerInfo.visible
      
      // Handle clearing images from layers
      if (layerInfo.layerType.startsWith('clear-')) {
        const layer = layerInfo.layerRef
        const key = `${layerInfo.objectId}-clear-${layerInfo.layerIndex}`

        if (newVisible) {
          // Restore original image - check all possible locations
          const originalImage = originalMaterialValuesRef.current.get(`${key}-image`)
          const originalMap = originalMaterialValuesRef.current.get(`${key}-map`)
          const originalTexture = originalMaterialValuesRef.current.get(`${key}-texture`)
          const originalTextureImage = originalMaterialValuesRef.current.get(`${key}-textureImage`)

          if (originalImage !== undefined) layer.image = originalImage
          if (originalMap !== undefined) layer.map = originalMap
          if (originalTexture !== undefined) layer.texture = originalTexture
          if (originalTextureImage !== undefined && layer.texture) {
            layer.texture.image = originalTextureImage
          }

          console.log(`[Spline3D] Restored image on ${layerInfo.objectName} (including texture.image)`)
        } else {
          // Store original and clear - check all possible locations
          if (!originalMaterialValuesRef.current.has(`${key}-image`)) {
            originalMaterialValuesRef.current.set(`${key}-image`, layer.image)
            originalMaterialValuesRef.current.set(`${key}-map`, layer.map)
            originalMaterialValuesRef.current.set(`${key}-texture`, layer.texture)
            if (layer.texture?.image !== undefined) {
              originalMaterialValuesRef.current.set(`${key}-textureImage`, layer.texture.image)
            }
          }

          layer.image = null
          layer.map = null
          // Clear texture.image specifically (this is where the JPEG data was found!)
          if (layer.texture?.image !== undefined) {
            layer.texture.image = null
            console.log(`[Spline3D] Cleared texture.image from ${layerInfo.objectName} - this should remove the visible image!`)
          } else {
            layer.texture = null
          }

          console.log(`[Spline3D] Cleared image from ${layerInfo.objectName}`)
        }
      }
      // Handle direct material properties (not layers)
      else if (layerInfo.layerType === 'direct-material' || layerInfo.layerType === 'scene-direct-material') {
        const material = layerInfo.layerRef.material
        const property = layerInfo.layerRef.property
        const key = `${layerInfo.objectId}-${property}`
        
        if (newVisible) {
          // Restore original value
          const originalValue = originalMaterialValuesRef.current.get(key)
          if (originalValue !== undefined) {
            material[property] = originalValue
            console.log(`[Spline3D] Restored ${property} on ${layerInfo.objectName}`)
          }
        } else {
          // Store original and clear
          if (!originalMaterialValuesRef.current.has(key)) {
            originalMaterialValuesRef.current.set(key, material[property])
          }
          material[property] = null
          console.log(`[Spline3D] Cleared ${property} on ${layerInfo.objectName}`)
        }
      } else {
        // Handle regular layers
        layerInfo.layerRef.visible = newVisible
      }
      
      // Update material
      layerInfo.materialRef.needsUpdate = true
      if (layerInfo.materialRef.version !== undefined) {
        layerInfo.materialRef.version++
      }
      
      // Force app update
      if (app.update && typeof app.update === 'function') {
        app.update()
      }
      
      // Force render
      if (app.renderer && app.scene && app.camera) {
        app.renderer.render(app.scene, app.camera)
      }
      
      // Update state
      setDiscoveredLayers(prev => 
        prev.map(layer => {
          // Match by objectId and layerIndex, or by exact objectId match for clear-* types
          const matches = layer.objectId === layerInfo.objectId && 
            (layer.layerIndex === layerInfo.layerIndex || 
             (layerInfo.layerType.startsWith('clear-') && layer.objectId === layerInfo.objectId))
          
          return matches ? { ...layer, visible: newVisible } : layer
        })
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

    // Helper to find object by traversing path or by name/ID
    const findObject = (id?: string, name?: string, alternativeNames?: string[], path?: string[]) => {
      // Try by ID first
      if (id && app.findObjectById) {
        const obj = app.findObjectById(id)
        if (obj) {
          console.log(`[Spline3D] Found object by ID: ${id}`)
          return obj
        }
      }
      
      // Try by path traversal (most reliable)
      if (path && path.length > 0) {
        let currentObj: any = scene
        for (const pathSegment of path) {
          if (!currentObj) break
          
          // Try to find in children
          const children = currentObj.children || []
          const found = children.find((child: any) => 
            child.name === pathSegment || 
            child.type === pathSegment ||
            (typeof child.name === 'string' && child.name.includes(pathSegment))
          )
          
          if (found) {
            currentObj = found
          } else {
            // Try mesh children
            if (currentObj.mesh && currentObj.mesh.children) {
              const meshFound = currentObj.mesh.children.find((child: any) => 
                child.name === pathSegment || 
                child.type === pathSegment ||
                (typeof child.name === 'string' && child.name.includes(pathSegment))
              )
              if (meshFound) {
                currentObj = meshFound
              } else {
                currentObj = null
                break
              }
            } else {
              currentObj = null
              break
            }
          }
        }
        
        if (currentObj) {
          console.log(`[Spline3D] Found object by path: ${path.join(' > ')}`)
          return currentObj
        }
      }
      
      // Try alternative names first (more specific)
      if (alternativeNames && app.findObjectByName) {
        for (const altName of alternativeNames) {
          const obj = app.findObjectByName(altName)
          if (obj) {
            console.log(`[Spline3D] Found object by alternative name: ${altName}`)
            return obj
          }
        }
      }
      
      // Try provided name
      if (name && app.findObjectByName) {
        const obj = app.findObjectByName(name)
        if (obj) {
          console.log(`[Spline3D] Found object by name: ${name}`)
          return obj
        }
      }
      
      console.warn(`[Spline3D] Object not found - ID: ${id}, Name: ${name}, Path: ${path?.join(' > ')}`)
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

        // Load image as blob and convert to Uint8Array (like the texture.image format)
        const imageResponse = await fetch(imageUrl)
        const imageBlob = await imageResponse.blob()
        const imageArrayBuffer = await imageBlob.arrayBuffer()
        const imageUint8Array = new Uint8Array(imageArrayBuffer)

        console.log(`[Spline3D] ✓ Loaded image data for ${label}`, {
          size: imageUint8Array.length,
          type: imageBlob.type,
          url: imageUrl
        })

        // Also create HTMLImageElement for fallback approaches
        const imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = imageUrl
        })

        console.log(`[Spline3D] ✓ Also loaded HTMLImageElement for ${label}`, {
          width: imageElement.width,
          height: imageElement.height
        })

        // Try multiple approaches to add image layer

        // Approach 1: Try to update existing texture layers that have images
        // This approach specifically targets texture.image data which is where we found the actual image data
        if (material.layers && Array.isArray(material.layers)) {
          // Update ALL texture layers that have images (both layer 4 and 8)
          let updatedLayers = 0
          for (let i = 0; i < material.layers.length; i++) {
            const layer = material.layers[i]
            if (layer.type === 'texture' && layer.texture && layer.texture.image) {
              try {
                console.log(`[Spline3D] Found image layer ${i} for ${label} - attempting to update`, {
                  hasImage: layer.image !== undefined,
                  hasMap: layer.map !== undefined,
                  visible: layer.visible,
                  alpha: layer.alpha,
                  layerName: layer.name || layer.id || 'unnamed'
                })
                
                // Try setting image data - prioritize texture.image for existing textures
                if (layer.texture && layer.texture.image !== undefined) {
                  // This is the key! Replace the texture.image completely with new image data
                  // Keep the same structure as the original texture.image object
                  const originalImage = layer.texture.image

                  console.log(`[Spline3D] Original texture.image structure:`, {
                    hasData: !!originalImage.data,
                    dataType: originalImage.data?.constructor?.name,
                    dataLength: originalImage.data?.length,
                    hasWidth: originalImage.width !== undefined,
                    hasHeight: originalImage.height !== undefined,
                    hasName: originalImage.name !== undefined,
                    hasMagFilter: originalImage.magFilter !== undefined,
                    hasMinFilter: originalImage.minFilter !== undefined,
                    currentOffset: originalImage.offset,
                    currentRepeat: originalImage.repeat,
                    currentRotation: originalImage.rotation,
                    allProperties: Object.keys(originalImage)
                  })

                  // STEP 1: SET SCALING/POSITIONING FIRST (separate from image replacement)
                  console.log(`[Spline3D] STEP 1: Setting texture scale/position BEFORE image replacement for layer ${i}`)

                  const targetScaleX = 19
                  const targetScaleY = 13

                  // Set texture-level UV transform properties (these control how the texture is mapped)
                  if (layer.texture.repeat !== undefined) {
                    layer.texture.repeat.set(targetScaleX, targetScaleY)
                    console.log(`[Spline3D] ✓ Set texture.repeat to [${targetScaleX}, ${targetScaleY}]`)
                  }
                  if (layer.texture.offset !== undefined) {
                    layer.texture.offset.set(-0.05, -0.05)
                    console.log(`[Spline3D] ✓ Set texture.offset to [-0.05, -0.05]`)
                  }
                  if (layer.texture.rotation !== undefined) {
                    layer.texture.rotation = -90 * (Math.PI / 180)
                    console.log(`[Spline3D] ✓ Set texture.rotation to -90°`)
                  }

                  // Update texture matrix to apply UV transforms BEFORE image replacement
                  if (layer.texture.updateMatrix) {
                    layer.texture.updateMatrix()
                    console.log(`[Spline3D] ✓ Updated texture matrix for UV transforms`)
                  } else if (layer.texture.matrixNeedsUpdate !== undefined) {
                    layer.texture.matrixNeedsUpdate = true
                    console.log(`[Spline3D] ✓ Marked texture matrix as needsUpdate`)
                  }

                  // STEP 2: REPLACE IMAGE DATA AFTER SCALING IS SET
                  console.log(`[Spline3D] STEP 2: Replacing image data AFTER scaling is set for layer ${i}`)

                  layer.texture.image.data = imageUint8Array
                  layer.texture.image.width = imageElement.width
                  layer.texture.image.height = imageElement.height
                  layer.texture.image.name = `uploaded-image-${label}`

                  // Preserve image-level properties (don't override the UV transforms we just set)
                  layer.texture.image.magFilter = originalImage.magFilter !== undefined ? originalImage.magFilter : 1006
                  layer.texture.image.minFilter = originalImage.minFilter !== undefined ? originalImage.minFilter : 1008
                  layer.texture.image.wrapping = originalImage.wrapping !== undefined ? originalImage.wrapping : 1000

                  console.log(`[Spline3D] ✓ REPLACED texture.image with proper scaling for layer ${i}`, {
                    newImageName: layer.texture.image.name,
                    newImageSize: imageUint8Array.length,
                    newImageDimensions: `${imageElement.width}x${imageElement.height}`,
                    scalingApplied: {
                      currentScale: `${currentScaleX}x${currentScaleY}`,
                      targetScale: `${targetScaleX}x${targetScaleY}`,
                      scaleFactors: `${scaleFactorX.toFixed(2)}x${scaleFactorY.toFixed(2)}`,
                      newRepeat: layer.texture.image.repeat,
                      newOffset: layer.texture.image.offset,
                      newRotationDegrees: layer.texture.image.rotation * (180 / Math.PI)
                    },
                    preservedProperties: {
                      magFilter: layer.texture.image.magFilter,
                      minFilter: layer.texture.image.minFilter,
                      wrapping: layer.texture.image.wrapping
                    }
                  })

                  // Debug: Show what we're actually setting vs original
                  console.log(`[Spline3D] DEBUG - Texture scaling for layer ${i}:`, {
                    originalImageRepeat: originalImage.repeat,
                    newImageRepeat: layer.texture.image.repeat,
                    originalImageOffset: originalImage.offset,
                    newImageOffset: layer.texture.image.offset,
                    originalImageRotation: originalImage.rotation,
                    newImageRotation: layer.texture.image.rotation,
                    // Also check texture-level properties
                    originalTextureRepeat: layer.texture.repeat,
                    newTextureRepeat: layer.texture.repeat, // This shouldn't change
                    originalTextureOffset: layer.texture.offset,
                    newTextureOffset: layer.texture.offset, // This shouldn't change
                    scaleChange: `From ${currentScaleX}x${currentScaleY} → ${targetScaleX}x${targetScaleY}`
                  })

                  // Debug: Check final texture state after all updates
                  setTimeout(() => {
                    console.log(`[Spline3D] FINAL TEXTURE STATE for layer ${i}:`, {
                      textureRepeat: layer.texture.repeat,
                      textureOffset: layer.texture.offset,
                      textureRotation: layer.texture.rotation,
                      textureScale: layer.texture.scale,
                      imageRepeat: layer.texture.image.repeat,
                      imageOffset: layer.texture.image.offset,
                      imageRotation: layer.texture.image.rotation,
                      imageWidth: layer.texture.image.width,
                      imageHeight: layer.texture.image.height,
                      matrixNeedsUpdate: layer.texture.matrixNeedsUpdate,
                      // Check if there are any UV transform matrices
                      matrix: layer.texture.matrix,
                      uvTransform: layer.texture.uvTransform,
                      // Check material properties that might affect scaling
                      materialNeedsUpdate: material.needsUpdate,
                      materialVersion: material.version
                    })

                    // Also check if the texture has any parent scaling
                    if (layer.texture.image && layer.texture.image.parent) {
                      console.log(`[Spline3D] TEXTURE PARENT INFO for layer ${i}:`, {
                        parentType: layer.texture.image.parent.type,
                        parentScale: layer.texture.image.parent.scale,
                        parentPosition: layer.texture.image.parent.position
                      })
                    }
                  }, 100)

                  // CRITICAL: Mark the texture itself as needing update
                  if (layer.texture.needsUpdate !== undefined) {
                    layer.texture.needsUpdate = true
                    console.log(`[Spline3D] ✓ Marked texture as needsUpdate`)
                  }

                  // Also try to mark the image as needing update if it has that property
                  if (layer.texture.image.needsUpdate !== undefined) {
                    layer.texture.image.needsUpdate = true
                    console.log(`[Spline3D] ✓ Marked texture.image as needsUpdate`)
                  }

                  // Update texture matrix if the properties changed
                  if (layer.texture.updateMatrix) {
                    layer.texture.updateMatrix()
                    console.log(`[Spline3D] ✓ Updated texture matrix`)
                  } else if (layer.texture.matrixNeedsUpdate !== undefined) {
                    layer.texture.matrixNeedsUpdate = true
                    console.log(`[Spline3D] ✓ Marked texture matrix as needsUpdate`)
                  }

                  // Immediately update material and force refresh after texture.image replacement
                  material.needsUpdate = true
                  if (material.version !== undefined) {
                    material.version++
                  }

                  // Force Spline to update
                  if (app.update && typeof app.update === 'function') {
                    app.update()
                  }

                  // Force render
                  if (app.renderer && app.scene && app.camera) {
                    app.renderer.render(app.scene, app.camera)
                  }

                  // Additional force refresh - sometimes needed for texture updates
                  setTimeout(() => {
                    if (app.renderer && app.scene && app.camera) {
                      app.renderer.render(app.scene, app.camera)
                      console.log(`[Spline3D] ✓ Forced additional render after texture update`)
                    }
                  }, 100)

                  console.log(`[Spline3D] ✓ REPLACED texture.image and updated material for layer ${i}`)
                  updatedLayers++

                  // Continue to next layer instead of returning immediately
                } else {
                  // Fallback to other approaches for layers without texture.image
                  layer.image = imageElement
                  if (layer.map !== undefined) layer.map = imageElement
                  if (layer.texture !== undefined) layer.texture = imageElement
                  console.log(`[Spline3D] Used fallback approach for layer ${i}`)

                  // Update material for fallback approach too
                  material.needsUpdate = true
                  if (material.version !== undefined) {
                    material.version++
                  }

                  // Force Spline to update
                  if (app.update && typeof app.update === 'function') {
                    app.update()
                  }

                  // Force render
                  if (app.renderer && app.scene && app.camera) {
                    app.renderer.render(app.scene, app.camera)
                  }

                  console.log(`[Spline3D] ✓ Used fallback approach and updated material for layer ${i}`)
                  updatedLayers++
                }
              } catch (e) {
                console.warn(`[Spline3D] Approach 1a failed for image layer ${i}:`, e)
              }
            }
          }

          // If we updated any layers in the first pass, return success
          if (updatedLayers > 0) {
            console.log(`[Spline3D] ✓ Successfully updated ${updatedLayers} texture layers for ${label}`)
            return true
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
                
                // Try setting image data - prioritize texture.image for existing textures
                if (layer.texture && layer.texture.image !== undefined) {
                  // This is the key! Set texture.image to Uint8Array data (like the existing format)
                  layer.texture.image = {
                    data: imageUint8Array,
                    width: imageElement.width,
                    height: imageElement.height,
                    name: `uploaded-image-${label}`
                  }
                  console.log(`[Spline3D] ✓ Set texture.image data for ${layer.type} layer ${i}`)
                } else {
                  // Fallback to other approaches
                  if (layer.image !== undefined) layer.image = imageElement
                  if (layer.map !== undefined) layer.map = imageElement
                  if (layer.texture !== undefined) layer.texture = imageElement
                }

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
    // Target: "Panel Side A PC Trans A" (the object that displays the image)
    // Full path: Scene > Scene > White > Assembly Small Lamp 2025 v62 > Panel Side A > PC Trans A
    if (image1) {
      const obj1 = findObject(
        side1ObjectId,
        side1ObjectName,
        ["Panel Side A PC Trans A", "PC Trans A", "Side A", "Panel Side A"],
        ["Scene", "Scene", "White", "Assembly Small Lamp 2025 v62", "Panel Side A", "PC Trans A"]
      )
      if (obj1) {
        side1ObjectRef.current = obj1
        const success = await addImageLayerToMaterial(obj1, image1, "Side 1 (Panel Side A PC Trans A)")
        if (success) {
          console.log(`[Spline3D] ✓ Successfully added image layer to Side 1`)
        } else {
          console.warn(`[Spline3D] Failed to add image layer to Side 1`)
        }
      } else {
        console.warn(`[Spline3D] Side 1 object not found - tried path and names`)
      }
    } else {
      side1ObjectRef.current = null
    }

    // Handle Side 2 - Add image layer to material
    // Target: "Panel Side B PC Trans B" (the object that displays the image)
    // Full path: Scene > Scene > White > Assembly Small Lamp 2025 v62 > Panel Side B > PC Trans B
    if (image2) {
      const obj2 = findObject(
        side2ObjectId,
        side2ObjectName,
        ["Panel Side B PC Trans B", "PC Trans B", "Side B", "Panel Side B"],
        ["Scene", "Scene", "White", "Assembly Small Lamp 2025 v62", "Panel Side B", "PC Trans B"]
      )
      if (obj2) {
        side2ObjectRef.current = obj2
        const success = await addImageLayerToMaterial(obj2, image2, "Side 2 (Panel Side B PC Trans B)")
        if (success) {
          console.log(`[Spline3D] ✓ Successfully added image layer to Side 2`)
        } else {
          console.warn(`[Spline3D] Failed to add image layer to Side 2`)
        }
      } else {
        console.warn(`[Spline3D] Side 2 object not found - tried path and names`)
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
            
            // Search entire scene for all objects (for toggling)
            const searchEntireSceneForObjects = (): ObjectInfo[] => {
              const app = splineAppRef.current as any
              if (!app) return []
              
              console.log("[Spline3D] ===== SEARCHING ENTIRE SCENE FOR ALL OBJECTS =====")
              
              const allObjectsInfo: ObjectInfo[] = []
              const scene = app.scene || app._scene
              
              if (!scene) {
                console.warn("[Spline3D] Scene not available")
                return []
              }
              
              const processedObjects = new Set<string>()
              
              // Method 1: Try getAllObjects
              const objectsFromAPI: any[] = []
              if (app.getAllObjects && typeof app.getAllObjects === 'function') {
                try {
                  const objects = app.getAllObjects()
                  if (Array.isArray(objects)) {
                    objectsFromAPI.push(...objects)
                    console.log(`[Spline3D] Found ${objects.length} objects via getAllObjects()`)
                  }
                } catch (e) {
                  console.warn("[Spline3D] getAllObjects() failed:", e)
                }
              }
              
              // Traverse function
              const traverseScene = (obj: any, path: string = '') => {
                if (!obj) return
                
                const objId = obj.uuid || obj.id || `obj-${allObjectsInfo.length}`
                if (processedObjects.has(objId)) {
                  return
                }
                processedObjects.add(objId)
                
                const currentPath = path ? `${path} > ${obj.name || obj.type || 'unnamed'}` : (obj.name || obj.type || 'unnamed')
                
                // Add this object to the list
                allObjectsInfo.push({
                  objectName: obj.name || obj.type || 'unnamed',
                  objectId: objId,
                  objectPath: currentPath,
                  visible: obj.visible !== false,
                  objectRef: obj,
                  meshRef: obj.mesh
                })
                
                // Recursively check children
                if (obj.children && Array.isArray(obj.children)) {
                  obj.children.forEach((child: any) => {
                    traverseScene(child, currentPath)
                  })
                }
                
                if (obj.mesh && obj.mesh.children && Array.isArray(obj.mesh.children)) {
                  obj.mesh.children.forEach((child: any) => {
                    traverseScene(child, currentPath)
                  })
                }
              }
              
              // Traverse scene
              traverseScene(scene, 'Scene')
              
              // Also traverse objects from getAllObjects
              objectsFromAPI.forEach((obj: any) => {
                traverseScene(obj, `Object-${obj.name || obj.type || 'unnamed'}`)
              })
              
              console.log(`[Spline3D] Found ${allObjectsInfo.length} objects in entire scene`)
              console.log("[Spline3D] ===== END OBJECT SEARCH =====")
              
              return allObjectsInfo
            }
            
            // Search entire scene for all objects with images
            const searchEntireSceneForImages = () => {
              const app = splineAppRef.current as any
              if (!app) return []
              
              console.log("[Spline3D] ===== SEARCHING ENTIRE SCENE FOR IMAGES =====")
              
              const allLayers: LayerInfo[] = []
              const scene = app.scene || app._scene
              
              if (!scene) {
                console.warn("[Spline3D] Scene not available")
                return []
              }
              
              // Get all objects from scene
              const allObjects: any[] = []
              const processedObjects = new Set<string>()
              
              // Method 1: Try getAllObjects
              if (app.getAllObjects && typeof app.getAllObjects === 'function') {
                try {
                  const objects = app.getAllObjects()
                  if (Array.isArray(objects)) {
                    allObjects.push(...objects)
                    console.log(`[Spline3D] Found ${objects.length} objects via getAllObjects()`)
                  }
                } catch (e) {
                  console.warn("[Spline3D] getAllObjects() failed:", e)
                }
              }
              
              // Method 2: Traverse scene recursively
              const traverseScene = (obj: any, path: string = '') => {
                if (!obj) return
                
                // Avoid processing same object twice
                const objId = obj.uuid || obj.id || `obj-${allLayers.length}`
                if (processedObjects.has(objId)) {
                  return
                }
                processedObjects.add(objId)
                
                const currentPath = path ? `${path} > ${obj.name || obj.type || 'unnamed'}` : (obj.name || obj.type || 'unnamed')
                
                // Check if this object has a material
                let material = obj.material
                if (!material && obj.mesh) {
                  material = obj.mesh.material
                }
                
                if (material) {
                  // Check for direct material images
                  const hasDirectImage = material.map || material.texture || material.image
                  
                  if (hasDirectImage) {
                    console.log(`[Spline3D] Found direct image on: ${currentPath}`, {
                      hasMap: !!material.map,
                      hasTexture: !!material.texture,
                      hasImage: !!material.image
                    })
                    
                    allLayers.push({
                      objectName: currentPath,
                      objectId: obj.uuid || obj.id || `scene-${allLayers.length}`,
                      layerIndex: -10, // Special index for scene-wide direct material
                      layerType: 'scene-direct-material',
                      layerName: 'Direct Material Image',
                      visible: true,
                      layerRef: { 
                        material: material,
                        property: material.map ? 'map' : material.texture ? 'texture' : 'image'
                      },
                      materialRef: material
                    })
                  }
                  
                  // Check layers
                  if (material.layers && Array.isArray(material.layers)) {
                    material.layers.forEach((layer: any, index: number) => {
                      const hasImage = layer.image !== undefined && layer.image !== null
                      const hasMap = layer.map !== undefined && layer.map !== null
                      const hasTexture = layer.texture !== undefined && layer.texture !== null
                      
                      if (hasImage || hasMap || hasTexture) {
                        console.log(`[Spline3D] Found image in layer on: ${currentPath}`, {
                          layerIndex: index,
                          layerType: layer.type,
                          hasImage,
                          hasMap,
                          hasTexture,
                          imageSrc: layer.image?.src || layer.image?.currentSrc || 'N/A'
                        })
                        
                        allLayers.push({
                          objectName: currentPath,
                          objectId: obj.uuid || obj.id || `scene-${allLayers.length}`,
                          layerIndex: index,
                          layerType: layer.type,
                          layerName: layer.name || layer.id || `Layer ${index}`,
                          visible: layer.visible !== false,
                          layerRef: layer,
                          materialRef: material
                        })
                        
                        // Add clear image option
                        allLayers.push({
                          objectName: `${currentPath} (Clear Image)`,
                          objectId: `${obj.uuid || obj.id}-clear-${index}`,
                          layerIndex: index,
                          layerType: `clear-${layer.type}`,
                          layerName: `Clear ${layer.type} Image`,
                          visible: true,
                          layerRef: layer,
                          materialRef: material
                        })
                      }
                    })
                  }
                }
                
                // Recursively check children
                if (obj.children && Array.isArray(obj.children)) {
                  obj.children.forEach((child: any) => {
                    traverseScene(child, currentPath)
                  })
                }
                
                // Also check mesh children if different
                if (obj.mesh && obj.mesh.children && Array.isArray(obj.mesh.children)) {
                  obj.mesh.children.forEach((child: any) => {
                    traverseScene(child, currentPath)
                  })
                }
              }
              
              // Traverse scene
              traverseScene(scene, 'Scene')
              
              // Also traverse objects from getAllObjects()
              allObjects.forEach((obj: any) => {
                traverseScene(obj, `Object-${obj.name || obj.type || 'unnamed'}`)
              })
              
              console.log(`[Spline3D] Found ${allLayers.length} image sources in entire scene`)
              console.log(`[Spline3D] Processed ${processedObjects.size} unique objects`)
              console.log("[Spline3D] ===== END SCENE SEARCH =====")
              
              return allLayers
            }
            
            // Inspect PC material layers (returns layers, doesn't set state)
            const inspectPCMaterials = (): LayerInfo[] => {
              const app = splineAppRef.current as any
              if (!app) return []
              
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
                
                // Check for direct image/texture on material (not in layers)
                console.log(`[Spline3D] Checking direct material properties for images:`, {
                  hasMap: material.map !== undefined,
                  hasTexture: material.texture !== undefined,
                  hasImage: material.image !== undefined,
                  mapType: material.map?.constructor?.name,
                  textureType: material.texture?.constructor?.name,
                  imageType: material.image?.constructor?.name,
                  allMaterialProperties: Object.keys(material).filter(key => 
                    key.includes('map') || key.includes('texture') || key.includes('image')
                  )
                })
                
                // Check mesh material if different
                if (obj.mesh && obj.mesh.material) {
                  const meshMaterial = obj.mesh.material
                  console.log(`[Spline3D] Checking mesh material for images:`, {
                    hasMap: meshMaterial.map !== undefined,
                    hasTexture: meshMaterial.texture !== undefined,
                    hasImage: meshMaterial.image !== undefined,
                    mapType: meshMaterial.map?.constructor?.name,
                    allMeshMaterialProperties: Object.keys(meshMaterial).filter(key => 
                      key.includes('map') || key.includes('texture') || key.includes('image')
                    )
                  })
                  
                  // If mesh material has image, add it as a toggleable item
                  if (meshMaterial.map || meshMaterial.texture || meshMaterial.image) {
                    allLayers.push({
                      objectName: `${name} (Mesh Material)`,
                      objectId: id,
                      layerIndex: -1, // Special index for direct material
                      layerType: 'direct-material',
                      layerName: 'Direct Material Map/Texture',
                      visible: true,
                      layerRef: { 
                        material: meshMaterial,
                        property: meshMaterial.map ? 'map' : meshMaterial.texture ? 'texture' : 'image'
                      },
                      materialRef: meshMaterial
                    })
                  }
                }
                
                // Check for direct material image/texture
                if (material.map || material.texture || material.image) {
                  allLayers.push({
                    objectName: `${name} (Direct Material)`,
                    objectId: id,
                    layerIndex: -2, // Special index for direct material
                    layerType: 'direct-material',
                    layerName: 'Direct Material Map/Texture',
                    visible: true,
                    layerRef: { 
                      material: material,
                      property: material.map ? 'map' : material.texture ? 'texture' : 'image'
                    },
                    materialRef: material
                  })
                }
                
                // Check child objects for materials with images
                const checkChildren = (parentObj: any, parentName: string) => {
                  if (parentObj.children && Array.isArray(parentObj.children)) {
                    parentObj.children.forEach((child: any, childIdx: number) => {
                      let childMaterial = child.material
                      if (!childMaterial && child.mesh) {
                        childMaterial = child.mesh.material
                      }
                      
                      if (childMaterial) {
                        const hasImage = childMaterial.map || childMaterial.texture || childMaterial.image
                        if (hasImage || (childMaterial.layers && childMaterial.layers.length > 0)) {
                          console.log(`[Spline3D] Found child object ${childIdx} of ${parentName} with material:`, {
                            childName: child.name || `Child ${childIdx}`,
                            hasMap: !!childMaterial.map,
                            hasTexture: !!childMaterial.texture,
                            hasImage: !!childMaterial.image,
                            layersCount: childMaterial.layers?.length
                          })
                          
                          if (hasImage) {
                            allLayers.push({
                              objectName: `${parentName} > ${child.name || `Child ${childIdx}`}`,
                              objectId: child.uuid || `${id}-child-${childIdx}`,
                              layerIndex: -3, // Special index for child material
                              layerType: 'child-material',
                              layerName: 'Child Material Map/Texture',
                              visible: true,
                              layerRef: { 
                                material: childMaterial,
                                property: childMaterial.map ? 'map' : childMaterial.texture ? 'texture' : 'image'
                              },
                              materialRef: childMaterial
                            })
                          }
                        }
                      }
                      
                      // Recursively check grandchildren
                      if (child.children && child.children.length > 0) {
                        checkChildren(child, `${parentName} > ${child.name || `Child ${childIdx}`}`)
                      }
                    })
                  }
                }
                
                // Check children of the object
                if (obj.children || (obj.mesh && obj.mesh.children)) {
                  checkChildren(obj.mesh || obj, name)
                }
                
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
                    
                    // Check if texture/image layers have images set (even if hidden)
                    if (layer.type === 'texture' || layer.type === 'image') {
                      const hasImage = layer.image !== undefined && layer.image !== null
                      const hasMap = layer.map !== undefined && layer.map !== null
                      const hasTexture = layer.texture !== undefined && layer.texture !== null
                      
                      if (hasImage || hasMap || hasTexture) {
                        console.log(`[Spline3D]   → ${layer.type.toUpperCase()} LAYER HAS IMAGE:`, {
                          hasImage,
                          hasMap,
                          hasTexture,
                          image: layer.image,
                          map: layer.map,
                          texture: layer.texture,
                          imageSrc: layer.image?.src || layer.image?.currentSrc || 'N/A',
                          imageWidth: layer.image?.width,
                          imageHeight: layer.image?.height
                        })
                        
                        // Add a separate toggle for clearing the image itself
                        allLayers.push({
                          objectName: `${name} (Clear Image)`,
                          objectId: `${id}-clear-${index}`,
                          layerIndex: index,
                          layerType: `clear-${layer.type}`,
                          layerName: `Clear ${layer.type} Image`,
                          visible: hasImage || hasMap || hasTexture,
                          layerRef: layer,
                          materialRef: material
                        })
                      }
                    }
                    
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
              
              console.log("[Spline3D] ===== END PC MATERIAL INSPECTION =====")
              console.log(`[Spline3D] Found ${allLayers.length} layers in PC materials`)
              
              return allLayers
            }
            
            // Helper function to inspect material layers of a specific object
            const inspectObjectMaterial = (obj: any, objectName: string): LayerInfo[] => {
              console.log(`[Spline3D] Inspecting material for ${objectName}:`, {
                name: obj.name,
                type: obj.type,
                uuid: obj.uuid,
                id: obj.id
              })

              // Get material from object
              let material = obj.material
              if (!material && obj.mesh) {
                material = obj.mesh.material
              }

              if (!material) {
                console.warn(`[Spline3D] No material found on ${objectName}`)
                return []
              }

              console.log(`[Spline3D] Material found for ${objectName}:`, {
                type: material.type,
                hasLayers: !!material.layers,
                layersCount: material.layers?.length
              })

              const layers: LayerInfo[] = []

              // Inspect all layers
              if (material.layers && Array.isArray(material.layers)) {
                material.layers.forEach((layer: any, index: number) => {
                  // Check for images in multiple places
                  const hasImage = layer.image !== undefined && layer.image !== null
                  const hasMap = layer.map !== undefined && layer.map !== null
                  const hasTexture = layer.texture !== undefined && layer.texture !== null
                  const hasTextureImage = layer.texture?.image !== undefined && layer.texture?.image !== null

                  const layerInfo = {
                    type: layer.type,
                    visible: layer.visible,
                    alpha: layer.alpha,
                    opacity: layer.opacity,
                    mode: layer.mode,
                    isMask: layer.isMask,
                    hasImage,
                    hasMap,
                    hasTexture,
                    hasTextureImage,
                    imageType: layer.image?.constructor?.name,
                    textureImageType: layer.texture?.image?.constructor?.name,
                    imageSrc: layer.image?.src || layer.image?.currentSrc || 'N/A',
                    textureImageName: layer.texture?.image?.name,
                    textureImageData: layer.texture?.image?.data ? `Uint8Array(${layer.texture.image.data.length})` : 'N/A',
                    name: layer.name || layer.id || 'unnamed',
                    allProperties: Object.keys(layer)
                  }

                  console.log(`[Spline3D] ${objectName} Layer ${index}:`, layerInfo)

                  layers.push({
                    objectName: objectName,
                    objectId: obj.uuid || obj.id || `obj-${Date.now()}`,
                    layerIndex: index,
                    layerType: layer.type,
                    layerName: layer.name || layer.id || `Layer ${index}`,
                    visible: layer.visible !== false,
                    layerRef: layer,
                    materialRef: material
                  })

                  // If this layer has image data, add a "Clear Image" option
                  if (layer.type === 'texture' && (hasImage || hasMap || hasTexture || hasTextureImage)) {
                    console.log(`[Spline3D]   → FOUND IMAGE DATA IN ${objectName} LAYER ${index}:`, {
                      hasImage,
                      hasMap,
                      hasTexture,
                      hasTextureImage,
                      textureImageName: layer.texture?.image?.name,
                      textureImageDataLength: layer.texture?.image?.data?.length
                    })

                    // Add a "Clear Image" option for layers that have image data
                    layers.push({
                      objectName: `${objectName} (Clear Image)`,
                      objectId: `${obj.uuid || obj.id}-clear-${index}`,
                      layerIndex: index,
                      layerType: `clear-${layer.type}`,
                      layerName: `Clear ${layer.type} Image`,
                      visible: hasImage || hasMap || hasTexture || hasTextureImage,
                      layerRef: layer,
                      materialRef: material,
                      originalValue: layer.texture?.image, // Store original for restoration
                      property: 'texture.image', // Track what we're clearing
                      hasTextureImage: hasTextureImage // Mark that this has texture.image data
                    })
                  }
                })
              }

              console.log(`[Spline3D] Found ${layers.length} layers on ${objectName}`)
              return layers
            }

            // Find and inspect PC Trans B object specifically
            const inspectPcTransB = (): LayerInfo[] => {
              const app = splineAppRef.current as any
              if (!app) return []

              console.log("[Spline3D] ===== INSPECTING PC TRANS B OBJECT =====")

              // Try to find by ID first (from scene search results)
              const pcTransBId = "2e33392b-21d8-441d-87b0-11527f3a8b70"
              if (app.findObjectById) {
                const obj = app.findObjectById(pcTransBId)
                if (obj) {
                  console.log(`[Spline3D] Found PC Trans B object by ID: ${pcTransBId}`)
                  return inspectObjectMaterial(obj, "PC Trans B")
                }
              }

              // Fallback: try to find by name
              if (app.findObjectByName) {
                const obj = app.findObjectByName("PC Trans B")
                if (obj) {
                  console.log(`[Spline3D] Found PC Trans B object by name`)
                  return inspectObjectMaterial(obj, "PC Trans B")
                }
              }

              console.warn(`[Spline3D] PC Trans B object not found by ID or name, trying path traversal`)

              const scene = app.scene || app._scene
              if (!scene) {
                console.warn("[Spline3D] Scene not available")
                return []
              }

              // Path: Scene > Scene > White > Assembly Small Lamp 2025 v62 > Panel Side B > PC Trans B
              const path = ["Scene", "White", "Assembly Small Lamp 2025 v62", "Panel Side B", "PC Trans B"]

              let currentObj: any = scene
              for (const pathSegment of path) {
                if (!currentObj) {
                  console.warn(`[Spline3D] Could not find path segment: ${pathSegment}`)
                  return []
                }
                
                const children = currentObj.children || []
                const found = children.find((child: any) => 
                  child.name === pathSegment || 
                  (typeof child.name === 'string' && child.name.includes(pathSegment))
                )
                
                if (found) {
                  currentObj = found
                } else if (currentObj.mesh && currentObj.mesh.children) {
                  const meshFound = currentObj.mesh.children.find((child: any) => 
                    child.name === pathSegment || 
                    (typeof child.name === 'string' && child.name.includes(pathSegment))
                  )
                  if (meshFound) {
                    currentObj = meshFound
                  } else {
                    console.warn(`[Spline3D] Could not find path segment: ${pathSegment}`)
                    return []
                  }
                } else {
                  console.warn(`[Spline3D] Could not find path segment: ${pathSegment}`)
                  return []
                }
              }
              
              if (!currentObj) {
                console.warn(`[Spline3D] PC Trans B object not found`)
                return []
              }
              
              console.log(`[Spline3D] Found PC Trans B object:`, {
                name: currentObj.name,
                type: currentObj.type,
                uuid: currentObj.uuid,
                id: currentObj.id
              })
              
              // Get material
              let material = currentObj.material
              if (!material && currentObj.mesh) {
                material = currentObj.mesh.material
              }
              
              if (!material) {
                console.warn(`[Spline3D] No material found on PC Trans B`)
                return []
              }
              
              console.log(`[Spline3D] PC Trans B material:`, {
                type: material.type,
                hasLayers: !!material.layers,
                layersCount: material.layers?.length
              })
              
              const layers: LayerInfo[] = []
              
              // Inspect all layers
              if (material.layers && Array.isArray(material.layers)) {
                material.layers.forEach((layer: any, index: number) => {
                  // Check for images in multiple places - including texture.image!
                  const hasImage = layer.image !== undefined && layer.image !== null
                  const hasMap = layer.map !== undefined && layer.map !== null
                  const hasTexture = layer.texture !== undefined && layer.texture !== null
                  const hasTextureImage = layer.texture?.image !== undefined && layer.texture?.image !== null

                  const layerInfo = {
                    type: layer.type,
                    visible: layer.visible,
                    alpha: layer.alpha,
                    opacity: layer.opacity,
                    mode: layer.mode,
                    isMask: layer.isMask,
                    hasImage,
                    hasMap,
                    hasTexture,
                    hasTextureImage,
                    imageType: layer.image?.constructor?.name,
                    textureImageType: layer.texture?.image?.constructor?.name,
                    imageSrc: layer.image?.src || layer.image?.currentSrc || 'N/A',
                    textureImageName: layer.texture?.image?.name,
                    textureImageData: layer.texture?.image?.data ? `Uint8Array(${layer.texture.image.data.length})` : 'N/A',
                    name: layer.name || layer.id || 'unnamed',
                    allProperties: Object.keys(layer)
                  }

                  console.log(`[Spline3D] PC Trans B Layer ${index}:`, layerInfo)

                  layers.push({
                    objectName: "PC Trans B",
                    objectId: currentObj.uuid || currentObj.id || 'pc-trans-b',
                    layerIndex: index,
                    layerType: layer.type,
                    layerName: layer.name || layer.id || `Layer ${index}`,
                    visible: layer.visible !== false,
                    layerRef: layer,
                    materialRef: material
                  })

                  // If this layer has image data (including in texture.image), add a "Clear Image" option
                  if (layer.type === 'image' || layer.type === 'texture') {
                    if (hasImage || hasMap || hasTexture || hasTextureImage) {
                      console.log(`[Spline3D]   → FOUND IMAGE DATA IN LAYER ${index}:`, {
                        hasImage,
                        hasMap,
                        hasTexture,
                        hasTextureImage,
                        image: layer.image,
                        map: layer.map,
                        texture: layer.texture,
                        textureImage: layer.texture?.image,
                        imageSrc: layer.image?.src || layer.image?.currentSrc || 'N/A',
                        textureImageName: layer.texture?.image?.name,
                        textureImageWidth: layer.texture?.image?.width,
                        textureImageHeight: layer.texture?.image?.height,
                        textureImageDataLength: layer.texture?.image?.data?.length
                      })

                      // Add a "Clear Image" option for layers that have image data
                      layers.push({
                        objectName: `PC Trans B (Clear Image)`,
                        objectId: `${currentObj.uuid || currentObj.id}-clear-${index}`,
                        layerIndex: index,
                        layerType: `clear-${layer.type}`,
                        layerName: `Clear ${layer.type} Image`,
                        visible: hasImage || hasMap || hasTexture || hasTextureImage,
                        layerRef: layer,
                        materialRef: material,
                        originalValue: layer.texture?.image, // Store original for restoration
                        property: 'texture.image', // Track what we're clearing
                        hasTextureImage: hasTextureImage // Mark that this has texture.image data
                      })
                    }
                  }
                })
              }
              
              console.log(`[Spline3D] Found ${layers.length} layers on PC Trans B`)
              console.log("[Spline3D] ===== END PC TRANS B INSPECTION =====")
              
              return layers
            }
            
            // Inspect materials after a short delay to ensure scene is fully loaded
            setTimeout(() => {
              // Inspect PC Trans B object specifically
              const pcTransBLayers = inspectPcTransB()
              setPcTransBLayers(pcTransBLayers)
              
              // Search entire scene for ALL objects (for toggling)
              const allObjects = searchEntireSceneForObjects()
              setDiscoveredObjects(allObjects)
              
              // Search entire scene for ALL images (primary search)
              const sceneLayers = searchEntireSceneForImages()
              
              // Also inspect PC materials for additional context
              const pcLayers = inspectPCMaterials()
              
              // Combine results - scene-wide search is primary
              const layerMap = new Map<string, LayerInfo>()
              
              // Add scene layers first (these are the most comprehensive)
              sceneLayers.forEach(layer => {
                const key = `${layer.objectId}-${layer.layerIndex}-${layer.layerType}`
                layerMap.set(key, layer)
              })
              
              // Add PC layers (won't overwrite scene layers due to different keys)
              pcLayers.forEach(layer => {
                const key = `${layer.objectId}-${layer.layerIndex}-${layer.layerType}`
                if (!layerMap.has(key)) {
                  layerMap.set(key, layer)
                }
              })
              
              const allLayers = Array.from(layerMap.values())
              setDiscoveredLayers(allLayers)
              
              console.log(`[Spline3D] Total objects found: ${allObjects.length}`)
              console.log(`[Spline3D] Total layers found: ${allLayers.length} (${sceneLayers.length} from scene search, ${pcLayers.length} from PC inspection)`)
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

          {/* Debug Texture Sizes Button */}
          <div className="mb-4">
            <Button
              onClick={debugTextureSizes}
              variant="outline"
              size="sm"
              className="w-full"
            >
              🔍 Debug Current Texture Sizes
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Click to inspect actual rendered texture sizes and properties
            </p>
          </div>

          {/* PC Trans B Material Layer Controls - ALWAYS VISIBLE AND PROMINENT */}
          <div className="border-4 border-primary rounded-xl p-6 bg-gradient-to-r from-primary/10 to-primary/5 shadow-lg">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                🎯 TARGET OBJECT: PC Trans B Material Layers
              </h3>
              <div className="bg-primary/20 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-foreground">
                  Path: <code className="bg-background px-2 py-1 rounded text-xs">Scene → Scene → White → Assembly Small Lamp 2025 v62 → Panel Side B → PC Trans B</code>
                </p>
                <p className="text-sm text-primary font-semibold mt-1">
                  This is the object that displays your uploaded images!
                </p>
              </div>
            </div>

            {pcTransBLayers.length > 0 ? (
              <>
                <div className="space-y-3">
                  {pcTransBLayers.map((layerInfo) => (
                    <div key={`${layerInfo.objectId}-${layerInfo.layerIndex}`} className="flex items-center gap-3">
                      <Button
                        onClick={() => toggleLayerVisibility(layerInfo)}
                        variant={layerInfo.visible ? "default" : "outline"}
                        size="lg"
                        disabled={isLoading || !!error}
                        className="flex items-center gap-3 flex-1 justify-start h-14 text-left"
                      >
                        {layerInfo.visible ? (
                          <Eye className="h-6 w-6" />
                        ) : (
                          <EyeOff className="h-6 w-6" />
                        )}
                        <div className="flex-1">
                          <div className="text-base font-medium">
                            Layer {layerInfo.layerIndex}: {layerInfo.layerType}
                          </div>
                          {layerInfo.layerName && layerInfo.layerName !== `Layer ${layerInfo.layerIndex}` && (
                            <div className="text-sm text-muted-foreground">{layerInfo.layerName}</div>
                          )}
                        </div>
                        {layerInfo.layerType === 'image' && (
                          <span className="ml-auto text-sm bg-blue-500 text-white px-3 py-1 rounded-full font-semibold">IMAGE</span>
                        )}
                        {layerInfo.layerType === 'texture' && (
                          <span className="ml-auto text-sm bg-green-500 text-white px-3 py-1 rounded-full font-semibold">TEXTURE</span>
                        )}
                        {layerInfo.layerType.startsWith('clear-') && (
                          <span className="ml-auto text-sm bg-red-500 text-white px-3 py-1 rounded-full font-semibold">
                            CLEAR IMAGE {layerInfo.hasTextureImage ? '(TEXTURE.IMAGE)' : ''}
                          </span>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-muted rounded-lg border">
                  <p className="text-sm font-semibold text-center">
                    📊 Found {pcTransBLayers.length} layers on PC Trans B object
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Toggle these layers on/off to test material control and discover how images are displayed
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <div className="text-2xl mb-2">🔍</div>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Loading PC Trans B object..." : "No layers found on PC Trans B object. Check console for details."}
                </p>
              </div>
            )}
          </div>

          {/* Other Controls (Hidden by default) */}
          {showOtherControls && (
            <>
              {/* Layer Toggle Controls */}
              {discoveredLayers.length > 0 && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h3 className="text-sm font-semibold mb-3">All Layer Controls</h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
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
                            {layerInfo.layerIndex < 0 
                              ? `${layerInfo.objectName} - ${layerInfo.layerName}`
                              : `${layerInfo.objectName} - Layer ${layerInfo.layerIndex} (${layerInfo.layerType})`
                            }
                          </span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Object Toggle Controls */}
              {discoveredObjects.length > 0 && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h3 className="text-sm font-semibold mb-3">All Object Controls</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {discoveredObjects.map((objectInfo) => (
                      <div key={objectInfo.objectId} className="flex items-center gap-2">
                        <Button
                          onClick={() => toggleObjectVisibility(objectInfo)}
                          variant={objectInfo.visible ? "default" : "outline"}
                          size="sm"
                          disabled={isLoading || !!error}
                          className="flex items-center gap-2 flex-1 justify-start"
                        >
                          {objectInfo.visible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                          <span className="text-xs text-left">
                            {objectInfo.objectPath}
                          </span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Toggle to show/hide other controls */}
          <Button
            onClick={() => setShowOtherControls(!showOtherControls)}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            {showOtherControls ? "Hide" : "Show"} Other Controls
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
