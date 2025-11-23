"use client"

import { useState, useRef, useEffect } from "react"
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
}

interface VendorImage {
  url: string
  path: string
  name: string
  created_at?: string
  size?: number
}

export function ImagesStep({ formData, setFormData }: ImagesStepProps) {
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [vendorImages, setVendorImages] = useState<VendorImage[]>([])
  const [showImageLibrary, setShowImageLibrary] = useState(false)
  const [loadingImages, setLoadingImages] = useState(false)
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
      // Get upload path from API
      const pathResponse = await fetch("/api/vendor/products/upload-url", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: "image",
          fileSize: file.size,
        }),
      })

      if (!pathResponse.ok) {
        const errorData = await pathResponse.json()
        throw new Error(errorData.error || "Failed to get upload path")
      }

      const uploadData = await pathResponse.json()

      // Check if we got a signed URL or need to use direct upload
      if (uploadData.signedUrl) {
        // Use signed URL for upload
        const uploadResponse = await fetch(uploadData.signedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
            "x-upsert": "false",
          },
        })

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`)
        }
      } else {
        // Fallback: use server-side upload route
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "image")

        const uploadResponse = await fetch("/api/vendor/products/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || "Failed to upload file")
        }

        const uploadResult = await uploadResponse.json()
        uploadData.url = uploadResult.url
        uploadData.path = uploadResult.path
      }

      // Get public URL - use the path from upload data
      const { getSupabaseClient } = await import("@/lib/supabase")
      const supabase = getSupabaseClient()
      const urlData = supabase
        ? supabase.storage.from(uploadData.bucket).getPublicUrl(uploadData.path)
        : { data: { publicUrl: uploadData.url || uploadData.signedUrl } }

      // Add image to the list
      const publicUrl = urlData.data?.publicUrl || urlData.publicUrl
      if (!publicUrl) {
        throw new Error("Failed to get public URL for uploaded image")
      }

      const newImage: ProductImage = {
        src: publicUrl,
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

  const updateMaskSettings = (maskSettings: ProductImage["maskSettings"]) => {
    if (images.length > 0) {
      const updatedImages = [...images]
      updatedImages[0] = { ...updatedImages[0], maskSettings }
      setFormData({ ...formData, images: updatedImages })
    }
  }

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
                    This is your primary product image with mask positioning
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
                    // Get upload path from API
                    const pathResponse = await fetch("/api/vendor/products/upload-url", {
                      method: "POST",
                      credentials: "include",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        fileName: file.name,
                        fileType: "pdf",
                        fileSize: file.size,
                      }),
                    })

                    if (!pathResponse.ok) {
                      const errorData = await pathResponse.json()
                      throw new Error(errorData.error || "Failed to get upload path")
                    }

                    const uploadData = await pathResponse.json()

                    // Check if we got a signed URL or need to use direct upload
                    if (uploadData.signedUrl) {
                      // Use signed URL for upload
                      const uploadResponse = await fetch(uploadData.signedUrl, {
                        method: "PUT",
                        body: file,
                        headers: {
                          "Content-Type": file.type,
                          "x-upsert": "false",
                        },
                      })

                      if (!uploadResponse.ok) {
                        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
                      }
                    } else {
                      // Fallback: use server-side upload route
                      const formData = new FormData()
                      formData.append("file", file)
                      formData.append("type", "pdf")

                      const uploadResponse = await fetch("/api/vendor/products/upload", {
                        method: "POST",
                        credentials: "include",
                        body: formData,
                      })

                      if (!uploadResponse.ok) {
                        const errorData = await uploadResponse.json()
                        throw new Error(errorData.error || "Failed to upload PDF")
                      }

                      const uploadResult = await uploadResponse.json()
                      uploadData.url = uploadResult.url
                      uploadData.path = uploadResult.path
                    }

                    // Get public URL
                    const { getSupabaseClient } = await import("@/lib/supabase")
                    const supabase = getSupabaseClient()
                    const urlData = supabase
                      ? supabase.storage.from(uploadData.bucket).getPublicUrl(uploadData.path)
                      : { data: { publicUrl: uploadData.url || uploadData.signedUrl } }

                    const publicUrl = urlData.data?.publicUrl || urlData.publicUrl
                    if (!publicUrl) {
                      throw new Error("Failed to get public URL for uploaded PDF")
                    }

                    setFormData({
                      ...formData,
                      print_files: {
                        ...formData.print_files,
                        pdf_url: publicUrl,
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
