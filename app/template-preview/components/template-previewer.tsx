"use client"

import { useState, useCallback } from "react"
import { ImageMaskEditor } from "@/app/vendor/dashboard/products/create/components/image-mask-editor"
import type { ProductImage } from "@/types/product-submission"

interface TemplatePreviewerProps {
  artworkImage: string | null
}

export function TemplatePreviewer({ artworkImage }: TemplatePreviewerProps) {
  const [maskSettings, setMaskSettings] = useState<ProductImage["maskSettings"]>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  })

  const handleMaskUpdate = useCallback((settings: ProductImage["maskSettings"]) => {
    setMaskSettings(settings)
  }, [])

  // Convert uploaded image string to ProductImage format
  const productImage: ProductImage = {
    src: artworkImage || "",
    alt: "Artwork preview",
    maskSettings: maskSettings,
  }

  if (!artworkImage) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50">
        <p className="text-muted-foreground text-center">
          Upload an artwork image to see how it looks on the template
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <ImageMaskEditor
            image={productImage}
            onUpdate={handleMaskUpdate}
          />
        </div>
      </div>
    </div>
  )
}
