"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Image as ImageIcon, Upload, X, GripVertical, Video, Film } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageMaskEditor } from "./image-mask-editor"
import type { ProductSubmissionData, ProductImage } from "@/types/product-submission"

interface ImagesStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
  onMaskSavedStatusChange?: (isSaved: boolean) => void // Callback to notify parent of mask saved status
}

interface VendorImage {
  url: string
  path: string
  name: string
  created_at?: string
  size?: number
}

export function ImagesStep({ formData, setFormData, onMaskSavedStatusChange }: ImagesStepProps) {
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [vendorImages, setVendorImages] = useState<VendorImage[]>([])
  const [showImageLibrary, setShowImageLibrary] = useState(false)
  const [loadingImages, setLoadingImages] = useState(false)
  const [maskSaved, setMaskSaved] = useState(false)
  const [selectedLibraryImages, setSelectedLibraryImages] = useState<Map<string, { vendorImage: VendorImage; order: number }>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragOverIndex = useRef<number | null>(null)

  const images = formData.images || []

  // Fetch vendor's past images
  useEffect(() => {
    const fetchVendorImages = async () => {
      setLoadingImages(true)
      try {
        const response = await fetch("/api/vendor/products/images", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setVendorImages(data.images || [])
        }
      } catch (error) {
        console.error("Error fetching vendor images:", error)
      } finally {
        setLoadingImages(false)
      }
    }
    fetchVendorImages()
  }, [])

  const handleFileUpload = async (file: File) => {
    // Validate file type - support images and videos
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    
    if (!isImage && !isVideo) {
      alert("Please select an image or video file (JPG, PNG, GIF, MP4, MOV, etc.)")
      return
    }

    // Validate file size (10MB max for images, 50MB max for videos)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
    const maxSizeLabel = isImage ? "10MB" : "50MB"
    
    if (file.size > maxSize) {
      alert(`${isImage ? 'Image' : 'Video'} file is too large. Maximum size is ${maxSizeLabel}. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`)
      return
    }

    setUploading(true)

    try {
      console.log(`[Upload] Starting upload for file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      
      // Upload via server-side route (uses service role key, bypasses RLS)
      const uploadStartTime = Date.now()
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", isImage ? "image" : "video")

      const uploadResponse = await fetch("/api/vendor/products/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      const uploadDuration = Date.now() - uploadStartTime
      console.log(`[Upload] Upload request completed in ${uploadDuration}ms (${(uploadDuration / 1000).toFixed(2)}s)`)

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: "Unknown error" }))
        console.error(`[Upload] Upload failed:`, errorData)
        throw new Error(errorData.error || errorData.message || "Failed to upload file")
      }

      const uploadData = await uploadResponse.json()
      console.log(`[Upload] Upload successful! Public URL: ${uploadData.url}`)

      // Add image or video to the list
      const newImage: ProductImage = {
        src: uploadData.url,
        alt: "",
        position: images.length + 1,
        mediaType: isImage ? 'image' : 'video',
      }
      setFormData({ ...formData, images: [...images, newImage] })

      // Refresh vendor images list
      const imagesResponse = await fetch("/api/vendor/products/images", {
        credentials: "include",
      })
      if (imagesResponse.ok) {
        const imagesData = await imagesResponse.json()
        setVendorImages(imagesData.images || [])
      }
    } catch (error: any) {
      console.error("Error uploading image:", error)
      alert(error.message || "Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  // Multi-select library images with ordering
  const toggleLibraryImageSelection = (vendorImage: VendorImage) => {
    const imageKey = vendorImage.url
    const newSelected = new Map(selectedLibraryImages)
    
    if (newSelected.has(imageKey)) {
      newSelected.delete(imageKey)
    } else {
      // Get the highest order number from current selections, or use current images length
      const maxOrder = Math.max(
        ...Array.from(newSelected.values()).map(v => v.order),
        images.length,
        0
      )
      newSelected.set(imageKey, {
        vendorImage,
        order: maxOrder + 1,
      })
    }
    setSelectedLibraryImages(newSelected)
  }

  const updateLibraryImageOrder = (imageKey: string, order: number) => {
    const entry = selectedLibraryImages.get(imageKey)
    if (entry) {
      const newSelected = new Map(selectedLibraryImages)
      newSelected.set(imageKey, { ...entry, order: Math.max(1, order) })
      setSelectedLibraryImages(newSelected)
    }
  }

  const handleAcceptLibraryImages = () => {
    if (selectedLibraryImages.size === 0) {
      alert("Please select at least one image")
      return
    }

    // Sort selected images by order number
    const sortedSelections = Array.from(selectedLibraryImages.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([_, { vendorImage, order }]) => ({ vendorImage, order }))

    // Create ProductImage objects
    const newImages: ProductImage[] = sortedSelections.map(({ vendorImage, order }) => ({
      src: vendorImage.url,
      alt: "",
      position: order,
      mediaType: 'image' as const,
    }))

    // If there are existing images, merge them
    const existingImages = images.filter(img => 
      !newImages.some(newImg => newImg.src === img.src)
    )

    // Combine and reindex all images
    const allImages = [...newImages, ...existingImages].map((img, index) => ({
      ...img,
      position: index + 1,
    }))

    setFormData({ ...formData, images: allImages })
    setSelectedLibraryImages(new Map())
    setShowImageLibrary(false)
    // Reset mask saved status since we're adding a new artwork image
    setMaskSaved(false)
    if (onMaskSavedStatusChange) {
      onMaskSavedStatusChange(false)
    }
  }

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    // Reindex positions
    updatedImages.forEach((img, i) => {
      img.position = i + 1
    })
    setFormData({ ...formData, images: updatedImages })
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragOverIndex.current = index
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      dragOverIndex.current = null
      return
    }

    const updatedImages = [...images]
    const draggedImage = updatedImages[draggedIndex]
    updatedImages.splice(draggedIndex, 1)
    updatedImages.splice(dropIndex, 0, draggedImage)

    // Reindex positions
    updatedImages.forEach((img, i) => {
      img.position = i + 1
    })

    setFormData({ ...formData, images: updatedImages })
    setDraggedIndex(null)
    dragOverIndex.current = null
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    dragOverIndex.current = null
  }

  // Throttled update mask settings to prevent excessive re-renders
  const maskUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingMaskSettingsRef = useRef<ProductImage["maskSettings"] | null>(null)
  
  const updateMaskSettings = (maskSettings: ProductImage["maskSettings"]) => {
    console.log("[ImagesStep] updateMaskSettings called", {
      timestamp: new Date().toISOString(),
      maskSettings,
      hasPendingUpdate: !!maskUpdateTimeoutRef.current,
    })
    
    // Store the latest settings
    pendingMaskSettingsRef.current = maskSettings
    
    // Clear any pending update
    if (maskUpdateTimeoutRef.current) {
      clearTimeout(maskUpdateTimeoutRef.current)
    }
    
    // Throttle updates - only update parent after user stops adjusting
    maskUpdateTimeoutRef.current = setTimeout(() => {
      if (images.length > 0 && pendingMaskSettingsRef.current) {
        console.log("[ImagesStep] Applying mask settings update")
        const updatedImages = [...images]
        updatedImages[0] = { ...updatedImages[0], maskSettings: pendingMaskSettingsRef.current }
        setFormData((prev) => ({ 
          ...prev, 
          images: updatedImages 
        }))
        pendingMaskSettingsRef.current = null
      }
    }, 200) // Wait 200ms after user stops adjusting before updating parent
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (maskUpdateTimeoutRef.current) {
        clearTimeout(maskUpdateTimeoutRef.current)
      }
    }
  }, [])

  // Handle masked image saved callback - uploads base64 image to storage and updates the first image
  const handleMaskSaved = useCallback(async (maskedImageBase64: string) => {
    if (images.length > 0) {
      console.log("[ImagesStep] Masked image saved, uploading to storage...")
      
      // Check if it's already a URL (not base64)
      if (!maskedImageBase64.startsWith("data:image/")) {
        // Already a URL, use it directly
        const updatedImages = [...images]
        updatedImages[0] = {
          ...updatedImages[0],
          src: maskedImageBase64,
          maskSettings: updatedImages[0].maskSettings,
        }
        setFormData({ ...formData, images: updatedImages })
        setMaskSaved(true)
        if (onMaskSavedStatusChange) {
          onMaskSavedStatusChange(true)
        }
        console.log("[ImagesStep] First image updated with masked image URL")
        return
      }

      // Upload base64 image to storage
      try {
        const base64Data = maskedImageBase64.split(",")[1]
        const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob())
        const file = new File([blob], "masked-artwork.png", { type: "image/png" })
        
        // Upload via server-side route
        const uploadFormData = new FormData()
        uploadFormData.append("file", file)
        uploadFormData.append("type", "image")

        const uploadResponse = await fetch("/api/vendor/products/upload", {
          method: "POST",
          credentials: "include",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(errorData.error || errorData.message || "Failed to upload masked image")
        }

        const uploadData = await uploadResponse.json()
        console.log("[ImagesStep] Masked image uploaded to storage:", uploadData.url)

        // Update first image with uploaded URL
        const updatedImages = [...images]
        updatedImages[0] = {
          ...updatedImages[0],
          src: uploadData.url,
          maskSettings: updatedImages[0].maskSettings, // Keep mask settings for reference
        }
        setFormData({ ...formData, images: updatedImages })
        setMaskSaved(true) // Mark mask as saved
        if (onMaskSavedStatusChange) {
          onMaskSavedStatusChange(true)
        }
        console.log("[ImagesStep] First image updated with masked image URL")
      } catch (error: any) {
        console.error("[ImagesStep] Error uploading masked image:", error)
        alert(error.message || "Failed to upload masked image. Please try again.")
        setMaskSaved(false)
        if (onMaskSavedStatusChange) {
          onMaskSavedStatusChange(false)
        }
      }
    }
  }, [images, formData, setFormData, onMaskSavedStatusChange])

  // Reset mask saved status when artwork image changes (but preserve if it's a saved masked image)
  useEffect(() => {
    if (images.length > 0 && images[0]?.src) {
      const firstImage = images[0]
      // Check if this is a saved masked image (URL contains "masked_artwork" or has maskSettings)
      const isSavedMaskedImage = firstImage.src.includes('masked_artwork') || 
                                  firstImage.src.includes('masked') ||
                                  firstImage.maskSettings
      // Check if it's a base64 data URL (being edited)
      const isBase64Masked = firstImage.src.startsWith('data:image/')
      
      // Only reset if the image changed AND it's not a saved masked image
      // If it's a saved masked image URL, keep maskSaved as true
      if (!isBase64Masked && !isSavedMaskedImage && maskSaved) {
        // Image changed to something that's not a masked image
        setMaskSaved(false)
        if (onMaskSavedStatusChange) {
          onMaskSavedStatusChange(false)
        }
      } else if (isSavedMaskedImage && !maskSaved) {
        // Image is a saved masked image but maskSaved is false - fix it
        setMaskSaved(true)
        if (onMaskSavedStatusChange) {
          onMaskSavedStatusChange(true)
        }
      }
    } else if (maskSaved) {
      // No images, but maskSaved is true - reset it
      setMaskSaved(false)
      if (onMaskSavedStatusChange) {
        onMaskSavedStatusChange(false)
      }
    }
  }, [images, maskSaved, onMaskSavedStatusChange])

  const firstImage = images.length > 0 ? images[0] : null

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Artwork Preview Images</h3>
        <p className="text-sm text-muted-foreground">
          Upload preview images or videos that customers will see on the product page. The first image will be used as the main artwork preview with mask positioning.
        </p>
      </div>

      {/* Upload Button */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full sm:w-auto"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Preview Images"}
        </Button>
        <Dialog open={showImageLibrary} onOpenChange={setShowImageLibrary}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              <ImageIcon className="h-4 w-4 mr-2" />
              Select from Library
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Images from Library</DialogTitle>
              <DialogDescription>
                Select multiple images and set their order. The first selected image will become the artwork image for the mask.
              </DialogDescription>
            </DialogHeader>
            {loadingImages ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading images...</p>
              </div>
            ) : vendorImages.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No images found in your library</p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {/* Selected Images Summary */}
                {selectedLibraryImages.size > 0 && (
                  <div className="bg-muted p-4 rounded-lg border">
                    <div className="text-sm font-semibold mb-2">
                      Selected Images ({selectedLibraryImages.size})
                    </div>
                    <div className="space-y-2">
                      {Array.from(selectedLibraryImages.entries())
                        .sort((a, b) => a[1].order - b[1].order)
                        .map(([url, { vendorImage, order }]) => (
                          <div key={url} className="flex items-center gap-3 p-2 bg-background rounded">
                            <img
                              src={vendorImage.url}
                              alt={vendorImage.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1 text-sm">{vendorImage.name}</div>
                            <Label className="text-xs">Order:</Label>
                            <Input
                              type="number"
                              min="1"
                              value={order}
                              onChange={(e) => {
                                const newOrder = parseInt(e.target.value) || 1
                                updateLibraryImageOrder(url, newOrder)
                              }}
                              className="w-20 h-8"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLibraryImageSelection(vendorImage)}
                              className="h-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Image Grid */}
                <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                  {vendorImages.map((vendorImage, index) => {
                    const isSelected = selectedLibraryImages.has(vendorImage.url)
                    const order = selectedLibraryImages.get(vendorImage.url)?.order
                    return (
                      <div
                        key={index}
                        className={`relative group cursor-pointer border-2 rounded-md overflow-hidden aspect-square bg-muted transition-all ${
                          isSelected ? 'border-primary ring-2 ring-primary' : 'border-border'
                        }`}
                        onClick={() => toggleLibraryImageSelection(vendorImage)}
                      >
                        <img
                          src={vendorImage.url}
                          alt={vendorImage.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                              {order}
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-primary border-primary' : 'bg-background border-foreground/20'
                          }`}>
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    )
                  })}
                </div>

                {/* Accept Button */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedLibraryImages(new Map())
                      setShowImageLibrary(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAcceptLibraryImages}
                    disabled={selectedLibraryImages.size === 0}
                  >
                    Accept {selectedLibraryImages.size > 0 && `(${selectedLibraryImages.size})`}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            files.forEach((file) => handleFileUpload(file))
          }}
        />
      </div>

      {/* Image Grid - Shopify Style */}
      {images.length > 0 && (
        <div className="space-y-4">
          {/* Artwork Image - Smaller Display with Mask */}
          {firstImage && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Artwork Image</Label>
                  <p className="text-xs text-muted-foreground">
                    Position your image within the mask frame. Click "Save Masked Image" when you're ready to apply the mask.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(0)}
                  className="min-w-[44px] min-h-[44px]"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="w-3/4 max-w-md">
                  <ImageMaskEditor
                    image={firstImage}
                    onUpdate={updateMaskSettings}
                    onMaskSaved={handleMaskSaved}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Additional Media - Images and Videos */}
          {images.length > 1 && (
            <div>
              <Label className="text-base font-semibold mb-3 block">Additional Images & Videos</Label>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {images.slice(1).map((image, index) => {
                  const actualIndex = index + 1
                  return (
                    <div
                      key={actualIndex}
                      draggable
                      onDragStart={() => handleDragStart(actualIndex)}
                      onDragOver={(e) => handleDragOver(e, actualIndex)}
                      onDrop={(e) => handleDrop(e, actualIndex)}
                      onDragEnd={handleDragEnd}
                      className={`relative group border rounded-md overflow-hidden aspect-square bg-muted cursor-move ${
                        draggedIndex === actualIndex ? "opacity-50" : ""
                      } ${dragOverIndex.current === actualIndex ? "ring-2 ring-primary" : ""}`}
                    >
                      {image.mediaType === 'video' ? (
                        <video
                          src={image.src}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={image.src}
                          alt={image.alt || `Image ${actualIndex + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      )}
                      {/* Media Type Badge */}
                      {image.mediaType === 'video' && (
                        <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                          <Video className="h-3 w-3" />
                        </div>
                      )}
                      {/* Drag Handle */}
                      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/50 rounded p-1">
                          <GripVertical className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      {/* Remove Button */}
                      <div className="absolute top-1 right-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0 min-w-[32px] min-h-[32px]"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeImage(actualIndex)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* Image Number Badge */}
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                        {actualIndex + 1}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Drag images and videos to reorder them
              </p>
            </div>
          )}
        </div>
      )}

      {images.length === 0 && (
        <Alert>
          <ImageIcon className="h-4 w-4" />
          <AlertDescription>
            Upload images/videos or select from your library to get started. The first image will be used as the artwork image.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
