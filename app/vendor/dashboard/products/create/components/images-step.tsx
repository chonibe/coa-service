"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Image as ImageIcon } from "lucide-react"
import type { ProductSubmissionData, ProductImage } from "@/types/product-submission"

interface ImagesStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
}

export function ImagesStep({ formData, setFormData }: ImagesStepProps) {
  const [imageUrls, setImageUrls] = useState<string[]>(
    formData.images?.map((img) => img.src) || [],
  )

  const addImage = () => {
    setImageUrls([...imageUrls, ""])
  }

  const updateImageUrl = (index: number, url: string) => {
    const newUrls = [...imageUrls]
    newUrls[index] = url
    setImageUrls(newUrls)
    updateImages(newUrls)
  }

  const removeImage = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index)
    setImageUrls(newUrls)
    updateImages(newUrls)
  }

  const updateImages = (urls: string[]) => {
    const images: ProductImage[] = urls
      .filter((url) => url.trim().length > 0)
      .map((url, index) => ({
        src: url.trim(),
        alt: formData.images?.[index]?.alt || "",
        position: index + 1,
      }))
    setFormData({ ...formData, images })
  }

  const handleImageAltChange = (index: number, alt: string) => {
    const images = [...(formData.images || [])]
    if (images[index]) {
      images[index] = { ...images[index], alt }
      setFormData({ ...formData, images })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Product Images</h3>
        <p className="text-sm text-muted-foreground">
          Add image URLs for your product. Images are optional but recommended.
        </p>
      </div>

      <div className="space-y-4">
        {imageUrls.map((url, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Image {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeImage(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`image-url-${index}`}>Image URL</Label>
              <Input
                id={`image-url-${index}`}
                value={url}
                onChange={(e) => updateImageUrl(index, e.target.value)}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`image-alt-${index}`}>Alt Text</Label>
              <Input
                id={`image-alt-${index}`}
                value={formData.images?.[index]?.alt || ""}
                onChange={(e) => handleImageAltChange(index, e.target.value)}
                placeholder="Product image description"
              />
            </div>

            {url && (
              <div className="mt-2">
                <div className="relative w-full h-48 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    src={url}
                    alt={formData.images?.[index]?.alt || "Product preview"}
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
        ))}

        <Button type="button" variant="outline" onClick={addImage} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      </div>
    </div>
  )
}

