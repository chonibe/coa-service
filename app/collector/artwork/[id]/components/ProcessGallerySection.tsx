"use client"

import { useState } from "react"
import Image from "next/image"
import { Camera, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui"

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
    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
      <CardContent className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-blue-500/10">
              <Camera className="h-6 w-6 text-blue-500" />
            </div>
            {title || "Process Gallery"}
          </h2>
          {intro && (
            <p className="text-muted-foreground leading-relaxed">{intro}</p>
          )}
        </div>

        {/* Large Preview */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-secondary shadow-lg">
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
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background/80 hover:bg-background backdrop-blur-sm flex items-center justify-center transition-all shadow-lg hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background/80 hover:bg-background backdrop-blur-sm flex items-center justify-center transition-all shadow-lg hover:scale-105"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground text-sm font-medium">
            {selectedIndex + 1} / {sortedImages.length}
          </div>
        </div>

        {/* Caption */}
        {currentImage.caption && (
          <p className="text-muted-foreground text-center italic text-lg">
            {currentImage.caption}
          </p>
        )}

        {/* Thumbnail Strip */}
        {sortedImages.length > 1 && (
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1">
            {sortedImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden transition-all snap-start ${
                  index === selectedIndex
                    ? "ring-2 ring-blue-500 scale-105 opacity-100"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
