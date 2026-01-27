"use client"

import { useState } from "react"
import { Camera, Upload, Trash2, GripVertical, X } from "lucide-react"
import { Button, Textarea, Input } from "@/components/ui"
import Image from "next/image"

interface ProcessGalleryEditorProps {
  blockId: number
  config: {
    intro?: string
    images: Array<{
      url: string
      caption?: string
      order: number
    }>
  }
  onChange: (config: any) => void
  onImageUpload: () => void
}

export default function ProcessGalleryEditor({
  blockId,
  config,
  onChange,
  onImageUpload
}: ProcessGalleryEditorProps) {
  const [intro, setIntro] = useState(config.intro || "")
  const [images, setImages] = useState(config.images || [])

  const handleIntroChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newIntro = e.target.value
    setIntro(newIntro)
    setTimeout(() => onChange({ ...config, intro: newIntro }), 500)
  }

  const addImage = (url: string) => {
    const newImage = {
      url,
      caption: "",
      order: images.length
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
    const newImages = images.filter((_, i) => i !== index).map((img, i) => ({
      ...img,
      order: i
    }))
    setImages(newImages)
    onChange({ ...config, images: newImages })
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    const reordered = newImages.map((img, i) => ({ ...img, order: i }))
    setImages(reordered)
    onChange({ ...config, images: reordered })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Camera className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">Process Gallery</h3>
          <p className="text-sm text-gray-400">Show how this piece came to life</p>
        </div>
      </div>

      {/* Introduction */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Introduction <span className="text-gray-500">(optional)</span>
        </label>
        <Textarea
          placeholder="This piece started as a quick sketch and evolved over several weeks..."
          value={intro}
          onChange={handleIntroChange}
          rows={3}
          className="bg-gray-700 border-gray-600 text-white resize-none"
        />
      </div>

      {/* Images */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300">Images (drag to reorder)</label>
        
        <div className="space-y-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex gap-4">
                {/* Drag Handle */}
                <div className="flex flex-col gap-2 items-center pt-2">
                  <GripVertical className="h-5 w-5 text-gray-500 cursor-move" />
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                </div>

                {/* Image Preview */}
                <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-900">
                  <Image
                    src={image.url}
                    alt={`Process ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Caption Input */}
                <div className="flex-1 space-y-2">
                  <Input
                    type="text"
                    placeholder="Caption for this image..."
                    value={image.caption || ""}
                    onChange={(e) => updateImageCaption(index, e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <div className="flex gap-2">
                    {index > 0 && (
                      <Button
                        onClick={() => moveImage(index, index - 1)}
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 border-gray-600 text-xs"
                      >
                        ← Move Left
                      </Button>
                    )}
                    {index < images.length - 1 && (
                      <Button
                        onClick={() => moveImage(index, index + 1)}
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 border-gray-600 text-xs"
                      >
                        Move Right →
                      </Button>
                    )}
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  onClick={() => removeImage(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Images Button */}
        <Button
          onClick={onImageUpload}
          variant="outline"
          className="w-full bg-gray-800 border-dashed border-2 border-gray-600 hover:border-blue-500 hover:bg-gray-700 py-8"
        >
          <Upload className="h-5 w-5 mr-2" />
          Add Images
        </Button>
      </div>

      {/* Tip */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Show your creative journey - sketches, works in progress, tools, references. Collectors love seeing behind the scenes!
        </p>
      </div>
    </div>
  )
}
