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
  
  // Store references to test image planes
  const testPlanesSide1Ref = useRef<THREE.Mesh[]>([])
  const testPlanesSide2Ref = useRef<THREE.Mesh[]>([])
  const originalSide1Ref = useRef<any>(null)
  const originalSide2Ref = useRef<any>(null)

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

    console.log("[Spline3D] Creating image planes:", { 
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

    // Helper to get THREE.js mesh from Spline object
    const getMesh = (obj: any): any => {
      if (obj.mesh) return obj.mesh
      if (obj.object3D) return obj.object3D
      // Try to find mesh in scene
      let foundMesh: any = null
      scene.traverse((node: any) => {
        if (node.uuid === obj.uuid || node.name === obj.name) {
          if (node.isMesh) {
            foundMesh = node
          }
        }
      })
      return foundMesh
    }

    // Helper to create test image planes in multiple ways
    const createTestImagePlanes = async (imageUrl: string, label: string) => {
      try {
        console.log(`[Spline3D] Creating test image planes for ${label}...`)
        console.log(`[Spline3D] Scene info:`, {
          type: scene?.constructor?.name,
          children: scene?.children?.length,
          uuid: scene?.uuid
        })
        
        const planes: THREE.Mesh[] = []

        // Test 0: Simple RED plane first to verify visibility (no texture)
        const test0Geometry = new THREE.PlaneGeometry(10, 10)
        const test0Material = new THREE.MeshBasicMaterial({
          color: 0xff0000, // Bright red
          side: THREE.DoubleSide
        })
        const test0 = new THREE.Mesh(test0Geometry, test0Material)
        test0.position.set(0, 0, 0)
        test0.name = `${label}_test0_red`
        scene.add(test0)
        planes.push(test0)
        console.log(`[Spline3D] ✓ Test 0: Added RED plane at origin to verify visibility`, test0.position)

        // Load texture using imported THREE.js
        const textureLoader = new THREE.TextureLoader()
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          textureLoader.load(
            imageUrl,
            (tex: THREE.Texture) => {
              tex.needsUpdate = true
              resolve(tex)
            },
            undefined,
            reject
          )
        })

        // Get image dimensions with proper typing
        const image = texture.image as HTMLImageElement
        const imageWidth = image?.width || 1
        const imageHeight = image?.height || 1
        const imageAspect = imageWidth / imageHeight

        console.log(`[Spline3D] ✓ Loaded texture for ${label}`, { 
          width: imageWidth, 
          height: imageHeight,
          aspect: imageAspect
        })

        // Test 1: HUGE plane at origin with texture
        const plane1Geometry = new THREE.PlaneGeometry(20, 20 / imageAspect)
        const plane1Material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: false
        })
        const plane1 = new THREE.Mesh(plane1Geometry, plane1Material)
        plane1.position.set(0, 0, 10) // Move forward
        plane1.name = `${label}_test1_origin`
        scene.add(plane1)
        planes.push(plane1)
        console.log(`[Spline3D] ✓ Test 1: Added HUGE plane at (0,0,10)`, plane1.position)

        // Test 2: Try adding to scene.children directly
        const plane2Geometry = new THREE.PlaneGeometry(15, 15 / imageAspect)
        const plane2Material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: false
        })
        const plane2 = new THREE.Mesh(plane2Geometry, plane2Material)
        plane2.position.set(15, 0, 0)
        plane2.name = `${label}_test2_direct`
        if (scene.children) {
          scene.children.push(plane2)
        } else {
          scene.add(plane2)
        }
        planes.push(plane2)
        console.log(`[Spline3D] ✓ Test 2: Added plane via scene.children at (15,0,0)`, plane2.position)

        // Test 3: Try as Sprite (always faces camera)
        const spriteMap = new THREE.TextureLoader().load(imageUrl, (tex) => {
          tex.needsUpdate = true
        })
        const spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap })
        const sprite = new THREE.Sprite(spriteMaterial)
        sprite.scale.set(10, 10, 1)
        sprite.position.set(-15, 0, 0)
        sprite.name = `${label}_test3_sprite`
        scene.add(sprite)
        planes.push(sprite as any) // Store as any since it's not a Mesh
        console.log(`[Spline3D] ✓ Test 3: Added SPRITE at (-15,0,0)`, sprite.position)

        // Test 4: Try adding to a specific object in the scene
        const plane4Geometry = new THREE.PlaneGeometry(12, 12 / imageAspect)
        const plane4Material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: false
        })
        const plane4 = new THREE.Mesh(plane4Geometry, plane4Material)
        plane4.position.set(0, 10, 0)
        plane4.rotation.x = -Math.PI / 2
        plane4.name = `${label}_test4_above`
        
        // Try to find the lamp or a visible object and add as child
        const lampObj = app.findObjectById?.('e9e829f2-cbcc-4740-bcca-f0ac77844cd7') || app.findObjectByName?.('LAMP')
        if (lampObj?.mesh) {
          lampObj.mesh.add(plane4)
          console.log(`[Spline3D] ✓ Test 4: Added plane as child of LAMP object`)
        } else {
          scene.add(plane4)
          console.log(`[Spline3D] ✓ Test 4: Added plane to scene at (0,10,0)`)
        }
        planes.push(plane4)

        // Force render update
        if (app.renderer && app.scene && app.camera) {
          try {
            app.renderer.render(app.scene, app.camera)
            console.log(`[Spline3D] ✓ Forced render update`)
          } catch (e) {
            console.warn(`[Spline3D] Could not force render:`, e)
          }
        }

        console.log(`[Spline3D] ✓ Created ${planes.length} test objects for ${label}`)
        console.log(`[Spline3D] Scene now has ${scene.children.length} children`)
        
        return planes
      } catch (err) {
        console.error(`[Spline3D] Error creating test image planes for ${label}:`, err)
        return []
      }
    }

    // Handle Side 1 - Create test planes
    if (image1) {
      // Remove old test planes if they exist
      testPlanesSide1Ref.current.forEach(plane => {
        scene.remove(plane)
        plane.geometry.dispose()
        if (Array.isArray(plane.material)) {
          plane.material.forEach(mat => mat.dispose())
        } else {
          plane.material.dispose()
        }
      })
      testPlanesSide1Ref.current = []

      // Create new test planes
      const planes = await createTestImagePlanes(image1, "Side 1")
      testPlanesSide1Ref.current = planes
      console.log(`[Spline3D] ✓ Created ${planes.length} test planes for Side 1`)
    } else {
      // Remove test planes when no image
      testPlanesSide1Ref.current.forEach(plane => {
        scene.remove(plane)
        plane.geometry.dispose()
        if (Array.isArray(plane.material)) {
          plane.material.forEach(mat => mat.dispose())
        } else {
          plane.material.dispose()
        }
      })
      testPlanesSide1Ref.current = []
    }

    // Handle Side 2 - Create test planes
    if (image2) {
      // Remove old test planes if they exist
      testPlanesSide2Ref.current.forEach(plane => {
        scene.remove(plane)
        plane.geometry.dispose()
        if (Array.isArray(plane.material)) {
          plane.material.forEach(mat => mat.dispose())
        } else {
          plane.material.dispose()
        }
      })
      testPlanesSide2Ref.current = []

      // Create new test planes
      const planes = await createTestImagePlanes(image2, "Side 2")
      testPlanesSide2Ref.current = planes
      console.log(`[Spline3D] ✓ Created ${planes.length} test planes for Side 2`)
    } else {
      // Remove test planes when no image
      testPlanesSide2Ref.current.forEach(plane => {
        scene.remove(plane)
        plane.geometry.dispose()
        if (Array.isArray(plane.material)) {
          plane.material.forEach(mat => mat.dispose())
        } else {
          plane.material.dispose()
        }
      })
      testPlanesSide2Ref.current = []
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
      
      // Clean up test planes
      const cleanupPlanes = (planes: THREE.Mesh[]) => {
        const app = splineAppRef.current as any
        planes.forEach(plane => {
          if (app?.scene) {
            app.scene.remove(plane)
          }
          plane.geometry.dispose()
          if (Array.isArray(plane.material)) {
            plane.material.forEach(mat => mat.dispose())
          } else {
            plane.material.dispose()
          }
        })
      }
      cleanupPlanes(testPlanesSide1Ref.current)
      cleanupPlanes(testPlanesSide2Ref.current)
      
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
