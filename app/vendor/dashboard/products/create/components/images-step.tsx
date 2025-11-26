"use client"

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Image as ImageIcon, Upload, X, GripVertical } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageMaskEditor } from "./image-mask-editor"
import type { ProductSubmissionData, ProductImage } from "@/types/product-submission"

interface ImagesStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
  onMaskReady?: (applyMask: () => Promise<void>) => void // Expose apply mask function to parent
}

interface VendorImage {
  url: string
  path: string
  name: string
  created_at?: string
  size?: number
}

export function ImagesStep({ formData, setFormData, onMaskReady }: ImagesStepProps) {
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [vendorImages, setVendorImages] = useState<VendorImage[]>([])
  const [showImageLibrary, setShowImageLibrary] = useState(false)
  const [loadingImages, setLoadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragOverIndex = useRef<number | null>(null)
  const generateMaskRef = useRef<(() => Promise<string>) | null>(null)

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
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, GIF, etc.)")
      return
    }

    // Validate file size (10MB max for images)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_IMAGE_SIZE) {
      alert(`Image file is too large. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`)
      return
    }

    setUploading(true)

    try {
      console.log(`[Upload] Starting upload for file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      
      // Upload via server-side route (uses service role key, bypasses RLS)
      const uploadStartTime = Date.now()
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "image")

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

      // Add image to the list
      const newImage: ProductImage = {
        src: uploadData.url,
        alt: "",
        position: images.length + 1,
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

  const handleImageSelect = (vendorImage: VendorImage) => {
    const newImage: ProductImage = {
      src: vendorImage.url,
      alt: "",
      position: images.length + 1,
    }
    setFormData({ ...formData, images: [...images, newImage] })
    setShowImageLibrary(false)
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

  const handleGenerateMask = (generateFn: () => Promise<string>) => {
    generateMaskRef.current = generateFn
  }

  // Expose applyMask function to parent - only generate when moving to next step
  useEffect(() => {
    if (onMaskReady) {
      const applyMask = async () => {
        // Only generate masked image when explicitly called (on Next click)
        if (images.length > 0 && generateMaskRef.current && images[0].maskSettings) {
          try {
            console.log("Generating masked image before moving to next step...")
            const maskedImageUrl = await generateMaskRef.current()
            const updatedImages = [...images]
            updatedImages[0] = {
              ...updatedImages[0],
              src: maskedImageUrl,
              maskSettings: updatedImages[0].maskSettings, // Keep mask settings for reference
            }
            setFormData({ ...formData, images: updatedImages })
            console.log("Masked image generated and applied successfully")
          } catch (error) {
            console.error("Error applying mask:", error)
            throw error
          }
        }
      }
      onMaskReady(applyMask)
    }
  }, [onMaskReady, images, formData, setFormData])

  const firstImage = images.length > 0 ? images[0] : null

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Product Images</h3>
        <p className="text-sm text-muted-foreground">
          Upload images or select from your image library. The first image will be used as the product preview with mask positioning.
        </p>
      </div>

      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Images"}
        </Button>
        <Dialog open={showImageLibrary} onOpenChange={setShowImageLibrary}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              <ImageIcon className="h-4 w-4 mr-2" />
              Select from Library
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Your Image Library</DialogTitle>
              <DialogDescription>
                Select images from your previously uploaded images
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
              <div className="grid grid-cols-4 gap-4 mt-4">
                {vendorImages.map((vendorImage, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer border rounded-md overflow-hidden aspect-square bg-muted"
                    onClick={() => handleImageSelect(vendorImage)}
                  >
                    <img
                      src={vendorImage.url}
                      alt={vendorImage.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100">
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
          {/* First Image - Product Preview with Mask */}
          {firstImage && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Product Preview Image</Label>
                  <p className="text-xs text-muted-foreground">
                    Position your image within the mask frame. The masked image will be automatically applied when you proceed to the next step.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(0)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <ImageMaskEditor
                image={firstImage}
                onUpdate={updateMaskSettings}
                onGenerateMask={handleGenerateMask}
              />
            </div>
          )}

          {/* Additional Images - Grid View */}
          {images.length > 1 && (
            <div>
              <Label className="text-base font-semibold mb-3 block">Additional Images</Label>
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
                      <img
                        src={image.src}
                        alt={image.alt || `Image ${actualIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                      {/* Drag Handle */}
                      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/50 rounded p-1">
                          <GripVertical className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      {/* Remove Button */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeImage(actualIndex)
                          }}
                        >
                          <X className="h-3 w-3" />
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
                Drag images to reorder them
              </p>
            </div>
          )}
        </div>
      )}

      {images.length === 0 && (
        <Alert>
          <ImageIcon className="h-4 w-4" />
          <AlertDescription>
            Upload images or select from your library to get started. The first image will be used as the product preview.
          </AlertDescription>
        </Alert>
      )}

      {/* Print Files Section */}
      <div className="space-y-4 pt-6 border-t">
        <div>
          <h3 className="text-lg font-semibold mb-2">Print Files</h3>
          <p className="text-sm text-muted-foreground">
            Upload high-resolution PDF files or provide Google Drive links for print production.
          </p>
        </div>

        <div className="space-y-4">
          {/* PDF Upload */}
          <div className="space-y-2">
            <Label htmlFor="pdf-upload">
              <ImageIcon className="h-4 w-4 inline mr-2" />
              High-Resolution PDF
            </Label>
            <Input
              id="pdf-upload"
              type="file"
              accept=".pdf,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Validate file size (50MB max for PDFs)
                  const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50MB
                  if (file.size > MAX_PDF_SIZE) {
                    alert(`PDF file is too large. Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`)
                    return
                  }

                  setUploading(true)
                  try {
                    console.log(`[PDF Upload] Starting upload for file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
                    
                    // Upload via server-side route (uses service role key, bypasses RLS)
                    const formData = new FormData()
                    formData.append("file", file)
                    formData.append("type", "pdf")

                    const uploadResponse = await fetch("/api/vendor/products/upload", {
                      method: "POST",
                      credentials: "include",
                      body: formData,
                    })

                    if (!uploadResponse.ok) {
                      const errorData = await uploadResponse.json().catch(() => ({ error: "Unknown error" }))
                      console.error(`[PDF Upload] Upload failed:`, errorData)
                      throw new Error(errorData.error || errorData.message || "Failed to upload PDF")
                    }

                    const uploadData = await uploadResponse.json()
                    console.log(`[PDF Upload] Upload successful! Public URL: ${uploadData.url}`)

                    setFormData({
                      ...formData,
                      print_files: {
                        ...formData.print_files,
                        pdf_url: uploadData.url,
                      },
                    })
                  } catch (error: any) {
                    alert(error.message || "Failed to upload PDF")
                  } finally {
                    setUploading(false)
                  }
                }
              }}
            />
            {formData.print_files?.pdf_url && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <ImageIcon className="h-4 w-4" />
                <a
                  href={formData.print_files.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  PDF uploaded successfully
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      print_files: {
                        ...formData.print_files,
                        pdf_url: null,
                      },
                    })
                  }}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Google Drive Link */}
          <div className="space-y-2">
            <Label htmlFor="drive-link">Google Drive Link (Alternative)</Label>
            <Input
              id="drive-link"
              value={formData.print_files?.drive_link || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  print_files: {
                    ...formData.print_files,
                    drive_link: e.target.value || null,
                  },
                })
              }
              placeholder="https://drive.google.com/file/d/..."
              type="url"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
