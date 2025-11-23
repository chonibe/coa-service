"use client"

import { useState, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Image as ImageIcon, Upload, Link as LinkIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageMaskEditor } from "./image-mask-editor"
import type { ProductSubmissionData, ProductImage } from "@/types/product-submission"

interface ImagesStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
}

export function ImagesStep({ formData, setFormData }: ImagesStepProps) {
  const [uploading, setUploading] = useState<Record<number, boolean>>({})
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const images = formData.images || []

  const handleFileUpload = async (index: number, file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    setUploading({ ...uploading, [index]: true })

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "image")

      const response = await fetch("/api/vendor/products/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image")
      }

      // Update image at index
      const updatedImages = [...images]
      if (updatedImages[index]) {
        updatedImages[index] = {
          ...updatedImages[index],
          src: data.url,
        }
      } else {
        updatedImages[index] = {
          src: data.url,
          alt: "",
          position: index + 1,
        }
      }

      setFormData({ ...formData, images: updatedImages })
    } catch (error: any) {
      console.error("Error uploading image:", error)
      alert(error.message || "Failed to upload image")
    } finally {
      setUploading({ ...uploading, [index]: false })
    }
  }

  const updateImage = (index: number, updates: Partial<ProductImage>) => {
    const updatedImages = [...images]
    if (updatedImages[index]) {
      updatedImages[index] = { ...updatedImages[index], ...updates }
    } else {
      updatedImages[index] = {
        src: "",
        alt: "",
        position: index + 1,
        ...updates,
      }
    }
    setFormData({ ...formData, images: updatedImages })
  }

  const updateMaskSettings = (index: number, maskSettings: ProductImage["maskSettings"]) => {
    updateImage(index, { maskSettings })
  }

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    // Reindex positions
    updatedImages.forEach((img, i) => {
      img.position = i + 1
    })
    setFormData({ ...formData, images: updatedImages })
  }

  const addImage = () => {
    const newImages = [
      ...images,
      {
        src: "",
        alt: "",
        position: images.length + 1,
      },
    ]
    setFormData({ ...formData, images: newImages })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Product Images</h3>
        <p className="text-sm text-muted-foreground">
          Upload images or add image URLs. The first image will have a positioning tool with a
          mask overlay.
        </p>
      </div>

      <div className="space-y-4">
        {images.map((image, index) => {
          const isFirstImage = index === 0
          const hasImage = image.src && image.src.trim().length > 0

          return (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label>
                  {isFirstImage ? "Primary Image" : `Image ${index + 1}`}
                  {isFirstImage && <span className="text-muted-foreground ml-2">(with mask)</span>}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`file-${index}`}>Upload Image</Label>
                    <Input
                      id={`file-${index}`}
                      type="file"
                      accept="image/*"
                      ref={(el) => {
                        fileInputRefs.current[index] = el
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(index, file)
                        }
                      }}
                      className="cursor-pointer"
                    />
                    {uploading[index] && (
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`image-url-${index}`}>Image URL</Label>
                    <Input
                      id={`image-url-${index}`}
                      value={image.src || ""}
                      onChange={(e) => updateImage(index, { src: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      type="url"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor={`image-alt-${index}`}>Alt Text</Label>
                <Input
                  id={`image-alt-${index}`}
                  value={image.alt || ""}
                  onChange={(e) => updateImage(index, { alt: e.target.value })}
                  placeholder="Product image description"
                />
              </div>

              {hasImage && (
                <div className="space-y-4">
                  {isFirstImage ? (
                    <>
                      <div className="space-y-2">
                        <Label>Image Positioning & Mask</Label>
                        <p className="text-xs text-muted-foreground">
                          Position your image within the product frame. The visible area is 827x1197
                          with rounded corners.
                        </p>
                        <ImageMaskEditor
                          image={image}
                          onUpdate={(maskSettings) => updateMaskSettings(index, maskSettings)}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="mt-2">
                      <div className="relative w-full h-48 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        <img
                          src={image.src}
                          alt={image.alt || "Product preview"}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                            e.currentTarget.nextElementSibling?.classList.remove("hidden")
                          }}
                        />
                        <div className="hidden absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Failed to load image</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!hasImage && (
                <Alert>
                  <ImageIcon className="h-4 w-4" />
                  <AlertDescription>
                    {isFirstImage
                      ? "Upload or enter a URL for the primary product image. You'll be able to position it with the mask tool."
                      : "Upload or enter a URL to add this image."}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )
        })}

        <Button type="button" variant="outline" onClick={addImage} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      </div>
    </div>
  )
}
