"use client"

import React, { useState } from "react"
import { Lightbulb, Upload, X, Plus } from "lucide-react"
import { Input, Textarea, Label, Button } from "@/components/ui"
import Image from "next/image"

interface InspirationImage {
  url: string
  caption?: string
}

interface InspirationBoardEditorProps {
  blockId: number
  config: {
    story?: string
    images?: InspirationImage[]
  }
  onChange: (config: { story?: string; images: InspirationImage[] }) => void
  onImageUpload?: (blockId: number) => void
}

/**
 * InspirationBoardEditor - Masonry image uploader for mood board
 * 
 * Features:
 * - Add/remove images
 * - Add captions to each image
 * - Story text for context
 */
const InspirationBoardEditor: React.FC<InspirationBoardEditorProps> = ({
  blockId,
  config,
  onChange,
  onImageUpload,
}) => {
  const [story, setStory] = useState(config.story || "")
  const [images, setImages] = useState<InspirationImage[]>(config.images || [])

  const handleStoryChange = (value: string) => {
    setStory(value)
    onChange({ story: value, images })
  }

  const handleAddImage = () => {
    if (onImageUpload) {
      onImageUpload(blockId)
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onChange({ story, images: newImages })
  }

  const handleCaptionChange = (index: number, caption: string) => {
    const newImages = [...images]
    newImages[index] = { ...newImages[index], caption }
    setImages(newImages)
    onChange({ story, images: newImages })
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Inspiration Board</h3>
          <p className="text-sm text-gray-400">Share what influenced this work</p>
        </div>
      </div>

      {/* Story */}
      <div className="space-y-2">
        <Label htmlFor={`story-${blockId}`} className="text-white">
          Story <span className="text-gray-500">(optional)</span>
        </Label>
        <Textarea
          id={`story-${blockId}`}
          placeholder="These images and references capture the mood and energy that inspired this piece..."
          value={story}
          onChange={(e) => handleStoryChange(e.target.value)}
          rows={3}
          className="bg-gray-800 border-gray-700 text-white resize-none"
        />
      </div>

      {/* Images */}
      <div className="space-y-3">
        <Label className="text-white">Images</Label>

        {images.length === 0 ? (
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
            <Lightbulb className="h-12 w-12 text-gray-600 mx-auto mb-3" />
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
            {/* Masonry-style Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 group"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-900">
                    <Image
                      src={image.url}
                      alt={`Inspiration ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  {/* Caption */}
                  <div className="p-3">
                    <Input
                      placeholder="Caption..."
                      value={image.caption || ""}
                      onChange={(e) => handleCaptionChange(index, e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

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
          <strong className="text-gray-300">Tip:</strong> Share photos, screenshots, 
          textures, or anything that influenced your creative process. Help collectors 
          see through your eyes.
        </p>
      </div>
    </div>
  )
}

export default InspirationBoardEditor
