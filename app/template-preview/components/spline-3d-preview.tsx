"use client"

import { useEffect, useRef, useState, useCallback } from "react"

import { Loader2, Eye, EyeOff } from "lucide-react"
import { Application } from "@splinetool/runtime"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@/components/ui"

const __SPLINE_DEV__ = process.env.NODE_ENV === "development"
const splineLog = (...args: unknown[]) => __SPLINE_DEV__ && console.log('[Spline]', ...args)

/** Get THREE.Color constructor from Spline scene to avoid bundling a second Three.js instance. */
function getColorConstructor(scene: any, app?: any): new (hex: string) => { setHex?: (h: number) => void } | null {
  // Try app.THREE first (some runtimes expose it)
  const fromApp = (app as any)?.THREE?.Color ?? (app as any)?.constructor?.THREE?.Color
  if (fromApp && typeof fromApp === 'function') return fromApp
  if (!scene) return null
  let ColorCtor: new (hex: string) => any = null
  scene.traverse?.((obj: any) => {
    if (ColorCtor) return
    const c = obj?.material?.color ?? obj?.mesh?.material?.color
    if (c && typeof c.constructor === 'function' && c.constructor.name === 'Color') {
      ColorCtor = c.constructor
    }
  })
  return ColorCtor
}

function setSceneBackground(scene: any, hex: string, app?: any): void {
  if (!scene) return
  const ColorCtor = getColorConstructor(scene, app)
  if (ColorCtor) {
    scene.background = new ColorCtor(hex)
  }
}
const splineWarn = (...args: unknown[]) => __SPLINE_DEV__ && console.warn('[Spline]', ...args)
const splineError = (...args: unknown[]) => __SPLINE_DEV__ && console.error('[Spline]', ...args)
import { cn } from "@/lib/utils"
import { DEFAULT_SIDE_POSITION } from "@/lib/experience-image-position"
interface Spline3DPreviewProps {
  image1: string | null
  image2: string | null
  side1ObjectId?: string
  side2ObjectId?: string
  side1ObjectName?: string
  side2ObjectName?: string
  /** When true, renders only the canvas with loading/error overlays -- no Card wrapper, no debug controls */
  minimal?: boolean
  /** Additional className for the outer container (only used in minimal mode) */
  className?: string
  /** Called after panel discovery; reports whether Side A and Side B objects were found in the scene */
  onPanelsFound?: (found: { sideA: boolean; sideB: boolean; sameObject: boolean }) => void
  /** Swap image mapping: when true, image1 goes to "Side B" object and image2 to "Side A" (use if physical sides are reversed) */
  swapLampSides?: boolean
  /** Which side(s) to flip horizontally: 'A' | 'B' | 'both' | 'none'. Use when one side appears mirrored. */
  flipForSide?: 'A' | 'B' | 'both' | 'none'
  /** Override flip for Side B only: 'none' | 'horizontal' | 'vertical' | 'both'. Use when Side B panel has different UV orientation. */
  flipForSideB?: 'none' | 'horizontal' | 'vertical' | 'both'
  /** Scale of image on panel (0.5–2, default 0.96). Smaller = more border, larger = fills panel. */
  imageScale?: number
  /** Horizontal offset from center (-0.5 to 0.5). Positive = right. */
  imageOffsetX?: number
  /** Vertical offset from center (-0.5 to 0.5). Positive = down. */
  imageOffsetY?: number
  /** Width scale multiplier (0.5–1.5). < 1 squeezes width. Default 0.95. */
  imageScaleX?: number
  /** Height scale multiplier (0.5–2). < 1 compresses, > 1 expands. Default 1. */
  imageScaleY?: number
  /** Side B overrides. When undefined, Side B uses Side A values. */
  imageScaleB?: number
  imageOffsetXB?: number
  imageOffsetYB?: number
  imageScaleXB?: number
  imageScaleYB?: number
  /** Light or dark lamp variant. Toggles visibility of White vs Black (or Light vs Dark) scene groups. */
  lampVariant?: 'light' | 'dark'
  /** Override for preview background (scene, loading, error). When set, controls background independently of lampVariant. */
  previewTheme?: 'light' | 'dark'
  /** Override point light intensity (default: unchanged). E.g. 1.5 for brighter. */
  pointLightIntensity?: number
  /** Override point light position. */
  pointLightPosition?: { x?: number; y?: number; z?: number }
  /** Override point light distance (0 = infinite). */
  pointLightDistance?: number
  /** When true, apply subtle rotation (slow spin or cursor-follow when interactive). */
  animate?: boolean
  /** When true with animate, rotation follows cursor for interactivity. */
  interactive?: boolean
}

export function Spline3DPreview({ 
  image1, 
  image2,
  side1ObjectId,
  side2ObjectId,
  side1ObjectName = "Side1",
  side2ObjectName = "Side2",
  minimal = false,
  className,
  onPanelsFound,
  swapLampSides = false,
  flipForSide = 'A',
  flipForSideB,
  imageScale = DEFAULT_SIDE_POSITION.scale,
  imageOffsetX = DEFAULT_SIDE_POSITION.offsetX,
  imageOffsetY = DEFAULT_SIDE_POSITION.offsetY,
  imageScaleX = DEFAULT_SIDE_POSITION.scaleX,
  imageScaleY = DEFAULT_SIDE_POSITION.scaleY,
  imageScaleB,
  imageOffsetXB,
  imageOffsetYB,
  imageScaleXB,
  imageScaleYB,
  lampVariant = 'light',
  previewTheme,
  pointLightIntensity,
  pointLightPosition,
  pointLightDistance,
  animate = false,
  interactive = false,
}: Spline3DPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const splineAppRef = useRef<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModelVisible, setIsModelVisible] = useState(true)
  
  // Store references to objects with image layers
  const side1ObjectRef = useRef<any>(null)
  const side2ObjectRef = useRef<any>(null)
  const variantRootsRef = useRef<{ light: any; dark: any }>({ light: null, dark: null })
  const lightOriginalsRef = useRef<Map<any, number>>(new Map())
  
  // Pre-discovered panel object refs (populated on scene load)
  const discoveredPanelsRef = useRef<{ sideA: any; sideB: any }>({ sideA: null, sideB: null })

  const SCENE_PATH = '/spline/splinemodel2/scene.splinecode'

  
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
    splineLog("[Spline3D] ===== DEBUGGING TEXTURE SIZES =====")

    const app = splineAppRef.current as any
    if (!app) {
      splineWarn("[Spline3D] No app available for debugging")
      return
    }

    const scene = app.scene || app._scene
    if (!scene) {
      splineWarn("[Spline3D] No scene available for debugging")
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
        splineLog(`[Spline3D] Inspecting ${currentPath}:`)
        material.layers.forEach((layer: any, index: number) => {
          if (layer.texture && layer.texture.image) {
            splineLog(`  Layer ${index} (${layer.type}):`, {
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
    splineLog("[Spline3D] ===== END TEXTURE SIZE DEBUG =====")
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
      splineWarn(`[Spline3D] Cannot toggle object: missing references`)
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
      
      splineLog(`[Spline3D] Toggled object ${objectInfo.objectName} to ${newVisible ? 'visible' : 'hidden'}`)
    } catch (err) {
      splineError(`[Spline3D] Error toggling object:`, err)
    }
  }, [])

  // Toggle individual layer visibility
  const toggleLayerVisibility = useCallback((layerInfo: LayerInfo) => {
    const app = splineAppRef.current as any
    if (!app || !layerInfo.layerRef || !layerInfo.materialRef) {
      splineWarn(`[Spline3D] Cannot toggle layer: missing references`)
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

          splineLog(`[Spline3D] Restored image on ${layerInfo.objectName} (including texture.image)`)
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
            splineLog(`[Spline3D] Cleared texture.image from ${layerInfo.objectName} - this should remove the visible image!`)
          } else {
            layer.texture = null
          }

          splineLog(`[Spline3D] Cleared image from ${layerInfo.objectName}`)
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
            splineLog(`[Spline3D] Restored ${property} on ${layerInfo.objectName}`)
          }
        } else {
          // Store original and clear
          if (!originalMaterialValuesRef.current.has(key)) {
            originalMaterialValuesRef.current.set(key, material[property])
          }
          material[property] = null
          splineLog(`[Spline3D] Cleared ${property} on ${layerInfo.objectName}`)
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
      
      splineLog(`[Spline3D] Toggled ${layerInfo.objectName} layer ${layerInfo.layerIndex} (${layerInfo.layerType}) to ${newVisible ? 'visible' : 'hidden'}`)
    } catch (err) {
      splineError(`[Spline3D] Error toggling layer:`, err)
    }
  }, [])

  // Clone mesh, create new material with UV texture, toggle visibility
  const updateTextures = useCallback(async () => {
    if (!splineAppRef.current || isLoading) return

    splineLog("[Spline3D] Adding image layers to materials:", { 
      hasImage1: !!image1, 
      hasImage2: !!image2,
      side1ObjectId,
      side2ObjectId
    })

    const app = splineAppRef.current as any
    
    // Get the THREE.js scene from Spline
    const scene = app.scene || app._scene
    if (!scene) {
      splineError("[Spline3D] Scene not available")
      return
    }

    splineLog("[Spline3D] ✓ Using scene from Spline runtime")

    // Scene uses "PC trans A" (child, has material) under "Panel Side A" (parent, no material).
    const hasMaterial = (obj: any) => {
      const mat = obj?.material || obj?.mesh?.material
      return mat?.layers?.some((l: any) => l.type === 'texture' && l.texture != null)
    }
    const findDescendantWithMaterial = (obj: any): any => {
      if (!obj) return null
      if (hasMaterial(obj)) return obj
      for (const c of obj.children || []) {
        const found = findDescendantWithMaterial(c)
        if (found) return found
      }
      for (const c of obj.mesh?.children || []) {
        const found = findDescendantWithMaterial(c)
        if (found) return found
      }
      return null
    }

    const discoverPanels = () => {
      const searchRoot = scene

      const sideANames = ["PC trans A", "PC Trans A", "Trans A", "Panel Side A", "Side A"]
      const sideBNames = ["PC Trans B", "Trans B", "Panel Side B", "Side B"]
      let sideA: any = null
      let sideB: any = null
      const texturedObjects: { name: string; obj: any }[] = []
      const visited = new Set<string>()

      const traverse = (node: any, path: string) => {
        if (!node) return
        const uid = node.uuid || node.id || ''
        if (uid && visited.has(uid)) return
        if (uid) visited.add(uid)

        const name = (node.name || '').toString()
        const currentPath = path ? `${path} > ${name}` : name

        if (hasMaterial(node)) {
          texturedObjects.push({ name, obj: node })
          if (!sideA && sideANames.some((p) => name.toLowerCase().includes(p.toLowerCase()))) sideA = node
          if (!sideB && sideBNames.some((p) => name.toLowerCase().includes(p.toLowerCase()))) sideB = node
        }

        for (const c of node.children || []) traverse(c, currentPath)
        for (const c of node.mesh?.children || []) traverse(c, currentPath)
      }
      traverse(searchRoot, 'Scene')

      if (app.findObjectByName) {
        for (const n of sideANames) {
          const o = app.findObjectByName(n)
          if (o) {
            const withMat = hasMaterial(o) ? o : findDescendantWithMaterial(o)
            if (withMat) { sideA = withMat; break }
          }
        }
        for (const n of sideBNames) {
          const o = app.findObjectByName(n)
          if (o) {
            const withMat = hasMaterial(o) ? o : findDescendantWithMaterial(o)
            if (withMat) { sideB = withMat; break }
          }
        }
      }

      if (!sideA && side1ObjectId && app.findObjectById) {
        const o = app.findObjectById(side1ObjectId)
        sideA = hasMaterial(o) ? o : findDescendantWithMaterial(o)
      }
      if (!sideB && side2ObjectId && app.findObjectById) {
        const o = app.findObjectById(side2ObjectId)
        sideB = hasMaterial(o) ? o : findDescendantWithMaterial(o)
      }

      if (!sideA && texturedObjects.length >= 1) sideA = texturedObjects[0].obj
      if (!sideB && texturedObjects.length >= 2) sideB = texturedObjects[1].obj

      splineLog(`[Spline3D] Panel discovery — Side A: ${sideA ? (sideA.name || sideA.uuid) : 'NOT FOUND'}, Side B: ${sideB ? (sideB.name || sideB.uuid) : 'NOT FOUND'}, A has material: ${!!(sideA && hasMaterial(sideA))}, B has material: ${!!(sideB && hasMaterial(sideB))}`)

      discoveredPanelsRef.current = { sideA, sideB }
      return discoveredPanelsRef.current
    }

    type PositionParams = { scale: number; offsetX: number; offsetY: number; scaleX: number; scaleY: number }
    const posA: PositionParams = { scale: imageScale, offsetX: imageOffsetX, offsetY: imageOffsetY, scaleX: imageScaleX, scaleY: imageScaleY }
    const posB: PositionParams = {
      scale: imageScaleB ?? imageScale,
      offsetX: imageOffsetXB ?? imageOffsetX,
      offsetY: imageOffsetYB ?? imageOffsetY,
      scaleX: imageScaleXB ?? imageScaleX,
      scaleY: imageScaleYB ?? imageScaleY,
    }

    type FlipMode = 'none' | 'horizontal' | 'vertical' | 'both'
    const parseFlip = (v: boolean | FlipMode): FlipMode => {
      if (typeof v === 'string') return v
      return v ? 'horizontal' : 'none'
    }
    type LayerOverrides = { projection?: number; axis?: string } | null
    // Helper to add image layer to Spline material
    const addImageLayerToMaterial = async (
      obj: any,
      imageUrl: string,
      label: string,
      flip: boolean | FlipMode,
      pos: PositionParams,
      opts?: { layerOverrides?: LayerOverrides; captureLayer?: { projection?: number; axis?: string } }
    ) => {
      const layerOverrides = opts?.layerOverrides ?? null
      const flipMode = parseFlip(flip)
      if (!obj) {
        splineWarn(`[Spline3D] Cannot add image layer: ${label} object not found`)
        return false
      }

      try {
        splineLog(`[Spline3D] Attempting to add image layer to ${label} material...`)
        
        // Get material from object
        let material = obj.material
        if (!material && obj.mesh) {
          material = obj.mesh.material
        }
        
        if (!material) {
          splineWarn(`[Spline3D] No material found on ${label} object`)
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
        
        splineLog(`[Spline3D] Found material for ${label}:`, {
          hasLayers: !!material.layers,
          layersCount: material.layers?.length,
          layerTypes: material.layers?.map((l: any) => l.type),
          layerDetails: layerInfo
        })

        // Load image element first
        const imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = imageUrl
        })

        // Draw to canvas: scale + position, optionally flip (avoids texture repeat/splitting)
        const scale = Math.max(0.5, Math.min(2, pos.scale))
        const scaleX = Math.max(0.5, Math.min(1.5, pos.scaleX))
        const scaleY = Math.max(0.5, Math.min(2, pos.scaleY))
        const canvas = document.createElement('canvas')
        canvas.width = imageElement.width
        canvas.height = imageElement.height
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const w = canvas.width * scale * scaleX
        const h = canvas.height * scale * scaleY
        const ox = Math.max(-0.5, Math.min(0.5, pos.offsetX))
        const oy = Math.max(-0.5, Math.min(0.5, pos.offsetY))
        const x = (canvas.width - w) / 2 + ox * canvas.width
        const y = (canvas.height - h) / 2 + oy * canvas.height
        ctx.save()
        if (flipMode === 'horizontal') {
          ctx.translate(canvas.width, 0)
          ctx.scale(-1, 1)
        } else if (flipMode === 'vertical') {
          ctx.translate(0, canvas.height)
          ctx.scale(1, -1)
        } else if (flipMode === 'both') {
          ctx.translate(canvas.width, canvas.height)
          ctx.scale(-1, -1)
        }
        ctx.drawImage(imageElement, x, y, w, h)
        ctx.restore()
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png')
        )
        const imageUint8Array = new Uint8Array(await blob!.arrayBuffer())
        splineLog(`[Spline3D] ✓ Loaded image for ${label}: ${canvas.width}x${canvas.height}, scale ${scale}`)

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
                splineLog(`[Spline3D] Found image layer ${i} for ${label} - attempting to update`, {
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

                  splineLog(`[Spline3D] Original texture.image structure:`, {
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

                  // Apply projection/axis overrides from Side A (so Side B matches layout)
                  if (layerOverrides) {
                    if (layerOverrides.projection !== undefined && 'projection' in layer) {
                      layer.projection = layerOverrides.projection
                      splineLog(`[Spline3D] Applied projection override for ${label}: ${layerOverrides.projection}`)
                    }
                    if (layerOverrides.axis !== undefined && 'axis' in layer) {
                      layer.axis = layerOverrides.axis
                      splineLog(`[Spline3D] Applied axis override for ${label}: ${layerOverrides.axis}`)
                    }
                  }

                  // Replace ONLY the image data -- keep original UV transforms
                  // (rotation, repeat, offset) that the Spline scene designer set up.
                  layer.texture.image.data = imageUint8Array
                  layer.texture.image.width = imageElement.width
                  layer.texture.image.height = imageElement.height
                  layer.texture.image.name = `uploaded-image-${label}`

                  // Preserve original filter/wrapping values
                  layer.texture.image.magFilter = originalImage.magFilter !== undefined ? originalImage.magFilter : 1006
                  layer.texture.image.minFilter = originalImage.minFilter !== undefined ? originalImage.minFilter : 1008
                  layer.texture.image.wrapping = originalImage.wrapping !== undefined ? originalImage.wrapping : 1000

                  splineLog(`[Spline3D] ✓ Replaced image data for layer ${i} (${label}): ${imageElement.width}x${imageElement.height}, kept original transforms`)

                  // CRITICAL: Mark the texture itself as needing update
                  if (layer.texture.needsUpdate !== undefined) {
                    layer.texture.needsUpdate = true
                    splineLog(`[Spline3D] ✓ Marked texture as needsUpdate`)
                  }

                  // Also try to mark the image as needing update if it has that property
                  if (layer.texture.image.needsUpdate !== undefined) {
                    layer.texture.image.needsUpdate = true
                    splineLog(`[Spline3D] ✓ Marked texture.image as needsUpdate`)
                  }

                  // Update texture matrix if the properties changed
                  if (layer.texture.updateMatrix) {
                    layer.texture.updateMatrix()
                    splineLog(`[Spline3D] ✓ Updated texture matrix`)
                  } else if (layer.texture.matrixNeedsUpdate !== undefined) {
                    layer.texture.matrixNeedsUpdate = true
                    splineLog(`[Spline3D] ✓ Marked texture matrix as needsUpdate`)
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
                      splineLog(`[Spline3D] ✓ Forced additional render after texture update`)
                    }
                  }, 100)

                  // Capture projection/axis for Side B to match (avoids layout mismatch)
                  if (opts?.captureLayer && 'projection' in layer && 'axis' in layer) {
                    opts.captureLayer.projection = layer.projection
                    opts.captureLayer.axis = layer.axis
                    splineLog(`[Spline3D] Captured layer layout for Side B: projection=${layer.projection}, axis=${layer.axis}`)
                  }

                  splineLog(`[Spline3D] ✓ REPLACED texture.image and updated material for layer ${i}`)
                  updatedLayers++

                  // Continue to next layer instead of returning immediately
                } else {
                  // Fallback to other approaches for layers without texture.image
                  layer.image = imageElement
                  if (layer.map !== undefined) layer.map = imageElement
                  if (layer.texture !== undefined) layer.texture = imageElement
                  splineLog(`[Spline3D] Used fallback approach for layer ${i}`)

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

                  splineLog(`[Spline3D] ✓ Used fallback approach and updated material for layer ${i}`)
                  updatedLayers++
                }
              } catch (e) {
                splineWarn(`[Spline3D] Approach 1a failed for image layer ${i}:`, e)
              }
            }
          }

          // If we updated any layers in the first pass, return success
          if (updatedLayers > 0) {
            splineLog(`[Spline3D] ✓ Successfully updated ${updatedLayers} texture layers for ${label}`)
            return true
          }

          // Second pass: Try texture/matcap layers if no image layer found
          for (let i = 0; i < material.layers.length; i++) {
            const layer = material.layers[i]
            if (layer.type === 'texture' || layer.type === 'matcap') {
              try {
                splineLog(`[Spline3D] Attempting to update existing ${layer.type} layer ${i} for ${label}`, {
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
                  splineLog(`[Spline3D] ✓ Set texture.image data for ${layer.type} layer ${i}`)
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

                splineLog(`[Spline3D] ✓ Approach 1b: Updated existing ${layer.type} layer ${i} for ${label}`, {
                  layerVisible: layer.visible,
                  layerAlpha: layer.alpha
                })
                return true
              } catch (e) {
                splineWarn(`[Spline3D] Approach 1b failed for layer ${i}:`, e)
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
            
            splineLog(`[Spline3D] ✓ Approach 2: Pushed new image layer to layers array for ${label}`, {
              layerIndex: 0,
              totalLayers: material.layers.length,
              layerProperties: Object.keys(newLayer)
            })
            return true
          } catch (e) {
            splineWarn(`[Spline3D] Approach 2 failed:`, e)
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
              splineLog(`[Spline3D] ✓ Approach 3: Added image layer via addLayer() for ${label}`)
              return true
            }
          } catch (e) {
            splineWarn(`[Spline3D] Approach 3 failed:`, e)
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
              splineLog(`[Spline3D] ✓ Approach 4: Created layer via app.createLayer() for ${label}`)
              return true
            }
          } catch (e) {
            splineWarn(`[Spline3D] Approach 4 failed:`, e)
          }
        }

        // Approach 5: Try to modify material directly
        try {
          // Try setting image on material itself
          if (material.setImage) {
            material.setImage(imageElement)
            material.needsUpdate = true
            splineLog(`[Spline3D] ✓ Approach 5: Set image via material.setImage() for ${label}`)
            return true
          }
        } catch (e) {
          splineWarn(`[Spline3D] Approach 5 failed:`, e)
        }

        splineWarn(`[Spline3D] All approaches failed to add image layer for ${label}`)
        return false
      } catch (err) {
        splineError(`[Spline3D] Error adding image layer to ${label}:`, err)
        return false
      }
    }

    // Discover panel objects (cached after first successful find)
    const panels = discoverPanels()
    onPanelsFound?.({
      sideA: !!panels.sideA,
      sideB: !!panels.sideB,
      sameObject: panels.sideA === panels.sideB && !!panels.sideA,
    })

    const objA = panels.sideA
    const objB = panels.sideB
    const imgA = swapLampSides ? image2 : image1
    const imgB = swapLampSides ? image1 : image2

    const flipA = flipForSide === 'A' || flipForSide === 'both'
    const flipBResolved = flipForSideB ?? (flipForSide === 'B' || flipForSide === 'both')

    const sideALayerLayout = { projection: undefined as number | undefined, axis: undefined as string | undefined }
    if (imgA && objA) {
      side1ObjectRef.current = objA
      const success = await addImageLayerToMaterial(objA, imgA, "Side A", flipA ? 'horizontal' : 'none', posA, {
        captureLayer: sideALayerLayout,
      })
      splineLog(`[Spline3D] Side A texture: ${success ? '✓' : '✗'}`)
    } else {
      side1ObjectRef.current = null
      if (imgA) splineWarn(`[Spline3D] Side A object not found or has no material`)
    }

    const sideBLayerOverrides: LayerOverrides =
      sideALayerLayout.projection !== undefined && sideALayerLayout.axis !== undefined
        ? { projection: sideALayerLayout.projection, axis: sideALayerLayout.axis }
        : null

    if (imgB && objB) {
      side2ObjectRef.current = objB
      const success = await addImageLayerToMaterial(objB, imgB, "Side B", flipBResolved, posB, {
        layerOverrides: sideBLayerOverrides,
      })
      splineLog(`[Spline3D] Side B texture: ${success ? '✓' : '✗'}`)
    } else {
      side2ObjectRef.current = null
      if (imgB) splineWarn(`[Spline3D] Side B object not found or has no material`)
    }

    // Force render
    if (app.renderer && scene && app.camera && typeof app.renderer.render === "function") {
      app.renderer.render(scene, app.camera)
    }
  }, [image1, image2, side1ObjectId, side2ObjectId, side1ObjectName, side2ObjectName, isLoading, onPanelsFound, swapLampSides, flipForSide, flipForSideB, imageScale, imageOffsetX, imageOffsetY, imageScaleX, imageScaleY, imageScaleB, imageOffsetXB, imageOffsetYB, imageScaleXB, imageScaleYB])

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
      const app = new Application(canvas, { renderMode: 'continuous' })

      app.load(SCENE_PATH)
        .then(() => {
          splineAppRef.current = app
          const bgTheme = previewTheme ?? lampVariant
          const hex = bgTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
          if (typeof (app as any).setBackgroundColor === 'function') {
            ;(app as any).setBackgroundColor(hex)
          } else {
            const scene = (app as any).scene || (app as any)._scene
            setSceneBackground(scene, hex, app)
          }
          // Enable slight zoom on preview: find orbit controls and constrain zoom range
          try {
            const a = app as any
            const controls = a.controls || a._controls || a.orbitControls || a.cameraControls ||
              (a.manager && (a.manager.controls || a.manager._controls)) ||
              (a._manager && (a._manager.controls || a._manager._controls))
            const cam = a.camera
            if (controls && cam) {
              if (typeof controls.enableZoom === 'boolean') controls.enableZoom = true
              if (controls.getDistance && typeof controls.getDistance === 'function') {
                const d = controls.getDistance()
                const minD = Math.max(1, d * 0.88)
                const maxD = d * 1.02
                if (controls.minDistance !== undefined) controls.minDistance = minD
                if (controls.maxDistance !== undefined) controls.maxDistance = maxD
              }
            }
          } catch (_) { /* camera controls unavailable */ }
          setTimeout(() => {
            setIsLoading(false)
            
            // Search entire scene for all objects (for toggling)
            const searchEntireSceneForObjects = (): ObjectInfo[] => {
              const app = splineAppRef.current as any
              if (!app) return []
              
              splineLog("[Spline3D] ===== SEARCHING ENTIRE SCENE FOR ALL OBJECTS =====")
              
              const allObjectsInfo: ObjectInfo[] = []
              const scene = app.scene || app._scene
              
              if (!scene) {
                splineWarn("[Spline3D] Scene not available")
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
                    splineLog(`[Spline3D] Found ${objects.length} objects via getAllObjects()`)
                  }
                } catch (e) {
                  splineWarn("[Spline3D] getAllObjects() failed:", e)
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
              
              splineLog(`[Spline3D] Found ${allObjectsInfo.length} objects in entire scene`)
              splineLog("[Spline3D] ===== END OBJECT SEARCH =====")
              
              return allObjectsInfo
            }
            
            // Search entire scene for all objects with images
            const searchEntireSceneForImages = () => {
              const app = splineAppRef.current as any
              if (!app) return []
              
              splineLog("[Spline3D] ===== SEARCHING ENTIRE SCENE FOR IMAGES =====")
              
              const allLayers: LayerInfo[] = []
              const scene = app.scene || app._scene
              
              if (!scene) {
                splineWarn("[Spline3D] Scene not available")
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
                    splineLog(`[Spline3D] Found ${objects.length} objects via getAllObjects()`)
                  }
                } catch (e) {
                  splineWarn("[Spline3D] getAllObjects() failed:", e)
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
                    splineLog(`[Spline3D] Found direct image on: ${currentPath}`, {
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
                        splineLog(`[Spline3D] Found image in layer on: ${currentPath}`, {
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
              
              splineLog(`[Spline3D] Found ${allLayers.length} image sources in entire scene`)
              splineLog(`[Spline3D] Processed ${processedObjects.size} unique objects`)
              splineLog("[Spline3D] ===== END SCENE SEARCH =====")
              
              return allLayers
            }
            
            // Inspect PC material layers (returns layers, doesn't set state)
            const inspectPCMaterials = (): LayerInfo[] => {
              const app = splineAppRef.current as any
              if (!app) return []
              
              splineLog("[Spline3D] ===== INSPECTING PC MATERIALS =====")
              
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
                  splineWarn(`[Spline3D] ${name} object not found`)
                  return
                }
                
                splineLog(`[Spline3D] --- ${name} Material Inspection ---`)
                splineLog(`[Spline3D] Object found:`, {
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
                  splineWarn(`[Spline3D] No material found on ${name}`)
                  return
                }
                
                splineLog(`[Spline3D] Material found:`, {
                  type: material.type,
                  name: material.name,
                  uuid: material.uuid,
                  hasLayers: !!material.layers,
                  layersCount: material.layers?.length
                })
                
                // Check for direct image/texture on material (not in layers)
                splineLog(`[Spline3D] Checking direct material properties for images:`, {
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
                  splineLog(`[Spline3D] Checking mesh material for images:`, {
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
                          splineLog(`[Spline3D] Found child object ${childIdx} of ${parentName} with material:`, {
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
                  splineLog(`[Spline3D] Total layers: ${material.layers.length}`)
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
                    
                    splineLog(`[Spline3D] Layer ${index}:`, layerInfo)
                    
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
                        splineLog(`[Spline3D]   → ${layer.type.toUpperCase()} LAYER HAS IMAGE:`, {
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
                      splineLog(`[Spline3D]   → IMAGE LAYER DETAILS:`, {
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
                  splineWarn(`[Spline3D] Material has no layers array`)
                }
                
                splineLog(`[Spline3D] --- End ${name} Inspection ---\n`)
              })
              
              splineLog("[Spline3D] ===== END PC MATERIAL INSPECTION =====")
              splineLog(`[Spline3D] Found ${allLayers.length} layers in PC materials`)
              
              return allLayers
            }
            
            // Helper function to inspect material layers of a specific object
            const inspectObjectMaterial = (obj: any, objectName: string): LayerInfo[] => {
              splineLog(`[Spline3D] Inspecting material for ${objectName}:`, {
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
                splineWarn(`[Spline3D] No material found on ${objectName}`)
                return []
              }

              splineLog(`[Spline3D] Material found for ${objectName}:`, {
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

                  splineLog(`[Spline3D] ${objectName} Layer ${index}:`, layerInfo)

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
                    splineLog(`[Spline3D]   → FOUND IMAGE DATA IN ${objectName} LAYER ${index}:`, {
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

              splineLog(`[Spline3D] Found ${layers.length} layers on ${objectName}`)
              return layers
            }

            // Find and inspect PC Trans B object specifically
            const inspectPcTransB = (): LayerInfo[] => {
              const app = splineAppRef.current as any
              if (!app) return []

              splineLog("[Spline3D] ===== INSPECTING PC TRANS B OBJECT =====")

              // Try to find by ID first (from scene search results)
              const pcTransBId = "2e33392b-21d8-441d-87b0-11527f3a8b70"
              if (app.findObjectById) {
                const obj = app.findObjectById(pcTransBId)
                if (obj) {
                  splineLog(`[Spline3D] Found PC Trans B object by ID: ${pcTransBId}`)
                  return inspectObjectMaterial(obj, "PC Trans B")
                }
              }

              // Fallback: try to find by name
              if (app.findObjectByName) {
                const obj = app.findObjectByName("PC Trans B")
                if (obj) {
                  splineLog(`[Spline3D] Found PC Trans B object by name`)
                  return inspectObjectMaterial(obj, "PC Trans B")
                }
              }

              splineWarn(`[Spline3D] PC Trans B object not found by ID or name, trying path traversal`)

              const scene = app.scene || app._scene
              if (!scene) {
                splineWarn("[Spline3D] Scene not available")
                return []
              }

              // Path: Scene > Scene > White > Assembly Small Lamp 2025 v62 > Panel Side B > PC Trans B
              const path = ["Scene", "White", "Assembly Small Lamp 2025 v62", "Panel Side B", "PC Trans B"]

              let currentObj: any = scene
              for (const pathSegment of path) {
                if (!currentObj) {
                  splineWarn(`[Spline3D] Could not find path segment: ${pathSegment}`)
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
                    splineWarn(`[Spline3D] Could not find path segment: ${pathSegment}`)
                    return []
                  }
                } else {
                  splineWarn(`[Spline3D] Could not find path segment: ${pathSegment}`)
                  return []
                }
              }
              
              if (!currentObj) {
                splineWarn(`[Spline3D] PC Trans B object not found`)
                return []
              }
              
              splineLog(`[Spline3D] Found PC Trans B object:`, {
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
                splineWarn(`[Spline3D] No material found on PC Trans B`)
                return []
              }
              
              splineLog(`[Spline3D] PC Trans B material:`, {
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

                  splineLog(`[Spline3D] PC Trans B Layer ${index}:`, layerInfo)

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
                      splineLog(`[Spline3D]   → FOUND IMAGE DATA IN LAYER ${index}:`, {
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
              
              splineLog(`[Spline3D] Found ${layers.length} layers on PC Trans B`)
              splineLog("[Spline3D] ===== END PC TRANS B INSPECTION =====")
              
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
              
              splineLog(`[Spline3D] Total objects found: ${allObjects.length}`)
              splineLog(`[Spline3D] Total layers found: ${allLayers.length} (${sceneLayers.length} from scene search, ${pcLayers.length} from PC inspection)`)
            }, 500)
            
            // Update textures after initialization
            setTimeout(() => {
              updateTextures()
            }, 1000)
          }, 1000)
        })
        .catch((err) => {
          splineError("[Spline3D] Error loading scene:", err)
          setError(`Failed to load 3D scene: ${err.message || err}`)
          setIsLoading(false)
        })
    } catch (err: any) {
      splineError("[Spline3D] Error initializing Spline:", err)
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
          splineError("[Spline3D] Error disposing scene:", err)
        }
        splineAppRef.current = null
        discoveredPanelsRef.current = { sideA: null, sideB: null }
      }
    }
  }, [])

  useEffect(() => {
    if (splineAppRef.current && !isLoading) {
      updateTextures()
    }
  }, [image1, image2, isLoading, updateTextures])

  const applyPointLightOverrides = useCallback(() => {
    const app = splineAppRef.current as any
    if (!app) return
    const scene = app.scene || app._scene
    if (!scene) return
    if (pointLightIntensity === undefined && !pointLightPosition && pointLightDistance === undefined) return

    const pointLights: any[] = []
    const traverse = (node: any) => {
      if (!node) return
      if (node.isPointLight || node.type === 'PointLight') {
        pointLights.push(node)
      }
      for (const c of node.children || []) traverse(c)
    }
    traverse(scene)

    pointLights.forEach((light) => {
      if (pointLightIntensity !== undefined) light.intensity = pointLightIntensity
      if (pointLightPosition) {
        if (pointLightPosition.x !== undefined) light.position.x = pointLightPosition.x
        if (pointLightPosition.y !== undefined) light.position.y = pointLightPosition.y
        if (pointLightPosition.z !== undefined) light.position.z = pointLightPosition.z
      }
      if (pointLightDistance !== undefined) light.distance = pointLightDistance
    })

    if (app.update && typeof app.update === 'function') app.update()
    if (app.renderer && app.scene && app.camera) app.renderer.render(app.scene, app.camera)
  }, [pointLightIntensity, pointLightPosition, pointLightDistance])

  useEffect(() => {
    if (!splineAppRef.current || isLoading) return
    applyPointLightOverrides()
    if (!splineAppRef.current || isLoading) return
    applyPointLightOverrides()
  }, [pointLightIntensity, pointLightPosition, pointLightDistance, isLoading, applyPointLightOverrides])

  // Sync Spline background — use previewTheme when provided, else lampVariant
  const sceneBgTheme = previewTheme ?? lampVariant
  const setBackgroundFromVariant = useCallback(() => {
    const app = splineAppRef.current
    if (!app || isLoading) return
    const hex = sceneBgTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
    if (typeof (app as any).setBackgroundColor === 'function') {
      ;(app as any).setBackgroundColor(hex)
    } else {
      const scene = (app as any).scene || (app as any)._scene
      setSceneBackground(scene, hex, app)
    }
  }, [sceneBgTheme, isLoading])

  useEffect(() => {
    setBackgroundFromVariant()
  }, [sceneBgTheme, isLoading, setBackgroundFromVariant])

  // Cursor-following or subtle rotation (when animate=true)
  const cursorTargetRef = useRef({ x: 0, y: 0 })
  const cursorCurrentRef = useRef({ x: 0, y: 0 })
  const isPointerOverRef = useRef(false)

  useEffect(() => {
    if (!animate || isLoading || error) return

    const app = splineAppRef.current as any
    if (!app) return
    const scene = app.scene || app._scene
    if (!scene) return

    const lampNames = ['Assembly Small Lamp 2025 v62', 'Assembly Small Lamp', 'Assembly', 'Lamp', 'White', 'Black']
    let target: any = null
    for (const name of lampNames) {
      const obj = app.findObjectByName?.(name)
      if (obj) { target = obj; break }
    }
    if (!target && scene.children?.length > 0) {
      const first = scene.children.find((c: any) => c.type !== 'Camera' && c.name)
      target = first || scene
    }
    if (!target) target = scene

    const rotatable = (target?.rotation && target) || (target?.mesh?.rotation && target.mesh) || target?.object3D || target
    if (!rotatable?.rotation) return

    const container = containerRef.current
    const maxYaw = 0.5
    const maxPitch = 0.08
    const turntableSpeed = 0.003

    const handleMouseMove = (e: MouseEvent) => {
      if (!container || !interactive) return
      isPointerOverRef.current = true
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      cursorTargetRef.current = { x: (x - 0.5) * 2, y: (y - 0.5) * 2 }
    }
    const handleMouseLeave = () => {
      isPointerOverRef.current = false
      cursorTargetRef.current = { x: 0, y: 0 }
    }
    const handleTouchStart = () => {
      if (!container || !interactive) return
      isPointerOverRef.current = true
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (!container || !interactive) return
      const touch = e.touches[0]
      if (!touch) return
      isPointerOverRef.current = true
      const rect = container.getBoundingClientRect()
      const x = (touch.clientX - rect.left) / rect.width
      const y = (touch.clientY - rect.top) / rect.height
      cursorTargetRef.current = { x: (x - 0.5) * 2, y: (y - 0.5) * 2 }
    }
    const handleTouchEnd = () => {
      isPointerOverRef.current = false
      cursorTargetRef.current = { x: 0, y: 0 }
    }

    if (interactive && container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseleave', handleMouseLeave)
      container.addEventListener('touchstart', handleTouchStart, { passive: true })
      container.addEventListener('touchmove', handleTouchMove, { passive: true })
      container.addEventListener('touchend', handleTouchEnd)
      container.addEventListener('touchcancel', handleTouchEnd)
    }

    let rafId: number
    const tick = () => {
      const rot = rotatable.rotation
      if (interactive && isPointerOverRef.current) {
        const t = cursorTargetRef.current
        const c = cursorCurrentRef.current
        const lerpFactor = 0.08
        c.x += (t.x - c.x) * lerpFactor
        c.y += (t.y - c.y) * lerpFactor
        rot.y = c.x * maxYaw
        rot.x = -c.y * maxPitch
      } else {
        rot.y += turntableSpeed
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      if (interactive && container) {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseleave', handleMouseLeave)
        container.removeEventListener('touchstart', handleTouchStart)
        container.removeEventListener('touchmove', handleTouchMove)
        container.removeEventListener('touchend', handleTouchEnd)
        container.removeEventListener('touchcancel', handleTouchEnd)
      }
      cancelAnimationFrame(rafId)
    }
  }, [animate, interactive, isLoading, error])

  if (minimal) {
    const bgTheme = previewTheme ?? lampVariant
    const bgHex = bgTheme === 'light' ? '#F5F5F5' : '#1A1A1A'
    const loadingFg = bgTheme === 'light' ? 'text-neutral-500' : 'text-white/50'
    const spinBorder = bgTheme === 'light' ? 'border-neutral-400 border-t-neutral-600' : 'border-white/30 border-t-white'
    return (
      <div ref={containerRef} className={cn(className, "relative w-full h-full cursor-grab active:cursor-grabbing")}>
        {/* Background layer - ensures toggle changes color even if WebGL overrides */}
        <div
          className="absolute inset-0 -z-10"
          style={{ backgroundColor: bgHex }}
          aria-hidden
        />
        {isLoading && !error && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ backgroundColor: bgHex }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={cn("w-6 h-6 border-2 rounded-full animate-spin", spinBorder)} />
              <p className={cn("text-xs", loadingFg)}>Loading 3D preview…</p>
            </div>
          </div>
        )}
        {error && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6"
            style={{ backgroundColor: bgHex }}
          >
            {image1 && (
              <img
                src={image1}
                alt="Artwork preview"
                className="w-48 h-48 object-contain rounded-lg mb-4 opacity-80"
              />
            )}
            <p className={cn("text-sm text-center max-w-xs", bgTheme === 'light' ? 'text-neutral-600' : 'text-white/60')}>
              3D preview unavailable — {error.includes('fetch') ? 'check your connection and refresh' : error}
            </p>
            <button
              onClick={() => { setError(null); setIsLoading(true); }}
              className={cn(
                "mt-3 px-4 py-1.5 text-xs font-medium rounded-full transition-colors",
                bgTheme === 'light'
                  ? "bg-neutral-800 hover:bg-neutral-700 text-white"
                  : "bg-white/10 hover:bg-white/20 text-white"
              )}
            >
              Retry
            </button>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            backgroundColor: bgHex,
          }}
          width={800}
          height={600}
        />
      </div>
    )
  }

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
