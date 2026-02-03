"use client"

import { useState, useRef } from "react"
import { Lightbulb, Upload, Trash2, Plus, X, Loader2, Maximize2 } from "lucide-react"
import { Button, Textarea, Input } from "@/components/ui"
import Image from "next/image"

interface InspirationBoardEditorProps {
  blockId: number
  config: {
    story?: string
    images?: Array<{
      url: string
      caption?: string
    }>
  }
  onChange: (config: any) => void
  onImageUpload?: () => void
}

export default function InspirationBoardEditor({
  blockId,
  config,
  onChange,
  onImageUpload
}: InspirationBoardEditorProps) {
  const [story, setStory] = useState(config.story || "")
  const [images, setImages] = useState(config.images || [])
  const [isUploading, setIsUploading] = useState(false)
  const [editingCaption, setEditingCaption] = useState<number | null>(null)
  const [lightboxImage, setLightboxImage] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = () => {
    if (onImageUpload) {
      onImageUpload()
    } else {
      fileInputRef.current?.click()
    }
  }

  const uploadImages = async (files: FileList) => {
    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "image")

        const response = await fetch("/api/vendor/media-library/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const data = await response.json()
        return {
          url: data.file.url,
          caption: ""
        }
      })

      const newImages = await Promise.all(uploadPromises)
      const updatedImages = [...images, ...newImages]
      
      setImages(updatedImages)
      onChange({ ...config, images: updatedImages })
    } catch (error) {
      console.error("Failed to upload images:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadImages(files)
    }
    e.target.value = ""
  }

  const handleStoryChange = (newStory: string) => {
    setStory(newStory)
    onChange({ ...config, story: newStory })
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
    setEditingCaption(null)
  }

  // Has images - show masonry-style preview
  if (images.length > 0) {
    return (
      <div className="space-y-4">
        {/* Collector-style Masonry Preview */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-100">
          {/* Story at top */}
          {story ? (
            <p className="text-gray-700 mb-4 italic">"{story}"</p>
          ) : (
            <button
              onClick={() => document.getElementById(`story-input-${blockId}`)?.focus()}
              className="text-amber-600 hover:text-amber-700 text-sm mb-4 block"
            >
              + Add a story about your inspirations
            </button>
          )}

          {/* Masonry Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 auto-rows-auto">
            {images.map((image, index) => {
              // Alternate between different aspect ratios for visual interest
              const aspectClass = index % 3 === 0 ? 'aspect-[4/5]' : index % 3 === 1 ? 'aspect-square' : 'aspect-[5/4]'
              
              return (
                <div
                  key={index}
                  className={`relative ${aspectClass} rounded-xl overflow-hidden bg-gray-100 group cursor-pointer`}
                  onClick={() => setEditingCaption(editingCaption === index ? null : index)}
                >
                  <Image
                    src={image.url}
                    alt={image.caption || `Inspiration ${index + 1}`}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setLightboxImage(index)
                        }}
                        className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"
                      >
                        <Maximize2 className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(index)
                        }}
                        className="w-8 h-8 rounded-full bg-red-500/90 flex items-center justify-center hover:bg-red-500"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Caption Badge */}
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6">
                      <p className="text-xs text-white line-clamp-2">{image.caption}</p>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Add More Button */}
            <button
              onClick={handleImageUpload}
              disabled={isUploading}
              className="aspect-square rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50 flex flex-col items-center justify-center transition-all"
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              ) : (
                <>
                  <Plus className="w-6 h-6 text-amber-500 mb-1" />
                  <span className="text-xs text-amber-600">Add</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Inline Caption Editor */}
        {editingCaption !== null && (
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                <Image
                  src={images[editingCaption].url}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-sm text-gray-500">Image {editingCaption + 1}</span>
              <button
                onClick={() => setEditingCaption(null)}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Input
              type="text"
              placeholder="What inspired you about this?"
              value={images[editingCaption].caption || ""}
              onChange={(e) => updateImageCaption(editingCaption, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingCaption(null)}
              autoFocus
              className="bg-gray-50"
            />
          </div>
        )}

        {/* Story Input */}
        <Textarea
          id={`story-input-${blockId}`}
          placeholder="Tell the story behind your inspirations..."
          value={story}
          onChange={(e) => handleStoryChange(e.target.value)}
          rows={2}
          className="bg-white border-gray-200 resize-none"
        />

        {/* Lightbox Modal */}
        {lightboxImage !== null && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="relative max-w-4xl max-h-[80vh] w-full h-full">
              <Image
                src={images[lightboxImage].url}
                alt={images[lightboxImage].caption || ''}
                fill
                className="object-contain"
              />
            </div>
            {images[lightboxImage].caption && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full">
                <p className="text-white text-sm">{images[lightboxImage].caption}</p>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  // Empty state
  return (
    <div className="space-y-4">
      <div 
        className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-8 border-2 border-dashed border-amber-200 text-center cursor-pointer hover:border-amber-400 transition-colors"
        onClick={handleImageUpload}
      >
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-8 h-8 text-amber-600" />
        </div>
        
        <h4 className="text-lg font-semibold text-gray-900 mb-1">Inspiration Board</h4>
        <p className="text-sm text-gray-600 mb-6">
          Share what influenced this artwork
        </p>
        
        <Button 
          className="bg-amber-600 hover:bg-amber-700 text-white"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Add Inspirations
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-400 mt-4">
          Photos, textures, colors, references - anything that inspired you
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
