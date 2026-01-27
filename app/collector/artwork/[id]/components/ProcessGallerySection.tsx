"use client"

import { useState } from "react"
import Image from "next/image"
import { Camera, ChevronLeft, ChevronRight } from "lucide-react"

interface ProcessGallerySectionProps {
  title?: string
  config: {
    intro?: string
    images: Array<{
      url: string
      caption?: string
      order: number
    }>
  }
}

export default function ProcessGallerySection({ title, config }: ProcessGallerySectionProps) {
  const { intro, images = [] } = config || {}
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!images || images.length === 0) return null

  const sortedImages = [...images].sort((a, b) => a.order - b.order)
  const currentImage = sortedImages[selectedIndex]

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3 mb-3">
          <Camera className="h-6 w-6 text-blue-500" />
          {title || "Process Gallery"}
        </h2>
        {intro && (
          <p className="text-gray-400 leading-relaxed">{intro}</p>
        )}
      </div>

      {/* Large Preview */}
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-900 shadow-2xl">
        <Image
          src={currentImage.url}
          alt={currentImage.caption || `Process image ${selectedIndex + 1}`}
          fill
          className="object-contain"
        />
        
        {/* Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm">
          {selectedIndex + 1} / {sortedImages.length}
        </div>
      </div>

      {/* Caption */}
      {currentImage.caption && (
        <p className="text-gray-300 text-center italic">
          {currentImage.caption}
        </p>
      )}

      {/* Thumbnail Strip */}
      {sortedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {sortedImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden transition-all snap-start ${
                index === selectedIndex
                  ? "ring-2 ring-blue-500 scale-105"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-xs text-white">
                {index + 1}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
