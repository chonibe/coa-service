"use client"

import { useState } from "react"
import Image from "next/image"
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react"

interface MapBlockConfig {
  title?: string
  location_name?: string
  latitude?: string | number
  longitude?: string | number
  description?: string
  map_style?: 'street' | 'satellite' | 'artistic'
  images?: string[]
}

interface MapBlockProps {
  title?: string
  config: MapBlockConfig
}

/**
 * MapBlock - Displays a location with map and photo carousel
 * 
 * Features:
 * - Swipeable carousel with map as first slide
 * - Location photos as subsequent slides
 * - Dot indicators for navigation
 * - Location name and description
 */
export function MapBlock({ title, config }: MapBlockProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const {
    title: configTitle,
    location_name,
    latitude,
    longitude,
    description,
    map_style = 'street',
    images = [],
  } = config

  const displayTitle = title || configTitle || "Location"
  
  // Build slides array: map first, then images
  const hasCoordinates = latitude && longitude
  const slides: { type: 'map' | 'image'; url?: string }[] = []
  
  if (hasCoordinates) {
    slides.push({ type: 'map' })
  }
  
  images.forEach(url => {
    slides.push({ type: 'image', url })
  })

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  // Generate static map URL (using OpenStreetMap tiles via a static map service)
  const getMapUrl = () => {
    const lat = Number(latitude)
    const lng = Number(longitude)
    const zoom = 14
    
    // Use OpenStreetMap static map
    // For production, you might want to use Mapbox or Google Static Maps API
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=600x400&maptype=mapnik&markers=${lat},${lng},red-pushpin`
  }

  if (slides.length === 0 && !location_name) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-rose-500" />
          <h3 className="font-semibold text-gray-900">{displayTitle}</h3>
        </div>
      </div>

      {/* Carousel */}
      {slides.length > 0 && (
        <div className="relative">
          {/* Slides container */}
          <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-300 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {slide.type === 'map' ? (
                  // Map slide
                  <div className="w-full h-full relative">
                    <Image
                      src={getMapUrl()}
                      alt={`Map of ${location_name || 'location'}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {/* Map overlay with pin */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 bg-rose-500 rounded-full shadow-lg flex items-center justify-center -mt-4">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Image slide
                  <Image
                    src={slide.url!}
                    alt={`${location_name || 'Location'} photo ${index}`}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            ))}

            {/* Navigation arrows */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}
          </div>

          {/* Dot indicators */}
          {slides.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? 'bg-gray-800 w-4'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Location info */}
      <div className="px-4 py-4">
        {location_name && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="font-medium text-gray-900">{location_name}</span>
          </div>
        )}

        {description && (
          <p className="text-gray-600 text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

export default MapBlock
