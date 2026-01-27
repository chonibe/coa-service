"use client"

import React, { useState } from "react"
import { Camera, Upload, X, GripVertical, Plus } from "lucide-react"
import { Input, Textarea, Label, Button } from "@/components/ui"
import Image from "next/image"

interface ProcessImage {
  url: string
  caption?: string
  order: number
}

interface ProcessGalleryEditorProps {
  blockId: number
  config: {
    intro?: string
    images?: ProcessImage[]
  }
  onChange: (config: { intro?: string; images: ProcessImage[] }) => void
  onImageUpload?: (blockId: number) => void
}

/**
 * ProcessGalleryEditor - Drag-and-drop image manager for process gallery
 * 
 * Features:
 * - Add/remove images
 * - Drag to reorder
 * - Add captions to each image
 * - Optional intro text
 */
const ProcessGalleryEditor: React.FC<ProcessGalleryEditorProps> = ({
  blockId,
  config,
  onChange,
  onImageUpload,
}) => {
  const [intro, setIntro] = useState(config.intro || "")
  const [images, setImages] = useState<ProcessImage[]>(config.images || [])
  const [editingCaption, setEditingCaption] = useState<number | null>(null)

  const handleIntroChange = (value: string) => {
    setIntro(value)
    onChange({ intro: value, images })
  }

  const handleAddImage = () => {
    if (onImageUpload) {
      onImageUpload(blockId)
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    // Reorder remaining images
    const reorderedImages = newImages.map((img, i) => ({ ...img, order: i }))
    setImages(reorderedImages)
    onChange({ intro, images: reorderedImages })
  }

  const handleCaptionChange = (index: number, caption: string) => {
    const newImages = [...images]
    newImages[index] = { ...newImages[index], caption }
    setImages(newImages)
    onChange({ intro, images: newImages })
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return
    
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    
    // Update order values
    const reorderedImages = newImages.map((img, i) => ({ ...img, order: i }))
    setImages(reorderedImages)
    onChange({ intro, images: reorderedImages })
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Camera className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Process Gallery</h3>
          <p className="text-sm text-gray-400">Show how this piece came to life</p>
        </div>
      </div>

      {/* Introduction */}
      <div className="space-y-2">
        <Label htmlFor={`intro-${blockId}`} className="text-white">
          Introduction <span className="text-gray-500">(optional)</span>
        </Label>
        <Textarea
          id={`intro-${blockId}`}
          placeholder="This piece started as a quick sketch and evolved over several weeks..."
          value={intro}
          onChange={(e) => handleIntroChange(e.target.value)}
          rows={3}
          className="bg-gray-800 border-gray-700 text-white resize-none"
        />
      </div>

      {/* Images */}
      <div className="space-y-3">
        <Label className="text-white">
          Images <span className="text-gray-500">(drag to reorder)</span>
        </Label>

        {images.length === 0 ? (
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
            <Camera className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">No images added yet</p>
            <Button
              onClick={handleAddImage}
              variant="outline"
              className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Images
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {images.map((image, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex gap-4">
                  {/* Drag Handle */}
                  <div className="flex flex-col gap-1 pt-2">
                    <button
                      onClick={() => moveImage(index, index - 1)}
                      disabled={index === 0}
                      className="text-gray-500 hover:text-gray-300 disabled:opacity-30"
                    >
                      <GripVertical className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => moveImage(index, index + 1)}
                      disabled={index === images.length - 1}
                      className="text-gray-500 hover:text-gray-300 disabled:opacity-30"
                    >
                      <GripVertical className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Image Preview */}
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-900">
                    <Image
                      src={image.url}
                      alt={`Process ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-gray-900/80 text-white text-xs px-2 py-0.5 rounded">
                      {index + 1}
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="flex-1">
                    <Label htmlFor={`caption-${blockId}-${index}`} className="text-gray-300 text-sm">
                      Caption
                    </Label>
                    <Input
                      id={`caption-${blockId}-${index}`}
                      placeholder="Initial sketch..."
                      value={image.caption || ""}
                      onChange={(e) => handleCaptionChange(index, e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white mt-1"
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="text-red-500 hover:text-red-400 p-2 h-fit"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add More Button */}
            <Button
              onClick={handleAddImage}
              variant="outline"
              className="w-full bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add More Images
            </Button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-sm text-gray-400 leading-relaxed">
          <strong className="text-gray-300">Tip:</strong> Show the journey - early sketches, 
          works in progress, and close-up details work great. Tell the story of how this piece 
          evolved.
        </p>
      </div>
    </div>
  )
}

export default ProcessGalleryEditor
