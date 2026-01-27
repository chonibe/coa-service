"use client"

import React, { useState } from "react"
import { Lightbulb, X } from "lucide-react"
import Image from "next/image"

interface InspirationImage {
  url: string
  caption?: string
}

interface InspirationBoardSectionProps {
  story?: string
  images: InspirationImage[]
}

/**
 * InspirationBoardSection - Masonry grid layout showing artistic influences
 * 
 * Features:
 * - Pinterest-style masonry grid
 * - Tap to expand with caption
 * - Story text introduction
 * - Responsive column layout
 */
const InspirationBoardSection: React.FC<InspirationBoardSectionProps> = ({ story, images }) => {
  const [expandedImage, setExpandedImage] = useState<number | null>(null)

  if (!images || images.length === 0) {
    return null
  }

  const handleImageClick = (index: number) => {
    setExpandedImage(expandedImage === index ? null : index)
  }

  return (
    <section className="py-8 md:py-16">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <Lightbulb className="h-6 w-6 text-yellow-400" />
        <h2 className="text-2xl md:text-3xl font-bold text-white">Inspiration Board</h2>
      </div>

      {/* Story Text */}
      {story && (
        <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8">
          {story}
        </p>
      )}

      {/* Masonry Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className={`relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-2xl ${
              expandedImage === index ? "col-span-2 row-span-2" : ""
            }`}
            onClick={() => handleImageClick(index)}
          >
            {/* Image */}
            <div className="relative w-full" style={{ paddingBottom: expandedImage === index ? "100%" : "133%" }}>
              <Image
                src={image.url}
                alt={image.caption || `Inspiration ${index + 1}`}
                fill
                className="object-cover"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />

              {/* Caption Preview on Hover */}
              {image.caption && !expandedImage && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs md:text-sm line-clamp-2">
                    {image.caption}
                  </p>
                </div>
              )}
            </div>

            {/* Expanded Caption */}
            {expandedImage === index && image.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                <p className="text-white text-sm md:text-base leading-relaxed">
                  {image.caption}
                </p>
              </div>
            )}

            {/* Close Button for Expanded */}
            {expandedImage === index && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedImage(null)
                }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-900/80 backdrop-blur-sm border border-gray-700 flex items-center justify-center hover:bg-gray-800 transition-all z-10"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Tap Hint */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Tap any image to expand
      </p>
    </section>
  )
}

export default InspirationBoardSection
