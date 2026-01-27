"use client"

import { useState } from "react"
import { Lightbulb, Upload, Trash2, X } from "lucide-react"
import { Button, Textarea, Input } from "@/components/ui"
import Image from "next/image"

interface InspirationBoardEditorProps {
  blockId: number
  config: {
    story?: string
    images: Array<{
      url: string
      caption?: string
    }>
  }
  onChange: (config: any) => void
  onImageUpload: () => void
}

export default function InspirationBoardEditor({
  blockId,
  config,
  onChange,
  onImageUpload
}: InspirationBoardEditorProps) {
  const [story, setStory] = useState(config.story || "")
  const [images, setImages] = useState(config.images || [])

  const handleStoryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newStory = e.target.value
    setStory(newStory)
    setTimeout(() => onChange({ ...config, story: newStory }), 500)
  }

  const addImage = (url: string) => {
    const newImage = {
      url,
      caption: ""
    }
    const newImages = [...images, newImage]
    setImages(newImages)
    onChange({ ...config, images: newImages })
  }

  const updateImageCaption = (index: number, caption: string) => {
    const newImages = images.map((img, i) =>
      i === index ? { ...img, caption } : img
    )
    setImages(newImages)
    onChange({ ...config, images: newImages })
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onChange({ ...config, images: newImages })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">Inspiration Board</h3>
          <p className="text-sm text-gray-400">Share your influences and references</p>
        </div>
      </div>

      {/* Story */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Story <span className="text-gray-500">(optional)</span>
        </label>
        <Textarea
          placeholder="These textures and colors guided my palette. The urban architecture inspired the geometric forms..."
          value={story}
          onChange={handleStoryChange}
          rows={3}
          className="bg-gray-700 border-gray-600 text-white resize-none"
        />
      </div>

      {/* Images Grid */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300">Images</label>
        
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-900 border border-gray-700 group"
              >
                <Image
                  src={image.url}
                  alt={`Inspiration ${index + 1}`}
                  fill
                  className="object-cover"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    onClick={() => removeImage(index)}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                {/* Caption Badge */}
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                    <p className="text-xs text-white truncate">{image.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Caption Inputs */}
        {images.length > 0 && (
          <div className="space-y-2 mt-4">
            <label className="text-xs font-medium text-gray-400">Captions (optional)</label>
            {images.map((image, index) => (
              <Input
                key={index}
                type="text"
                placeholder={`Caption for image #${index + 1}...`}
                value={image.caption || ""}
                onChange={(e) => updateImageCaption(index, e.target.value)}
                className="bg-gray-700 border-gray-600 text-white text-sm"
              />
            ))}
          </div>
        )}

        {/* Add Images Button */}
        <Button
          onClick={onImageUpload}
          variant="outline"
          className="w-full bg-gray-800 border-dashed border-2 border-gray-600 hover:border-yellow-500 hover:bg-gray-700 py-8"
        >
          <Upload className="h-5 w-5 mr-2" />
          {images.length > 0 ? "Add More Images" : "Add Images"}
        </Button>
      </div>

      {/* Tip */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Share photos, screenshots, textures, or color palettes that inspired your work. Help collectors see through your creative lens!
        </p>
      </div>
    </div>
  )
}
