"use client"

import { useState } from "react"
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import 'mapbox-gl/dist/mapbox-gl.css'
import Image from "next/image"
import { MapPin, X } from "lucide-react"

interface MapBlockProps {
  title?: string | null
  contentBlock: {
    block_config: {
      title?: string
      location_name?: string
      latitude?: string
      longitude?: string
      description?: string
      map_style?: string
      images?: string[]
      place_category?: string
    }
  }
}

export function MapBlock({ title, contentBlock }: MapBlockProps) {
  const config = contentBlock.block_config || {}
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [viewState, setViewState] = useState({
    longitude: parseFloat(config.longitude || '-122.4194'),
    latitude: parseFloat(config.latitude || '37.7749'),
    zoom: 14
  })

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiY2hvbmliZSIsImEiOiJjbTMwZjEwbW8wbGtuMmlzOGtiOGRtMTg1In0.Ith0JUK28Im6cJ2R65FoUw'

  if (!config.latitude || !config.longitude) {
    return null
  }

  const images = config.images || []

  const getMapStyle = () => {
    switch (config.map_style) {
      case 'satellite':
        return 'mapbox://styles/mapbox/satellite-streets-v12'
      case 'artistic':
        return 'mapbox://styles/chonibe/cmfitpdfo003y01qr74fwdycq'
      default:
        return 'mapbox://styles/mapbox/streets-v12'
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {(config.title || title) && (
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {config.title || title}
        </h2>
      )}

      {config.location_name && (
        <div className="flex items-center gap-2 text-gray-300 mb-6">
          <MapPin className="w-5 h-5 text-rose-400" />
          <span className="text-lg">{config.location_name}</span>
        </div>
      )}

      <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 mb-6">
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle={getMapStyle()}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          interactive={true}
        >
          <NavigationControl position="top-right" />
          <Marker
            longitude={parseFloat(config.longitude)}
            latitude={parseFloat(config.latitude)}
            anchor="bottom"
          >
            <div className="relative animate-bounce">
              <div className="w-12 h-12 bg-rose-500 rounded-full shadow-2xl flex items-center justify-center border-4 border-white">
                <MapPin className="w-7 h-7 text-white fill-white" />
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white px-4 py-2 rounded-xl shadow-2xl whitespace-nowrap text-sm font-bold text-gray-900 border-2 border-rose-500">
                {config.location_name || 'Location'}
              </div>
            </div>
          </Marker>
        </Map>
      </div>

      {config.description && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
          <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
            {config.description}
          </p>
        </div>
      )}

      {images.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>Location Photos</span>
            <span className="text-sm font-normal text-gray-400">({images.length})</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((imageUrl, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
              >
                <Image
                  src={imageUrl}
                  alt={`Location photo ${index + 1}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl max-h-full">
            <Image
              src={images[selectedImageIndex]}
              alt={`Location photo ${selectedImageIndex + 1}`}
              width={1200}
              height={800}
              className="max-h-[90vh] w-auto h-auto object-contain rounded-lg"
            />

            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-full px-4 py-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === selectedImageIndex
                        ? 'bg-white w-8'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {config.place_category && (
        <div className="mt-6 flex justify-center">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {config.place_category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </span>
        </div>
      )}
    </div>
  )
}

export default MapBlock
