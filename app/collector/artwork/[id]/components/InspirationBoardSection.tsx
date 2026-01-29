"use client"

import { useState } from "react"
import Image from "next/image"
import { Lightbulb, X, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui"

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
    <div className="py-8 md:py-12">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-amber-500/10">
            <Lightbulb className="h-5 w-5 text-amber-500" />
          </div>
          {title || "Inspiration"}
        </h2>
        {story && (
          <p className="text-muted-foreground leading-relaxed text-lg">{story}</p>
        )}
      </div>

      {/* Masonry Grid */}
      <div className="columns-2 md:columns-3 gap-4 space-y-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-2xl transition-all hover:scale-[1.02] hover:shadow-xl"
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
                <div className="flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="h-5 w-5" />
                  <span className="text-sm font-medium">Expand</span>
                </div>
              </div>
            </div>
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm font-medium">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <Button
            onClick={() => setExpandedImage(null)}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-muted hover:bg-muted/80"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-square">
              <Image
                src={expandedImage.url}
                alt={expandedImage.caption || "Expanded view"}
                fill
                className="object-contain rounded-2xl"
              />
            </div>
            {expandedImage.caption && (
              <p className="text-foreground text-center mt-4 text-lg font-medium">
                {expandedImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
