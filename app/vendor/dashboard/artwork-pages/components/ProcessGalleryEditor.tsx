"use client"

import { useState, useRef } from "react"
import { Camera, Upload, Trash2, Plus, ChevronLeft, ChevronRight, Pencil, X, Loader2 } from "lucide-react"
import { Button, Textarea, Input } from "@/components/ui"
import Image from "next/image"

interface ProcessGalleryEditorProps {
  blockId: number
  config: {
    intro?: string
    images?: Array<{
      url: string
      caption?: string
      order: number
    }>
  }
  onChange: (config: any) => void
  onImageUpload?: () => void
}

export default function ProcessGalleryEditor({
  blockId,
  config,
  onChange,
  onImageUpload
}: ProcessGalleryEditorProps) {
  const [intro, setIntro] = useState(config.intro || "")
  const [images, setImages] = useState(config.images || [])
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [editingCaption, setEditingCaption] = useState<number | null>(null)
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
          caption: "",
          order: images.length
        }
      })

      const newImages = await Promise.all(uploadPromises)
      const updatedImages = [...images, ...newImages].map((img, index) => ({
        ...img,
        order: index
      }))
      
      setImages(updatedImages)
      onChange({ ...config, images: updatedImages })
      // Select the first new image
      if (images.length === 0) {
        setSelectedImageIndex(0)
      }
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

  const handleIntroChange = (newIntro: string) => {
    setIntro(newIntro)
    onChange({ ...config, intro: newIntro })
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
    // Adjust selected index if needed
    if (selectedImageIndex >= newImages.length) {
      setSelectedImageIndex(Math.max(0, newImages.length - 1))
    }
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    const reordered = newImages.map((img, i) => ({ ...img, order: i }))
    setImages(reordered)
    onChange({ ...config, images: reordered })
    setSelectedImageIndex(toIndex)
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    } else if (direction === 'next' && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
  }

  // Has images - show visual gallery preview
  if (images.length > 0) {
    const currentImage = images[selectedImageIndex]

    return (
      <div className="space-y-4">
        {/* Collector-style Gallery Preview */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl overflow-hidden border border-blue-100">
          {/* Main Image Display */}
          <div className="relative aspect-[4/3] bg-gray-900">
            <Image
              src={currentImage.url}
              alt={currentImage.caption || `Process image ${selectedImageIndex + 1}`}
              fill
              className="object-contain"
            />
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  disabled={selectedImageIndex === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  disabled={selectedImageIndex === images.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute top-3 right-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
              {selectedImageIndex + 1} / {images.length}
            </div>

            {/* Delete button */}
            <button
              onClick={() => removeImage(selectedImageIndex)}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Caption Editing Area */}
          <div className="p-4 bg-white/80">
            {editingCaption === selectedImageIndex ? (
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add a caption..."
                  value={currentImage.caption || ""}
                  onChange={(e) => updateImageCaption(selectedImageIndex, e.target.value)}
                  onBlur={() => setEditingCaption(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingCaption(null)}
                  autoFocus
                  className="flex-1 bg-white"
                />
              </div>
            ) : (
              <button
                onClick={() => setEditingCaption(selectedImageIndex)}
                className="w-full text-left py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              >
                {currentImage.caption || (
                  <span className="italic text-gray-400">+ Add caption</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="flex gap-2 overflow-x-auto pb-2 px-1">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                index === selectedImageIndex 
                  ? 'ring-2 ring-blue-500 ring-offset-2' 
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                {index + 1}
              </span>
            </button>
          ))}
          
          {/* Add More Button */}
          <button
            onClick={handleImageUpload}
            disabled={isUploading}
            className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center transition-all"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            ) : (
              <Plus className="w-6 h-6 text-gray-400" />
            )}
          </button>
        </div>

        {/* Reorder Controls */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => moveImage(selectedImageIndex, selectedImageIndex - 1)}
              disabled={selectedImageIndex === 0}
              variant="outline"
              size="sm"
            >
              ← Move Earlier
            </Button>
            <Button
              onClick={() => moveImage(selectedImageIndex, selectedImageIndex + 1)}
              disabled={selectedImageIndex === images.length - 1}
              variant="outline"
              size="sm"
            >
              Move Later →
            </Button>
          </div>
        )}

        {/* Introduction (Collapsible) */}
        <div className="space-y-2">
          <Textarea
            placeholder="Tell the story behind these images..."
            value={intro}
            onChange={(e) => handleIntroChange(e.target.value)}
            rows={2}
            className="bg-white border-gray-200 resize-none"
          />
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

  // Empty state - show upload prompt
  return (
    <div className="space-y-4">
      <div 
        className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border-2 border-dashed border-blue-200 text-center cursor-pointer hover:border-blue-400 transition-colors"
        onClick={handleImageUpload}
      >
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-blue-600" />
        </div>
        
        <h4 className="text-lg font-semibold text-gray-900 mb-1">Behind the Scenes</h4>
        <p className="text-sm text-gray-600 mb-6">
          Show collectors how this piece came to life
        </p>
        
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
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
              Add Process Images
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-400 mt-4">
          Sketches, works in progress, tools, references - anything that shows your process
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
