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

  // TEST FUNCTION: Try to modify color/visible properties to verify we can affect the scene
  const testModifyObjectProperties = useCallback((obj: any, label: string) => {
    if (!obj) return false
    
    try {
      const material = (obj as any).material || (obj as any).children?.[0]?.material
      if (!material) {
        console.log(`[Spline3D TEST] ${label}: No material found`)
        return false
      }

      console.log(`[Spline3D TEST] ${label}: Attempting to modify material properties...`)
      
      // Try modifying color layer
      if (material.layers) {
        for (const layer of material.layers) {
          if (layer.type === 'color' && layer.color !== undefined) {
            // Try to change color to bright red to test visibility
            const originalColor = layer.color
            try {
              // Try different color formats
              if (typeof layer.color.set === "function") {
                layer.color.set(1, 0, 0) // Red
                console.log(`[Spline3D TEST] ✓ Changed ${label} color via set() to red`)
              } else if (layer.color.r !== undefined) {
                layer.color.r = 1
                layer.color.g = 0
                layer.color.b = 0
                console.log(`[Spline3D TEST] ✓ Changed ${label} color.rgb to red`)
              } else if (Array.isArray(layer.color)) {
                layer.color[0] = 1
                layer.color[1] = 0
                layer.color[2] = 0
                console.log(`[Spline3D TEST] ✓ Changed ${label} color array to red`)
              } else {
                layer.color = { r: 1, g: 0, b: 0 }
                console.log(`[Spline3D TEST] ✓ Set ${label} color object to red`)
              }
              
              if (material.needsUpdate !== undefined) material.needsUpdate = true
              if (material.update && typeof material.update === "function") material.update()
              
              // Revert after 3 seconds for testing
              setTimeout(() => {
                try {
                  if (typeof layer.color.set === "function") {
                    layer.color.set(originalColor.r || originalColor[0] || 1, originalColor.g || originalColor[1] || 1, originalColor.b || originalColor[2] || 1)
                  } else if (layer.color.r !== undefined) {
                    layer.color.r = originalColor.r || 1
                    layer.color.g = originalColor.g || 1
                    layer.color.b = originalColor.b || 1
                  }
                  if (material.needsUpdate !== undefined) material.needsUpdate = true
                  if (material.update && typeof material.update === "function") material.update()
                  console.log(`[Spline3D TEST] Reverted ${label} color`)
                } catch (err) {
                  console.warn(`[Spline3D TEST] Could not revert color:`, err)
                }
              }, 3000)
              
              return true
            } catch (err) {
              console.warn(`[Spline3D TEST] ✗ Failed to change color:`, err)
            }
          }
          
          // Try modifying opacity
          if (layer.opacity !== undefined) {
            try {
              const originalOpacity = layer.opacity
              layer.opacity = 0.5 // Make it semi-transparent
              console.log(`[Spline3D TEST] ✓ Changed ${label} opacity to 0.5`)
              if (material.needsUpdate !== undefined) material.needsUpdate = true
              if (material.update && typeof material.update === "function") material.update()
              
              setTimeout(() => {
                try {
                  layer.opacity = originalOpacity
                  if (material.needsUpdate !== undefined) material.needsUpdate = true
                  if (material.update && typeof material.update === "function") material.update()
                  console.log(`[Spline3D TEST] Reverted ${label} opacity`)
                } catch (err) {
                  console.warn(`[Spline3D TEST] Could not revert opacity:`, err)
                }
              }, 3000)
              
              return true
            } catch (err) {
              console.warn(`[Spline3D TEST] ✗ Failed to change opacity:`, err)
            }
          }
        }
      }
      
      // Try modifying material color directly
      if (material.color !== undefined) {
        try {
          const originalColor = material.color
          if (typeof material.color.set === "function") {
            material.color.set(1, 0, 0) // Red
            console.log(`[Spline3D TEST] ✓ Changed ${label} material.color via set() to red`)
          } else if (material.color.r !== undefined) {
            material.color.r = 1
            material.color.g = 0
            material.color.b = 0
            console.log(`[Spline3D TEST] ✓ Changed ${label} material.color.rgb to red`)
          }
          material.needsUpdate = true
          if (material.update && typeof material.update === "function") material.update()
          
          setTimeout(() => {
            try {
              if (typeof material.color.set === "function") {
                material.color.set(originalColor.r || 1, originalColor.g || 1, originalColor.b || 1)
              } else if (material.color.r !== undefined) {
                material.color.r = originalColor.r || 1
                material.color.g = originalColor.g || 1
                material.color.b = originalColor.b || 1
              }
              material.needsUpdate = true
              if (material.update && typeof material.update === "function") material.update()
              console.log(`[Spline3D TEST] Reverted ${label} material.color`)
            } catch (err) {
              console.warn(`[Spline3D TEST] Could not revert material.color:`, err)
            }
          }, 3000)
          
          return true
        } catch (err) {
          console.warn(`[Spline3D TEST] ✗ Failed to change material.color:`, err)
        }
      }
      
      // Try modifying object position/scale as a last resort test
      if ((obj as any).position !== undefined) {
        try {
          const originalY = (obj as any).position.y
          (obj as any).position.y += 0.1 // Move up slightly
          console.log(`[Spline3D TEST] ✓ Moved ${label} position.y up by 0.1`)
          
          setTimeout(() => {
            try {
              (obj as any).position.y = originalY
              console.log(`[Spline3D TEST] Reverted ${label} position`)
            } catch (err) {
              console.warn(`[Spline3D TEST] Could not revert position:`, err)
            }
          }, 3000)
          
          return true
        } catch (err) {
          console.warn(`[Spline3D TEST] ✗ Failed to change position:`, err)
        }
      }
      
      console.log(`[Spline3D TEST] ${label}: No modifiable properties found`)
      return false
    } catch (err) {
      console.error(`[Spline3D TEST] Error testing ${label}:`, err)
      return false
    }
  }, [])

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

    // Helper function to create a THREE.js texture (if available)
    const createTHREETexture = async (imageUrl: string): Promise<any> => {
      try {
        // Check if THREE is available through Spline
        const THREE = (window as any).THREE || (splineAppRef.current as any)?.THREE
        if (THREE && THREE.TextureLoader) {
          const loader = new THREE.TextureLoader()
          const texture = await new Promise((resolve, reject) => {
            loader.load(
              imageUrl,
              (texture: any) => {
                texture.needsUpdate = true
                resolve(texture)
              },
              undefined,
              reject
            )
          })
          return texture
        }
      } catch (err) {
        console.warn("[Spline3D] Could not create THREE.js texture:", err)
      }
      return null
    }

    // Helper function to try updating texture on any object
    const tryUpdateTextureOnObject = async (obj: any, imageUrl: string, label: string) => {
      if (!obj) return false
      
      console.log(`[Spline3D] Trying to update texture on ${label}:`, {
        id: (obj as any).id || (obj as any).uuid,
        name: (obj as any).name,
        type: (obj as any).type,
        hasMaterial: !!(obj as any).material,
        children: (obj as any).children?.length || 0
      })
      
      // TEST: Try to modify visible properties first to verify we can affect this object
      const testResult = testModifyObjectProperties(obj, `${label} (TEST)`)
      if (testResult) {
        console.log(`[Spline3D] ✓ TEST SUCCESS: We can modify ${label} properties!`)
      } else {
        console.warn(`[Spline3D] ✗ TEST FAILED: Cannot modify ${label} properties`)
      }

      // Try to get material from object or children
      let material = (obj as any).material
      
      // If no material on object, try children
      if (!material && (obj as any).children && (obj as any).children.length > 0) {
        for (const child of (obj as any).children) {
          if (child.material) {
            material = child.material
            console.log(`[Spline3D] Found material on child of ${label}`)
            break
          }
        }
      }

      if (!material || !material.layers) {
        console.warn(`[Spline3D] ${label} has no material or layers`)
        // Try children recursively
        if ((obj as any).children && (obj as any).children.length > 0) {
          for (const child of (obj as any).children) {
            const childResult = await tryUpdateTextureOnObject(child, imageUrl, `${label} -> child`)
            if (childResult) return true
          }
        }
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

      // Try to create a THREE.js texture
      let threeTexture: any = null
      try {
        threeTexture = await createTHREETexture(imageUrl)
        if (threeTexture) {
          console.log(`[Spline3D] Created THREE.js texture for ${label}`)
        }
      } catch (err) {
        console.warn(`[Spline3D] Could not create THREE texture for ${label}:`, err)
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
              // Try both direct assignment and using a setter if it exists
              if (typeof layer.setImage === "function") {
                layer.setImage(imageElement)
                console.log(`[Spline3D] ✓ Set ${label} via layer.setImage(imageElement)`, { layerType })
              } else {
                layer.image = imageElement
                console.log(`[Spline3D] ✓ Set ${label} layer.image = imageElement`, { layerType })
              }
              if (material.needsUpdate !== undefined) material.needsUpdate = true
              if (material.update && typeof material.update === "function") material.update()
              // Force render update
              if (splineAppRef.current && typeof (splineAppRef.current as any).update === "function") {
                (splineAppRef.current as any).update()
              }
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
              // Try replacing the entire texture object with a new THREE.js texture
              if (threeTexture && layer.texture) {
                try {
                  // Try to replace the texture object
                  layer.texture = threeTexture
                  console.log(`[Spline3D] ✓ Replaced ${label} texture with THREE.js texture`, { layerType })
                  if (material.needsUpdate !== undefined) material.needsUpdate = true
                  if (material.update && typeof material.update === "function") material.update()
                  if (layerType === 'texture' || layerType === 'image') {
                    return true
                  }
                } catch (err) {
                  console.warn(`[Spline3D] ✗ Replacing texture object failed for ${label} (${layerType}):`, err)
                }
              }
            } catch (err) {
              console.warn(`[Spline3D] ✗ Updating texture failed for ${label} (${layerType}):`, err)
            }
          }

          // Method 4.5: Try replacing the entire layer.texture with THREE.js texture
          if (threeTexture && layer.texture === undefined) {
            try {
              layer.texture = threeTexture
              console.log(`[Spline3D] ✓ Set ${label} layer.texture = THREE.js texture`, { layerType })
              if (material.needsUpdate !== undefined) material.needsUpdate = true
              if (material.update && typeof material.update === "function") material.update()
              if (layerType === 'texture' || layerType === 'image') {
                return true
              }
            } catch (err) {
              console.warn(`[Spline3D] ✗ Setting THREE texture on layer failed for ${label} (${layerType}):`, err)
            }
          }

          // Method 4.6: Try accessing material.map directly (THREE.js standard)
          if (threeTexture && material.map !== undefined) {
            try {
              material.map = threeTexture
              material.needsUpdate = true
              if (material.update && typeof material.update === "function") material.update()
              console.log(`[Spline3D] ✓ Set ${label} material.map = THREE.js texture`, { layerType })
              if (layerType === 'texture' || layerType === 'image') {
                return true
              }
            } catch (err) {
              console.warn(`[Spline3D] ✗ Setting material.map failed for ${label} (${layerType}):`, err)
            }
          }

          // Method 5: Try creating a new texture/canvas and assigning it
          if (imageElement) {
            try {
              // Try creating a canvas and using it as texture
              const canvas = document.createElement('canvas')
              canvas.width = imageElement.width
              canvas.height = imageElement.height
              const ctx = canvas.getContext('2d')
              if (ctx) {
                ctx.drawImage(imageElement, 0, 0)
                // Try assigning canvas directly
                if (layer.canvas !== undefined) {
                  layer.canvas = canvas
                  console.log(`[Spline3D] ✓ Set ${label} layer.canvas`, { layerType })
                  if (material.needsUpdate !== undefined) material.needsUpdate = true
                  if (material.update && typeof material.update === "function") material.update()
                  if (layerType === 'texture' || layerType === 'image') {
                    return true
                  }
                }
                // Try using canvas.toDataURL
                const canvasDataUrl = canvas.toDataURL('image/png')
                if (layer.image !== undefined) {
                  layer.image = canvasDataUrl
                  console.log(`[Spline3D] ✓ Set ${label} layer.image = canvasDataUrl`, { layerType })
                  if (material.needsUpdate !== undefined) material.needsUpdate = true
                  if (material.update && typeof material.update === "function") material.update()
                  if (layerType === 'texture' || layerType === 'image') {
                    return true
                  }
                }
              }
            } catch (err) {
              console.warn(`[Spline3D] ✗ Canvas method failed for ${label} (${layerType}):`, err)
            }
          }

          // Method 6: Try other properties (url, source, src, map)
          const propsToTry = ['url', 'source', 'src', 'map', 'textureUrl', 'imageUrl']
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

          // Method 7: Try using Spline's internal texture creation if available
          if (splineAppRef.current && typeof (splineAppRef.current as any).createTexture === "function") {
            try {
              const splineTexture = await (splineAppRef.current as any).createTexture(imageUrl)
              if (splineTexture) {
                layer.texture = splineTexture
                layer.image = imageUrl
                console.log(`[Spline3D] ✓ Created Spline texture for ${label}`, { layerType })
                if (material.needsUpdate !== undefined) material.needsUpdate = true
                if (material.update && typeof material.update === "function") material.update()
                if (layerType === 'texture' || layerType === 'image') {
                  return true
                }
              }
            } catch (err) {
              console.warn(`[Spline3D] ✗ Spline createTexture failed for ${label} (${layerType}):`, err)
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
          console.log("[Spline3D] Scene loaded successfully")
          // Wait longer for scene to fully initialize before updating textures
          setTimeout(() => {
            setIsLoading(false)
            
            // TEST: Try to modify primary objects to verify we can affect the scene
            console.log("[Spline3D] ========== RUNNING PROPERTY MODIFICATION TESTS ==========")
            console.log("[Spline3D TEST] Test function available:", typeof testModifyObjectProperties)
            console.log("[Spline3D TEST] Side 1 ID:", side1ObjectId, "Name:", side1ObjectName)
            console.log("[Spline3D TEST] Side 2 ID:", side2ObjectId, "Name:", side2ObjectName)
            
            if (side1ObjectId || side1ObjectName) {
              console.log("[Spline3D TEST] Attempting to find Side 1 object...")
              const testObj1 = side1ObjectId 
                ? app.findObjectById?.(side1ObjectId)
                : app.findObjectByName?.(side1ObjectName || "Side1")
              console.log("[Spline3D TEST] Side 1 object found:", !!testObj1, testObj1 ? { id: (testObj1 as any).id, name: (testObj1 as any).name } : "not found")
              if (testObj1) {
                console.log("[Spline3D TEST] Calling testModifyObjectProperties for Side 1...")
                const testResult = testModifyObjectProperties(testObj1, "Side 1 (Initial Test)")
                console.log("[Spline3D TEST] Side 1 test result:", testResult)
              } else {
                console.warn("[Spline3D TEST] Side 1 object not found for initial test")
              }
            }
            
            if (side2ObjectId || side2ObjectName) {
              console.log("[Spline3D TEST] Attempting to find Side 2 object...")
              const testObj2 = side2ObjectId
                ? app.findObjectById?.(side2ObjectId)
                : app.findObjectByName?.(side2ObjectName || "Side2")
              console.log("[Spline3D TEST] Side 2 object found:", !!testObj2, testObj2 ? { id: (testObj2 as any).id, name: (testObj2 as any).name } : "not found")
              if (testObj2) {
                console.log("[Spline3D TEST] Calling testModifyObjectProperties for Side 2...")
                const testResult = testModifyObjectProperties(testObj2, "Side 2 (Initial Test)")
                console.log("[Spline3D TEST] Side 2 test result:", testResult)
              } else {
                console.warn("[Spline3D TEST] Side 2 object not found for initial test")
              }
            }
            
            // Also test on ALL objects to see if we can modify anything
            try {
              const allObjects = app.getAllObjects?.() || []
              console.log(`[Spline3D TEST] Testing property modification on ALL ${allObjects.length} objects...`)
              let successCount = 0
              for (let i = 0; i < allObjects.length; i++) {
                const testObj = allObjects[i]
                const objId = (testObj as any).id || (testObj as any).uuid
                const objName = (testObj as any).name || `Object ${i}`
                console.log(`[Spline3D TEST] Testing object ${i + 1}/${allObjects.length}:`, { id: objId, name: objName })
                const testResult = testModifyObjectProperties(testObj, `Object ${i + 1} (${objName})`)
                if (testResult) {
                  successCount++
                  console.log(`[Spline3D TEST] ✓ Object ${i + 1} test SUCCESS`)
                } else {
                  console.log(`[Spline3D TEST] ✗ Object ${i + 1} test FAILED`)
                }
              }
              console.log(`[Spline3D TEST] Summary: ${successCount}/${allObjects.length} objects could be modified`)
            } catch (err) {
              console.error("[Spline3D TEST] Error testing all objects:", err)
            }
            console.log("[Spline3D] =========================================================")
            
            // Additional delay before first texture update
            setTimeout(() => {
              updateTextures()
            }, 1000)
          }, 1000)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

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
