"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, EyeOff, Palette } from "lucide-react"
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
  const [isModelVisible, setIsModelVisible] = useState(true)

  // Toggle model visibility
  const toggleModelVisibility = useCallback(() => {
    if (!splineAppRef.current || isLoading) return

    try {
      const app = splineAppRef.current as any
      const canvas = canvasRef.current

      if (isModelVisible) {
        // Hide the model by setting canvas opacity to 0
        if (canvas) {
          canvas.style.opacity = '0'
          console.log('[Spline3D] Model hidden')
        }
      } else {
        // Show the model by setting canvas opacity to 1
        if (canvas) {
          canvas.style.opacity = '1'
          console.log('[Spline3D] Model shown')
        }
      }

      setIsModelVisible(!isModelVisible)
    } catch (err) {
      console.error('[Spline3D] Error toggling visibility:', err)
    }
  }, [isModelVisible, isLoading])

  // Change LAMP color to black
  const changeLampToBlack = useCallback(() => {
    if (!splineAppRef.current || isLoading) return

    const lampObjectId = 'e9e829f2-cbcc-4740-bcca-f0ac77844cd7'
    console.log(`[Spline3D] Attempting to change LAMP (${lampObjectId}) to black...`)

    try {
      const app = splineAppRef.current as any

      // Try to find the object by ID first
      let lampObject = null
      if (app.findObjectById) {
        lampObject = app.findObjectById(lampObjectId)
      }

      if (!lampObject && app.findObjectByName) {
        lampObject = app.findObjectByName('LAMP')
      }

      if (!lampObject) {
        console.warn(`[Spline3D] LAMP object not found with ID: ${lampObjectId} or name: LAMP`)
        return
      }

      console.log(`[Spline3D] Found LAMP object:`, lampObject)

      // Try multiple approaches to change color to black

      // Approach 1: Direct material modification
      if ((lampObject as any).material) {
        const material = (lampObject as any).material
        console.log('[Spline3D] Changing LAMP material color to black...')

        // Try material.color directly
        if (material.color !== undefined) {
          if (typeof material.color.set === "function") {
            material.color.set(0, 0, 0) // Black
            console.log('[Spline3D] ✓ Set LAMP material.color to black via set()')
          } else if (material.color.r !== undefined) {
            material.color.r = 0
            material.color.g = 0
            material.color.b = 0
            console.log('[Spline3D] ✓ Set LAMP material.color to black via rgb')
          }
          material.needsUpdate = true
          if (material.update && typeof material.update === "function") material.update()
        }

        // Try material layers
        if (material.layers) {
          for (const layer of material.layers) {
            if (layer.type === 'color' && layer.color !== undefined) {
              if (typeof layer.color.set === "function") {
                layer.color.set(0, 0, 0) // Black
                console.log('[Spline3D] ✓ Set LAMP layer.color to black via set()')
              } else if (layer.color.r !== undefined) {
                layer.color.r = 0
                layer.color.g = 0
                layer.color.b = 0
                console.log('[Spline3D] ✓ Set LAMP layer.color to black via rgb')
              }
              material.needsUpdate = true
              if (material.update && typeof material.update === "function") material.update()
            }
          }
        }
      }

      // Approach 2: THREE.js mesh material
      if ((lampObject as any).mesh?.material) {
        const meshMaterial = (lampObject as any).mesh.material
        console.log('[Spline3D] Changing LAMP mesh.material color to black...')

        if (typeof meshMaterial.color?.set === "function") {
          meshMaterial.color.set(0, 0, 0) // Black
          console.log('[Spline3D] ✓ Set LAMP mesh.material.color to black')
          meshMaterial.needsUpdate = true
        } else if (meshMaterial.color?.r !== undefined) {
          meshMaterial.color.r = 0
          meshMaterial.color.g = 0
          meshMaterial.color.b = 0
          console.log('[Spline3D] ✓ Set LAMP mesh.material color.rgb to black')
          meshMaterial.needsUpdate = true
        }
      }

      // Approach 3: Complete material replacement
      if ((lampObject as any).mesh) {
        const mesh = (lampObject as any).mesh
        console.log('[Spline3D] Replacing LAMP material completely...')

        const THREE = (window as any).THREE || app.THREE
        if (THREE && THREE.MeshBasicMaterial) {
          const blackMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, // Black
            transparent: false
          })

          const originalMaterial = mesh.material
          mesh.material = blackMaterial
          console.log('[Spline3D] ✓ Completely replaced LAMP material with black THREE.js material')
        }
      }

      // Force render
      if (app.renderer && app.scene && app.camera && typeof app.renderer.render === "function") {
        app.renderer.render(app.scene, app.camera)
        console.log('[Spline3D] ✓ Force rendered after LAMP color change')
      }

      console.log('[Spline3D] LAMP color change attempt completed')

    } catch (err) {
      console.error('[Spline3D] Error changing LAMP color:', err)
    }
  }, [isLoading])

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
              
              // DON'T REVERT - Keep the change so we can see if it worked
              // Force multiple render attempts
              for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                  try {
                    if (material.needsUpdate !== undefined) material.needsUpdate = true
                    if (material.update && typeof material.update === "function") material.update()
                    // Force render via THREE.js
                    if (splineAppRef.current && (splineAppRef.current as any).renderer) {
                      const renderer = (splineAppRef.current as any).renderer
                      const scene = (splineAppRef.current as any).scene
                      const camera = (splineAppRef.current as any).camera
                      if (renderer && scene && camera && typeof renderer.render === "function") {
                        renderer.render(scene, camera)
                        console.log(`[Spline3D TEST] Force rendered ${label} (attempt ${i + 1})`)
                      }
                    }
                  } catch (err) {
                    console.warn(`[Spline3D TEST] Render attempt ${i + 1} failed:`, err)
                  }
                }, i * 500) // Stagger render attempts
              }
              
              // Revert after 10 seconds (longer so user can see)
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
                  console.log(`[Spline3D TEST] Reverted ${label} color after 10 seconds`)
                } catch (err) {
                  console.warn(`[Spline3D TEST] Could not revert color:`, err)
                }
              }, 10000)
              
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

      // DIRECT MATERIAL TEST: Try to change material properties directly to verify we can modify materials
      if (material) {
        console.log(`[Spline3D] DIRECT MATERIAL TEST for ${label}: Attempting direct material modifications...`)
        console.log(`[Spline3D] DIRECT TEST: Material structure:`, {
          hasColor: material.color !== undefined,
          hasLayers: !!material.layers,
          layerCount: material.layers?.length || 0,
          hasMesh: !!(obj as any).mesh,
          hasMeshMaterial: !!(obj as any).mesh?.material,
          materialType: material.constructor?.name,
          allKeys: Object.keys(material).filter(k => !k.startsWith('_'))
        })
        
        try {
          // Test -1: Try to COMPLETELY REPLACE the material with a new THREE.js material
          if ((obj as any).mesh) {
            const mesh = (obj as any).mesh
            console.log(`[Spline3D] DIRECT TEST: Found mesh for ${label}, attempting COMPLETE MATERIAL REPLACEMENT...`)
            try {
              // Get THREE.js from window or Spline
              const THREE = (window as any).THREE || (splineAppRef.current as any)?.THREE
              if (THREE && THREE.MeshBasicMaterial) {
                // Create a completely new material with bright GREEN color
                const newMaterial = new THREE.MeshBasicMaterial({
                  color: 0x00ff00, // Bright green
                  transparent: false
                })

                // Store original material for reversion
                const originalMaterial = mesh.material

                // Replace the material completely
                mesh.material = newMaterial
                console.log(`[Spline3D] ✓ DIRECT TEST: COMPLETELY REPLACED ${label} material with new GREEN THREE.js material`)

                // Force multiple renders
                for (let i = 0; i < 15; i++) {
                  setTimeout(() => {
                    if (splineAppRef.current && (splineAppRef.current as any).renderer) {
                      const renderer = (splineAppRef.current as any).renderer
                      const scene = (splineAppRef.current as any).scene
                      const camera = (splineAppRef.current as any).camera
                      if (renderer && scene && camera && typeof renderer.render === "function") {
                        renderer.render(scene, camera)
                        console.log(`[Spline3D] DIRECT TEST: Force rendered COMPLETE MATERIAL REPLACEMENT (attempt ${i + 1})`)
                      }
                    }
                  }, i * 100) // Every 100ms for 1.5 seconds
                }

                // Revert after 15 seconds
                setTimeout(() => {
                  try {
                    mesh.material = originalMaterial
                    console.log(`[Spline3D] DIRECT TEST: Reverted ${label} to original material after 15 seconds`)
                    // Force render after reversion
                    if (splineAppRef.current && (splineAppRef.current as any).renderer) {
                      const renderer = (splineAppRef.current as any).renderer
                      const scene = (splineAppRef.current as any).scene
                      const camera = (splineAppRef.current as any).camera
                      if (renderer && scene && camera && typeof renderer.render === "function") {
                        renderer.render(scene, camera)
                      }
                    }
                  } catch (err) {
                    console.warn(`[Spline3D] DIRECT TEST: Could not revert material:`, err)
                  }
                }, 15000)
              } else {
                console.warn(`[Spline3D] ✗ DIRECT TEST: THREE.js not available for material replacement`)
              }
            } catch (err) {
              console.warn(`[Spline3D] ✗ DIRECT TEST: Failed to replace material completely:`, err)
            }
          }

          // Test -0.25: Try to find the actual THREE.js object and replace its material directly
          try {
            if (splineAppRef.current) {
              const app = splineAppRef.current as any

              // Try to get the underlying THREE.js object from Spline's object
              const threeObject = (obj as any).object3D || (obj as any)._object3D || (obj as any).threeObject || obj

              if (threeObject && threeObject.traverse) {
                console.log(`[Spline3D] DIRECT TEST: Found THREE.js object for ${label}, traversing children...`)

                let foundMeshes = 0
                threeObject.traverse((child: any) => {
                  if (child.isMesh) {
                    foundMeshes++
                    try {
                      const originalMaterial = child.material

                      // Create new material with bright RED color
                      const THREE = (window as any).THREE || app.THREE
                      if (THREE && THREE.MeshBasicMaterial) {
                        const newMaterial = new THREE.MeshBasicMaterial({
                          color: 0xff0000, // Bright red
                          transparent: false
                        })

                        child.material = newMaterial
                        console.log(`[Spline3D] ✓ DIRECT TEST: Replaced THREE.js mesh material for ${label} child ${foundMeshes} with RED`)

                        // Force render immediately
                        if (app.renderer && typeof app.renderer.render === "function") {
                          const scene = app.scene || app._scene || app.threeScene
                          if (scene) {
                            app.renderer.render(scene, app.camera)
                            console.log(`[Spline3D] ✓ DIRECT TEST: Immediate render after THREE.js material replacement`)
                          }
                        }

                        // Revert after 10 seconds
                        setTimeout(() => {
                          try {
                            child.material = originalMaterial
                            console.log(`[Spline3D] DIRECT TEST: Reverted THREE.js mesh material for ${label} child ${foundMeshes}`)
                            // Force render after reversion
                            if (app.renderer && typeof app.renderer.render === "function") {
                              const scene = app.scene || app._scene || app.threeScene
                              if (scene) {
                                app.renderer.render(scene, app.camera)
                              }
                            }
                          } catch (err) {
                            console.warn(`[Spline3D] DIRECT TEST: Could not revert THREE.js material for child ${foundMeshes}:`, err)
                          }
                        }, 10000)
                      }
                    } catch (err) {
                      console.warn(`[Spline3D] DIRECT TEST: Could not replace THREE.js material for child ${foundMeshes}:`, err)
                    }
                  }
                })

                console.log(`[Spline3D] DIRECT TEST: Found ${foundMeshes} meshes in THREE.js object for ${label}`)
              } else {
                console.warn(`[Spline3D] ✗ DIRECT TEST: Could not access THREE.js object for ${label}`)
              }
            }
          } catch (err) {
            console.warn(`[Spline3D] ✗ DIRECT TEST: Error accessing THREE.js object:`, err)
          }

          // Test -0.5: Try to access THREE.js scene directly and modify all materials
          try {
            if (splineAppRef.current) {
              const app = splineAppRef.current as any
              // Try different ways to access the THREE.js scene
              const threeScene = app.scene || app._scene || app.threeScene || (app.renderer && app.renderer.scene)

              if (threeScene && threeScene.traverse) {
                console.log(`[Spline3D] DIRECT TEST: Found THREE.js scene, traversing to modify ALL materials...`)

                let modifiedCount = 0
                threeScene.traverse((child: any) => {
                  if (child.isMesh && child.material) {
                    try {
                      const originalMaterial = child.material

                      // Create new material with bright BLUE color
                      const THREE = (window as any).THREE || app.THREE
                      if (THREE && THREE.MeshBasicMaterial) {
                        const newMaterial = new THREE.MeshBasicMaterial({
                          color: 0x0000ff, // Bright blue
                          transparent: false
                        })

                        child.material = newMaterial
                        modifiedCount++
                        console.log(`[Spline3D] ✓ DIRECT TEST: Modified scene mesh ${modifiedCount} to BLUE`)

                        // Revert this specific mesh after 12 seconds
                        setTimeout(() => {
                          try {
                            child.material = originalMaterial
                            console.log(`[Spline3D] DIRECT TEST: Reverted scene mesh ${modifiedCount} to original`)
                          } catch (err) {
                            console.warn(`[Spline3D] DIRECT TEST: Could not revert scene mesh ${modifiedCount}:`, err)
                          }
                        }, 12000)
                      }
                    } catch (err) {
                      console.warn(`[Spline3D] DIRECT TEST: Could not modify scene mesh:`, err)
                    }
                  }
                })

                if (modifiedCount > 0) {
                  console.log(`[Spline3D] ✓ DIRECT TEST: Modified ${modifiedCount} meshes in THREE.js scene`)

                  // Force multiple renders
                  for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                      if (app.renderer && typeof app.renderer.render === "function") {
                        app.renderer.render(threeScene, app.camera)
                        console.log(`[Spline3D] DIRECT TEST: Force rendered scene modifications (attempt ${i + 1})`)
                      }
                    }, i * 100)
                  }

                  // Force render after all modifications revert
                  setTimeout(() => {
                    if (app.renderer && typeof app.renderer.render === "function") {
                      app.renderer.render(threeScene, app.camera)
                      console.log(`[Spline3D] DIRECT TEST: Final render after scene modifications reverted`)
                    }
                  }, 12500)
                } else {
                  console.warn(`[Spline3D] ✗ DIRECT TEST: No meshes found in THREE.js scene to modify`)
                }
              } else {
                console.warn(`[Spline3D] ✗ DIRECT TEST: Could not access THREE.js scene`)
              }
            }
          } catch (err) {
            console.warn(`[Spline3D] ✗ DIRECT TEST: Error accessing THREE.js scene:`, err)
          }

          // Test 0: Try to modify mesh.material directly (THREE.js standard)
          if ((obj as any).mesh?.material) {
            const meshMaterial = (obj as any).mesh.material
            console.log(`[Spline3D] DIRECT TEST: Found mesh.material for ${label}, attempting GREEN change...`)
            try {
              const originalColor = meshMaterial.color
              if (typeof meshMaterial.color.set === "function") {
                meshMaterial.color.set(0, 1, 0) // Green
                console.log(`[Spline3D] ✓ DIRECT TEST: Changed ${label} mesh.material.color to GREEN via set()`)
              } else if (meshMaterial.color.r !== undefined) {
                meshMaterial.color.r = 0
                meshMaterial.color.g = 1
                meshMaterial.color.b = 0
                console.log(`[Spline3D] ✓ DIRECT TEST: Changed ${label} mesh.material.color to GREEN via rgb`)
              }
              meshMaterial.needsUpdate = true
              
              // Force multiple renders
              for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                  if (splineAppRef.current && (splineAppRef.current as any).renderer) {
                    const renderer = (splineAppRef.current as any).renderer
                    const scene = (splineAppRef.current as any).scene
                    const camera = (splineAppRef.current as any).camera
                    if (renderer && scene && camera && typeof renderer.render === "function") {
                      renderer.render(scene, camera)
                      console.log(`[Spline3D] DIRECT TEST: Force rendered mesh.material GREEN (attempt ${i + 1})`)
                    }
                  }
                }, i * 200)
              }
              
              // Revert after 10 seconds
              setTimeout(() => {
                try {
                  if (typeof meshMaterial.color.set === "function") {
                    meshMaterial.color.set(originalColor.r || 1, originalColor.g || 1, originalColor.b || 1)
                  } else if (meshMaterial.color.r !== undefined) {
                    meshMaterial.color.r = originalColor.r || 1
                    meshMaterial.color.g = originalColor.g || 1
                    meshMaterial.color.b = originalColor.b || 1
                  }
                  meshMaterial.needsUpdate = true
                  console.log(`[Spline3D] DIRECT TEST: Reverted ${label} mesh.material.color`)
                } catch (err) {
                  console.warn(`[Spline3D] DIRECT TEST: Could not revert mesh.material.color:`, err)
                }
              }, 10000)
            } catch (err) {
              console.warn(`[Spline3D] ✗ DIRECT TEST: Failed to change mesh.material.color:`, err)
            }
          }
          
          // Test 1: Change material color directly to GREEN (very visible)
          if (material.color !== undefined) {
            const originalColor = material.color
            try {
              if (typeof material.color.set === "function") {
                material.color.set(0, 1, 0) // Green
                console.log(`[Spline3D] ✓ DIRECT TEST: Changed ${label} material.color to GREEN via set()`)
              } else if (material.color.r !== undefined) {
                material.color.r = 0
                material.color.g = 1
                material.color.b = 0
                console.log(`[Spline3D] ✓ DIRECT TEST: Changed ${label} material.color to GREEN via rgb`)
              }
              material.needsUpdate = true
              if (material.update && typeof material.update === "function") material.update()
              
              // Force render
              if (splineAppRef.current && (splineAppRef.current as any).renderer) {
                const renderer = (splineAppRef.current as any).renderer
                const scene = (splineAppRef.current as any).scene
                const camera = (splineAppRef.current as any).camera
                if (renderer && scene && camera && typeof renderer.render === "function") {
                  renderer.render(scene, camera)
                  console.log(`[Spline3D] ✓ DIRECT TEST: Force rendered after color change`)
                }
              }
              
              // Force multiple render attempts to ensure visibility
              for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                  try {
                    material.needsUpdate = true
                    if (material.update && typeof material.update === "function") material.update()
                    // Force render via THREE.js
                    if (splineAppRef.current && (splineAppRef.current as any).renderer) {
                      const renderer = (splineAppRef.current as any).renderer
                      const scene = (splineAppRef.current as any).scene
                      const camera = (splineAppRef.current as any).camera
                      if (renderer && scene && camera && typeof renderer.render === "function") {
                        renderer.render(scene, camera)
                        console.log(`[Spline3D] DIRECT TEST: Force rendered ${label} GREEN (attempt ${i + 1})`)
                      }
                    }
                  } catch (err) {
                    console.warn(`[Spline3D] DIRECT TEST: Render attempt ${i + 1} failed:`, err)
                  }
                }, i * 200) // Stagger render attempts every 200ms
              }
              
              // Revert after 10 seconds (longer so user can see)
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
                  console.log(`[Spline3D] DIRECT TEST: Reverted ${label} material.color after 10 seconds`)
                } catch (err) {
                  console.warn(`[Spline3D] DIRECT TEST: Could not revert color:`, err)
                }
              }, 10000)
            } catch (err) {
              console.warn(`[Spline3D] ✗ DIRECT TEST: Failed to change material.color:`, err)
            }
          }
          
          // Test 2: Change material opacity to make it very transparent
          if (material.opacity !== undefined) {
            const originalOpacity = material.opacity
            try {
              material.opacity = 0.2 // Make very transparent
              material.transparent = true
              material.needsUpdate = true
              if (material.update && typeof material.update === "function") material.update()
              console.log(`[Spline3D] ✓ DIRECT TEST: Changed ${label} material.opacity to 0.2 (very transparent)`)
              
              // Force render
              if (splineAppRef.current && (splineAppRef.current as any).renderer) {
                const renderer = (splineAppRef.current as any).renderer
                const scene = (splineAppRef.current as any).scene
                const camera = (splineAppRef.current as any).camera
                if (renderer && scene && camera && typeof renderer.render === "function") {
                  renderer.render(scene, camera)
                }
              }
              
              // Force multiple render attempts
              for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                  try {
                    material.needsUpdate = true
                    if (material.update && typeof material.update === "function") material.update()
                    // Force render via THREE.js
                    if (splineAppRef.current && (splineAppRef.current as any).renderer) {
                      const renderer = (splineAppRef.current as any).renderer
                      const scene = (splineAppRef.current as any).scene
                      const camera = (splineAppRef.current as any).camera
                      if (renderer && scene && camera && typeof renderer.render === "function") {
                        renderer.render(scene, camera)
                        console.log(`[Spline3D] DIRECT TEST: Force rendered ${label} TRANSPARENT (attempt ${i + 1})`)
                      }
                    }
                  } catch (err) {
                    console.warn(`[Spline3D] DIRECT TEST: Render attempt ${i + 1} failed:`, err)
                  }
                }, i * 200)
              }
              
              // Revert after 10 seconds
              setTimeout(() => {
                try {
                  material.opacity = originalOpacity
                  material.needsUpdate = true
                  if (material.update && typeof material.update === "function") material.update()
                  console.log(`[Spline3D] DIRECT TEST: Reverted ${label} material.opacity after 10 seconds`)
                } catch (err) {
                  console.warn(`[Spline3D] DIRECT TEST: Could not revert opacity:`, err)
                }
              }, 10000)
            } catch (err) {
              console.warn(`[Spline3D] ✗ DIRECT TEST: Failed to change material.opacity:`, err)
            }
          }
        } catch (err) {
          console.error(`[Spline3D] ✗ DIRECT TEST: Error in direct material modification:`, err)
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
      
      // Test 3: Try to set material.map directly with image (after image is loaded)
      if (material && material.map !== undefined && imageElement) {
        try {
          const THREE = (window as any).THREE
          if (THREE && THREE.TextureLoader) {
            const loader = new THREE.TextureLoader()
            loader.load(imageUrl, (texture: any) => {
              material.map = texture
              material.needsUpdate = true
              if (material.update && typeof material.update === "function") material.update()
              console.log(`[Spline3D] ✓ DIRECT TEST: Set ${label} material.map directly via THREE.js`)
              
              // Force render
              if (splineAppRef.current && (splineAppRef.current as any).renderer) {
                const renderer = (splineAppRef.current as any).renderer
                const scene = (splineAppRef.current as any).scene
                const camera = (splineAppRef.current as any).camera
                if (renderer && scene && camera && typeof renderer.render === "function") {
                  renderer.render(scene, camera)
                  console.log(`[Spline3D] ✓ DIRECT TEST: Force rendered after material.map update`)
                }
              }
            })
          } else {
            // Fallback: try setting directly
            material.map = imageElement
            material.needsUpdate = true
            if (material.update && typeof material.update === "function") material.update()
            console.log(`[Spline3D] ✓ DIRECT TEST: Set ${label} material.map directly`)
            
            // Force render
            if (splineAppRef.current && (splineAppRef.current as any).renderer) {
              const renderer = (splineAppRef.current as any).renderer
              const scene = (splineAppRef.current as any).scene
              const camera = (splineAppRef.current as any).camera
              if (renderer && scene && camera && typeof renderer.render === "function") {
                renderer.render(scene, camera)
              }
            }
          }
        } catch (err) {
          console.warn(`[Spline3D] ✗ DIRECT TEST: Failed to set material.map:`, err)
        }
      }

      // Get all layers and prioritize 'texture' and 'image' layers
      const allLayers = material.layers || []
      console.log(`[Spline3D] ${label} all layers (${allLayers.length}):`, allLayers.map((l: any) => ({
        type: l.type,
        properties: Object.keys(l).filter(k => !k.startsWith('_')),
        hasImage: l.image !== undefined,
        hasTexture: l.texture !== undefined,
        hasUrl: l.url !== undefined,
        hasSource: l.source !== undefined,
        // Log the actual layer object structure for debugging
        layerStructure: Object.keys(l).reduce((acc: any, key: string) => {
          if (!key.startsWith('_')) {
            const value = l[key]
            acc[key] = {
              type: typeof value,
              isFunction: typeof value === 'function',
              isObject: typeof value === 'object' && value !== null,
              value: typeof value === 'object' ? (Array.isArray(value) ? `Array[${value.length}]` : 'Object') : value
            }
          }
          return acc
        }, {})
      })))
      
      // Also log the material structure
      console.log(`[Spline3D] ${label} material structure:`, {
        type: material.type,
        properties: Object.keys(material).filter(k => !k.startsWith('_')),
        hasMap: material.map !== undefined,
        hasMaps: material.maps !== undefined,
        hasUniforms: material.uniforms !== undefined
      })
      
      // Try accessing the object's mesh directly
      console.log(`[Spline3D] ${label} object structure:`, {
        type: (obj as any).type,
        hasMesh: !!(obj as any).mesh,
        hasGeometry: !!(obj as any).geometry,
        properties: Object.keys(obj).filter(k => !k.startsWith('_') && k !== 'children').slice(0, 20)
      })

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
              
              // Force multiple update methods
              if (material.needsUpdate !== undefined) material.needsUpdate = true
              if (material.update && typeof material.update === "function") {
                material.update()
              }
              
              // Try to force render update on the app
              if (splineAppRef.current) {
                // Try different update methods
                if (typeof (splineAppRef.current as any).update === "function") {
                  (splineAppRef.current as any).update()
                }
                if (typeof (splineAppRef.current as any).render === "function") {
                  (splineAppRef.current as any).render()
                }
                // Try accessing THREE.js renderer directly
                const renderer = (splineAppRef.current as any).renderer
                if (renderer && typeof renderer.render === "function") {
                  const scene = (splineAppRef.current as any).scene
                  const camera = (splineAppRef.current as any).camera
                  if (scene && camera) {
                    renderer.render(scene, camera)
                    console.log(`[Spline3D] ✓ Force rendered via THREE.js renderer`)
                  }
                }
              }
              
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

          // Method 8: Try directly accessing the object's mesh and updating its material
          try {
            const mesh = (obj as any).mesh
            if (mesh && mesh.material) {
              const meshMaterial = mesh.material
              console.log(`[Spline3D] ${label} found mesh material:`, {
                type: meshMaterial.type,
                hasMap: meshMaterial.map !== undefined,
                hasMaps: meshMaterial.maps !== undefined,
                properties: Object.keys(meshMaterial).filter(k => !k.startsWith('_')).slice(0, 15)
              })
              
              // Try updating mesh material map directly
              if (meshMaterial.map !== undefined && imageElement) {
                try {
                  // Try to create a THREE.js texture if available
                  const THREE = (window as any).THREE
                  if (THREE && THREE.TextureLoader) {
                    const loader = new THREE.TextureLoader()
                    const texture = loader.load(imageUrl, (tex: any) => {
                      meshMaterial.map = tex
                      meshMaterial.needsUpdate = true
                      console.log(`[Spline3D] ✓ Updated ${label} mesh material.map via THREE.js`)
                      // Force render
                      if (splineAppRef.current && (splineAppRef.current as any).renderer) {
                        const renderer = (splineAppRef.current as any).renderer
                        const scene = (splineAppRef.current as any).scene
                        const camera = (splineAppRef.current as any).camera
                        if (renderer && scene && camera && typeof renderer.render === "function") {
                          renderer.render(scene, camera)
                        }
                      }
                    })
                  } else {
                    // Fallback: try setting directly
                    meshMaterial.map = imageElement
                    meshMaterial.needsUpdate = true
                    console.log(`[Spline3D] ✓ Set ${label} mesh material.map directly`)
                  }
                  if (layerType === 'texture' || layerType === 'image') {
                    return true
                  }
                } catch (err) {
                  console.warn(`[Spline3D] ✗ Updating mesh material.map failed for ${label}:`, err)
                }
              }
            }
          } catch (err) {
            console.warn(`[Spline3D] ✗ Accessing mesh material failed for ${label}:`, err)
          }

          // Method 9: Try directly accessing and updating the layer's internal texture object
          try {
            // Try setting image directly on the layer object itself (not just layer.image)
            if (imageElement) {
              // Try all possible texture-related properties
              const textureProps = ['textureImage', 'textureMap', 'map', 'diffuseMap', 'albedoMap', 'baseColorMap', 'baseMap']
              for (const prop of textureProps) {
                if (layer[prop] !== undefined) {
                  try {
                    layer[prop] = imageElement
                    console.log(`[Spline3D] ✓ Set ${label} layer.${prop} = imageElement`, { layerType })
                    if (material.needsUpdate !== undefined) material.needsUpdate = true
                    if (material.update && typeof material.update === "function") material.update()
                    // Force render
                    if (splineAppRef.current && (splineAppRef.current as any).renderer) {
                      const renderer = (splineAppRef.current as any).renderer
                      const scene = (splineAppRef.current as any).scene
                      const camera = (splineAppRef.current as any).camera
                      if (renderer && scene && camera && typeof renderer.render === "function") {
                        renderer.render(scene, camera)
                      }
                    }
                    if (layerType === 'texture' || layerType === 'image') {
                      return true
                    }
                  } catch (err) {
                    // Continue to next property
                  }
                }
              }
            }
          } catch (err) {
            console.warn(`[Spline3D] ✗ Direct layer property update failed for ${label}:`, err)
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
    console.log("[Spline3D] Initializing...", {
      hasCanvas: !!canvasRef.current,
      isClient: typeof window !== "undefined",
      canvasWidth: canvasRef.current?.width,
      canvasHeight: canvasRef.current?.height
    })

    if (typeof window === "undefined") {
      console.warn("[Spline3D] Window not available, skipping initialization")
      return
    }

    if (!canvasRef.current) {
      console.warn("[Spline3D] Canvas ref not available yet, will retry...")
      // Retry after a short delay
      const timeout = setTimeout(() => {
        if (canvasRef.current) {
          console.log("[Spline3D] Canvas now available, initializing...")
          // Trigger re-initialization by setting a flag or calling the effect again
        }
      }, 100)
      return () => clearTimeout(timeout)
    }

    setIsLoading(true)
    setError(null)

    const canvas = canvasRef.current
    console.log("[Spline3D] Canvas element:", {
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
      offsetWidth: canvas.offsetWidth,
      offsetHeight: canvas.offsetHeight
    })

    // Ensure canvas has dimensions - use getBoundingClientRect for accurate sizing
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      const width = Math.max(rect.width || canvas.clientWidth || 800, 100)
      const height = Math.max(rect.height || canvas.clientHeight || 600, 100)
      
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        console.log("[Spline3D] Set canvas dimensions:", canvas.width, "x", canvas.height)
      }
    }
    
    setCanvasSize()
    
    // Set up a resize observer to handle dynamic sizing
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        if (canvas) {
          setCanvasSize()
        }
      })
      resizeObserver.observe(canvas)
    }

    try {
      console.log("[Spline3D] Creating Application instance...")
      const app = new Application(canvas)
      console.log("[Spline3D] Application created:", app)
      
      const scenePath = "/spline/scene.splinecode"
      console.log("[Spline3D] Loading scene from:", scenePath)
      
      // Load scene from public directory
      app.load(scenePath)
        .then(() => {
          console.log("[Spline3D] Scene loaded successfully!")
          splineAppRef.current = app
          
          // Wait longer for scene to fully initialize before updating textures
          setTimeout(() => {
            setIsLoading(false)
            console.log("[Spline3D] Scene initialization complete, running tests...")
            
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
          console.error("[Spline3D] Error details:", {
            message: err.message,
            stack: err.stack,
            name: err.name,
            scenePath
          })
          setError(`Failed to load 3D scene: ${err.message || err}. Please check the console for details.`)
          setIsLoading(false)
        })
    } catch (err: any) {
      console.error("[Spline3D] Error initializing Spline:", err)
      console.error("[Spline3D] Initialization error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
      setError(`Failed to initialize 3D viewer: ${err.message || err}. Please refresh the page.`)
      setIsLoading(false)
    }

    return () => {
      console.log("[Spline3D] Cleaning up...")
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
      if (splineAppRef.current) {
        try {
          splineAppRef.current.dispose?.()
          console.log("[Spline3D] Scene disposed")
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
            style={{ display: "block", width: "100%", height: "100%" }}
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

        {/* Control Buttons */}
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

          <Button
            onClick={changeLampToBlack}
            variant="outline"
            size="sm"
            disabled={isLoading || !!error}
            className="flex items-center gap-2"
          >
            <Palette className="h-4 w-4" />
            Make Lamp Black
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
