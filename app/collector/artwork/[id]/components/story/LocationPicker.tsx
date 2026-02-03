"use client"

import { useState, useEffect } from "react"
import { 
  X, 
  MapPin, 
  Loader2, 
  Navigation, 
  ChevronRight,
  Search
} from "lucide-react"
import type { LocationData } from "@/lib/story/types"
import { COMMON_COUNTRIES, getCountryFlag } from "@/lib/story/types"

interface LocationPickerProps {
  currentLocation: LocationData | null
  onSelect: (location: LocationData) => void
  onClose: () => void
}

/**
 * LocationPicker - Bottom sheet for selecting location
 * 
 * Features:
 * - Auto-detect via Geolocation API
 * - Manual city input
 * - Country selection from common list
 */
export function LocationPicker({
  currentLocation,
  onSelect,
  onClose,
}: LocationPickerProps) {
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(null)
  const [manualCity, setManualCity] = useState(currentLocation?.city || '')
  const [selectedCountry, setSelectedCountry] = useState(
    currentLocation?.country_code || ''
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation()
  }, [])

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setIsDetecting(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocode using a free API
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          const data = await response.json()

          const location: LocationData = {
            city: data.city || data.locality || '',
            country: data.countryName || '',
            country_code: data.countryCode || '',
            latitude,
            longitude,
          }

          setDetectedLocation(location)
          setManualCity(location.city || '')
          setSelectedCountry(location.country_code || '')
        } catch (err) {
          console.error('Reverse geocode error:', err)
          setError('Could not determine your city')
        } finally {
          setIsDetecting(false)
        }
      },
      (err) => {
        console.error('Geolocation error:', err)
        setError('Could not access your location')
        setIsDetecting(false)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  const handleConfirm = () => {
    const country = COMMON_COUNTRIES.find(c => c.code === selectedCountry)
    
    onSelect({
      city: manualCity.trim() || undefined,
      country: country?.name,
      country_code: selectedCountry || undefined,
    })
  }

  const filteredCountries = searchQuery
    ? COMMON_COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COMMON_COUNTRIES

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm">
      <div 
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-hidden flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            Add Location
          </h2>
          <button
            onClick={handleConfirm}
            disabled={!selectedCountry}
            className="px-4 py-1.5 bg-indigo-500 text-white text-sm font-medium rounded-full disabled:opacity-50"
          >
            Done
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Auto-detect section */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={detectLocation}
              disabled={isDetecting}
              className="w-full flex items-center gap-3 p-3 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              {isDetecting ? (
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5 text-indigo-500" />
              )}
              <div className="flex-1 text-left">
                <div className="font-medium text-indigo-600">
                  Use current location
                </div>
                {detectedLocation && (
                  <div className="text-sm text-indigo-500/70">
                    {detectedLocation.city}, {detectedLocation.country}
                  </div>
                )}
              </div>
              {detectedLocation && <ChevronRight className="w-5 h-5 text-indigo-400" />}
            </button>

            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Manual city input */}
          <div className="p-4 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City (optional)
            </label>
            <input
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder="Enter city name"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Country selection */}
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search countries..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-400 text-sm"
              />
            </div>

            {/* Country list */}
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => setSelectedCountry(country.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    selectedCountry === country.code
                      ? 'bg-indigo-100'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{getCountryFlag(country.code)}</span>
                  <span className={`flex-1 text-left ${
                    selectedCountry === country.code
                      ? 'text-indigo-600 font-medium'
                      : 'text-gray-700'
                  }`}>
                    {country.name}
                  </span>
                  {selectedCountry === country.code && (
                    <MapPin className="w-4 h-4 text-indigo-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocationPicker
