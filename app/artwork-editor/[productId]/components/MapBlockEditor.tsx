"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import Map, { Marker, NavigationControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { 
  X, 
  Camera, 
  Loader2, 
  Navigation, 
  Search,
  MapPin,
  ChevronRight,
  Building2,
  Store,
  Coffee,
  Home,
  Landmark
} from "lucide-react"

interface ContentBlock {
  id: string
  block_name: string
  block_config: Record<string, any>
  [key: string]: any
}

interface MapBlockEditorProps {
  block: ContentBlock
  onUpdate: (updates: Partial<ContentBlock>) => void
}

interface SearchResult {
  id: string
  place_id: string
  name: string
  display_name: string
  latitude: number
  longitude: number
  place_type: string
  address?: string
  category?: string
  maki?: string // Icon identifier
  context?: Array<{ id: string; text: string }>
}

/**
 * MapBlockEditor - Editor for Artwork Map Block with geocoding
 * 
 * Features:
 * - "Use Current Location" with geolocation API
 * - Location search using OpenStreetMap Nominatim
 * - Manual lat/lng entry
 * - Multiple photo upload
 * - Description field
 */
export function MapBlockEditor({ block, onUpdate }: MapBlockEditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [viewState, setViewState] = useState({
    longitude: parseFloat(config.longitude) || -122.4194,
    latitude: parseFloat(config.latitude) || 37.7749,
    zoom: 13
  })

  const config = block.block_config || {}
  const images: string[] = config.images || []

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiY2hvbmliZSIsImEiOiJjbTMwZjEwbW8wbGtuMmlzOGtiOGRtMTg1In0.Ith0JUK28Im6cJ2R65FoUw'

  // Get icon for place type
  const getPlaceIcon = (placeType: string, category?: string) => {
    if (category?.includes('cafe') || category?.includes('coffee')) return Coffee
    if (category?.includes('shop') || category?.includes('store')) return Store
    if (placeType === 'poi') return Landmark
    if (placeType === 'address') return Home
    return Building2
  }

  // Format place type for display
  const formatPlaceType = (placeType: string, category?: string) => {
    if (category) {
      return category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
    if (placeType === 'poi') return 'Point of Interest'
    if (placeType === 'address') return 'Address'
    if (placeType === 'place') return 'City/Town'
    if (placeType === 'locality') return 'Locality'
    if (placeType === 'neighborhood') return 'Neighborhood'
    return placeType
  }

  const handleConfigUpdate = (field: string, value: any) => {
    onUpdate({
      block_config: {
        ...config,
        [field]: value,
      }
    })
  }

  // Auto-detect current location
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setIsDetectingLocation(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          
          // Reverse geocode to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await response.json()

          // Update all location fields
          handleConfigUpdate('latitude', latitude.toFixed(6))
          handleConfigUpdate('longitude', longitude.toFixed(6))
          
          // Build location name from address
          const city = data.address?.city || data.address?.town || data.address?.village || ''
          const country = data.address?.country || ''
          const locationName = city && country ? `${city}, ${country}` : city || country || data.display_name?.split(',')[0] || ''
          
          if (locationName && !config.location_name) {
            handleConfigUpdate('location_name', locationName)
          }
        } catch (err) {
          console.error('Reverse geocode error:', err)
          setError('Could not determine location name')
        } finally {
          setIsDetectingLocation(false)
        }
      },
      (err) => {
        console.error('Geolocation error:', err)
        setError('Could not access your location. Please enable location permissions.')
        setIsDetectingLocation(false)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  // Search for location using Mapbox Geocoding (with business search)
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      setError(null)
      try {
        const response = await fetch(
          `/api/mapbox/geocoding?q=${encodeURIComponent(query)}`
        )
        
        if (!response.ok) {
          throw new Error('Failed to search locations')
        }
        
        const data = await response.json()
        setSearchResults(data.results || [])
        setShowSearchResults(true)
      } catch (err) {
        console.error('Search error:', err)
        setError('Could not search locations. Please try again.')
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }

  // Select a search result
  const selectSearchResult = (result: SearchResult) => {
    // Build location name from result
    let locationName = result.name
    
    // Get city and country from context if available
    const cityContext = result.context?.find(c => c.id.startsWith('place.'))
    const countryContext = result.context?.find(c => c.id.startsWith('country.'))
    
    if (cityContext && countryContext) {
      locationName = `${result.name}, ${cityContext.text}, ${countryContext.text}`
    } else if (cityContext) {
      locationName = `${result.name}, ${cityContext.text}`
    } else if (countryContext) {
      locationName = `${result.name}, ${countryContext.text}`
    }
    
    // Update all location data at once
    onUpdate({
      block_config: {
        ...config,
        latitude: result.latitude.toFixed(6),
        longitude: result.longitude.toFixed(6),
        location_name: locationName,
        place_id: result.place_id,
        place_type: result.place_type,
        place_category: result.category || '',
      }
    })
    
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  // Handle map click to set location
  const handleMapClick = useCallback(async (event: any) => {
    const { lngLat } = event
    const latitude = lngLat.lat
    const longitude = lngLat.lng

    // Update map view
    setViewState(prev => ({
      ...prev,
      latitude,
      longitude
    }))

    try {
      // Reverse geocode to get location name
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`
      )
      const data = await response.json()
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const locationName = feature.place_name
        
        // Update all location data at once
        onUpdate({
          block_config: {
            ...config,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
            location_name: locationName,
            place_id: feature.id || '',
          }
        })
      } else {
        // If no reverse geocode result, just update coordinates
        onUpdate({
          block_config: {
            ...config,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
          }
        })
      }
    } catch (err) {
      console.error('Reverse geocode error:', err)
      // Still update coordinates even if reverse geocode fails
      onUpdate({
        block_config: {
          ...config,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }
      })
    }
  }, [config, onUpdate, MAPBOX_TOKEN])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      setIsUploading(true)
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])
        formData.append('fileType', 'image')

        const response = await fetch('/api/vendor/media-library/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${files[i].name}`)
        }

        const data = await response.json()
        uploadedUrls.push(data.url)
        setUploadProgress(Math.round(((i + 1) / files.length) * 100))
      }

      handleConfigUpdate('images', [...images, ...uploadedUrls])
      setIsUploading(false)
      setUploadProgress(0)
    } catch (error) {
      console.error('Image upload error:', error)
      setError('Failed to upload images')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    handleConfigUpdate('images', newImages)
  }

  return (
    <div className="space-y-4">
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => handleConfigUpdate('title', e.target.value)}
          placeholder="e.g., Where I painted this"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Location Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Find Location</label>
        <p className="text-xs text-gray-500 mb-2">
          Search for businesses, landmarks, addresses, or cities
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="e.g., Blue Bottle Coffee, Eiffel Tower, Paris..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Search results dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-lg max-h-96 overflow-y-auto">
            {searchResults.map((result) => {
              const PlaceIcon = getPlaceIcon(result.place_type, result.category)
              const placeTypeLabel = formatPlaceType(result.place_type, result.category)
              
              return (
                <button
                  key={result.id}
                  onClick={() => selectSearchResult(result)}
                  className="w-full flex items-start gap-3 px-3 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <PlaceIcon className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {result.name}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {result.display_name}
                    </div>
                    {(result.category || result.place_type !== 'place') && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                          {placeTypeLabel}
                        </span>
                        {result.address && (
                          <span className="text-xs text-gray-500 truncate">
                            {result.address}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                </button>
              )
            })}
          </div>
        )}

        {/* No results message */}
        {showSearchResults && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
          <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-lg px-4 py-3 text-center text-sm text-gray-500">
            No locations found. Try a different search term.
          </div>
        )}
      </div>

      {/* Use Current Location */}
      <button
        type="button"
        onClick={detectCurrentLocation}
        disabled={isDetectingLocation}
        className="w-full flex items-center gap-3 p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
      >
        {isDetectingLocation ? (
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        ) : (
          <Navigation className="w-5 h-5 text-indigo-500" />
        )}
        <span className="font-medium text-indigo-600">
          {isDetectingLocation ? 'Detecting...' : 'Use current location'}
        </span>
      </button>

      {/* Location Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
        <input
          type="text"
          value={config.location_name || ''}
          onChange={(e) => handleConfigUpdate('location_name', e.target.value)}
          placeholder="e.g., Montmartre, Paris"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input
            type="text"
            value={config.latitude || ''}
            onChange={(e) => handleConfigUpdate('latitude', e.target.value)}
            placeholder="e.g., 48.8867"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input
            type="text"
            value={config.longitude || ''}
            onChange={(e) => handleConfigUpdate('longitude', e.target.value)}
            placeholder="e.g., 2.3431"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Interactive Map */}
      {config.latitude && config.longitude && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interactive Map
            <span className="ml-2 text-xs text-gray-500 font-normal">(Click map to change location)</span>
          </label>
          <div className="relative h-[400px] rounded-lg overflow-hidden border-2 border-gray-300">
            <Map
              {...viewState}
              onMove={(evt) => setViewState(evt.viewState)}
              onClick={handleMapClick}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
            >
              <NavigationControl position="top-right" />
              <Marker
                longitude={parseFloat(config.longitude)}
                latitude={parseFloat(config.latitude)}
                anchor="bottom"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-rose-500 rounded-full shadow-lg flex items-center justify-center border-4 border-white">
                    <MapPin className="w-6 h-6 text-white fill-white" />
                  </div>
                  {config.location_name && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white px-3 py-1 rounded-lg shadow-lg whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-200">
                      {config.location_name}
                    </div>
                  )}
                </div>
              </Marker>
            </Map>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            💡 Tip: Click anywhere on the map to update the location, or drag to explore
          </p>
        </div>
      )}

      {/* Map Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Map Style</label>
        <select
          value={config.map_style || 'street'}
          onChange={(e) => handleConfigUpdate('map_style', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="street">Street</option>
          <option value="satellite">Satellite</option>
          <option value="artistic">Artistic</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={config.description || ''}
          onChange={(e) => handleConfigUpdate('description', e.target.value)}
          placeholder="Tell the story of this place..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Location Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Location Photos</label>
        
        {/* Existing images */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {images.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                <Image
                  src={url}
                  alt={`Location photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
        >
          {isUploading ? (
            <div>
              <Loader2 className="w-6 h-6 text-indigo-600 mx-auto mb-1 animate-spin" />
              <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <div>
              <Camera className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Add location photos</p>
            </div>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Preview hint */}
      {config.location_name && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <span className="font-medium">Preview:</span> Collectors will see a map with {images.length > 0 ? `${images.length} photo${images.length > 1 ? 's' : ''}` : 'no photos'} of {config.location_name}
        </div>
      )}
    </div>
  )
}

export default MapBlockEditor
