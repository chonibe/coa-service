"use client"

import { useState } from "react"
import Image from "next/image"
import { Lightbulb, X } from "lucide-react"

interface InspirationBoardSectionProps {
  title?: string
  config: {
    story?: string
    images: Array<{
      url: string
      caption?: string
    }>
  }
}

export default function InspirationBoardSection({ title, config }: InspirationBoardSectionProps) {
  const { story, images = [] } = config || {}
  const [expandedImage, setExpandedImage] = useState<{ url: string; caption?: string } | null>(null)

  if (!images || images.length === 0) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3 mb-3">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
          {title || "Inspiration"}
        </h2>
        {story && (
          <p className="text-gray-400 leading-relaxed">{story}</p>
        )}
      </div>

      {/* Masonry Grid */}
      <div className="columns-2 md:columns-3 gap-4 space-y-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-lg transition-transform hover:scale-105"
            onClick={() => setExpandedImage(image)}
          >
            <div className="relative aspect-square">
              <Image
                src={image.url}
                alt={image.caption || `Inspiration ${index + 1}`}
                fill
                className="object-cover"
              />
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                  Click to expand
                </span>
              </div>
            </div>
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-square">
              <Image
                src={expandedImage.url}
                alt={expandedImage.caption || "Expanded view"}
                fill
                className="object-contain"
              />
            </div>
            {expandedImage.caption && (
              <p className="text-white text-center mt-4 text-lg">
                {expandedImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
