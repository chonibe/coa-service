"use client"

import React, { useState } from "react"
import { Camera, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface ProcessImage {
  url: string
  caption?: string
  order: number
}

interface ProcessGallerySectionProps {
  intro?: string
  images: ProcessImage[]
}

/**
 * ProcessGallerySection - Horizontal scrolling gallery showing creation process
 * 
 * Features:
 * - Large preview area with selected image
 * - Horizontal thumbnail strip
 * - Captions for each image
 * - Optional intro text
 * - Touch-friendly navigation
 */
const ProcessGallerySection: React.FC<ProcessGallerySectionProps> = ({ intro, images }) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!images || images.length === 0) {
    return null
  }

  // Sort images by order
  const sortedImages = [...images].sort((a, b) => a.order - b.order)
  const selectedImage = sortedImages[selectedIndex]

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1))
  }

  const goToNext = () => {
    setSelectedIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0))
  }

  return (
    <section className="py-8 md:py-16">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <Camera className="h-6 w-6 text-blue-400" />
        <h2 className="text-2xl md:text-3xl font-bold text-white">Process Gallery</h2>
      </div>

      {/* Intro Text */}
      {intro && (
        <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8">
          {intro}
        </p>
      )}

      {/* Main Preview Area */}
      <div className="relative bg-gray-900/50 rounded-2xl overflow-hidden shadow-2xl border border-gray-800/50 backdrop-blur-sm mb-6">
        {/* Selected Image */}
        <div className="relative aspect-[4/3] bg-gray-900">
          <Image
            src={selectedImage.url}
            alt={selectedImage.caption || `Process step ${selectedIndex + 1}`}
            fill
            className="object-contain"
            priority={selectedIndex === 0}
          />

          {/* Navigation Arrows */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gray-900/80 backdrop-blur-sm border border-gray-700 flex items-center justify-center hover:bg-gray-800 transition-all active:scale-95 shadow-xl"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gray-900/80 backdrop-blur-sm border border-gray-700 flex items-center justify-center hover:bg-gray-800 transition-all active:scale-95 shadow-xl"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-gray-900/80 backdrop-blur-sm border border-gray-700 text-sm text-white font-medium">
            {selectedIndex + 1} / {sortedImages.length}
          </div>
        </div>

        {/* Caption */}
        {selectedImage.caption && (
          <div className="p-6 md:p-8 bg-gradient-to-t from-gray-900/80 to-transparent">
            <p className="text-gray-300 text-base md:text-lg leading-relaxed">
              {selectedImage.caption}
            </p>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {sortedImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden snap-start transition-all ${
                index === selectedIndex
                  ? "ring-4 ring-blue-500 scale-105 shadow-xl shadow-blue-500/30"
                  : "ring-2 ring-gray-700 hover:ring-gray-600 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 text-xs font-bold text-white bg-gray-900/80 px-2 py-0.5 rounded">
                {index + 1}
              </div>
            </button>
          ))}
        </div>

        {/* Fade Edges */}
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-950 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-950 to-transparent pointer-events-none" />
      </div>
    </section>
  )
}

export default ProcessGallerySection
