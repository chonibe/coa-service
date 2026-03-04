'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AddressSuggestion {
  id: string
  place_name: string
  addressLine1: string
  city: string
  state?: string
  postalCode: string
  country: string
}

const inputBase =
  'flex h-10 w-full rounded-lg border border-neutral-200 dark:!border-neutral-600 bg-white dark:!bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:!text-white placeholder:text-neutral-500 dark:placeholder:!text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50'

export interface GooglePlacesAddressInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: AddressSuggestion) => void
  country?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  autoComplete?: string
}

/** Extract postal/ZIP code from formatted address when address_components lacks it */
function extractPostalFromFormatted(formatted: string): string {
  if (!formatted?.trim()) return ''
  // US ZIP: 12345 or 12345-6789
  const us = formatted.match(/\b(\d{5}(?:-\d{4})?)\b/)
  if (us) return us[1]
  // UK postcode: SW1A 1AA, E1 6AN, etc.
  const uk = formatted.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i)
  if (uk) return uk[1].trim()
  // Generic 4–6 digit postal codes (common in many countries)
  const generic = formatted.match(/\b(\d{4,6})\b/)
  if (generic) return generic[1]
  return ''
}

/** Parse Google Places address_components into structured address (includes postal_code/ZIP) */
function parsePlaceResult(place: google.maps.places.PlaceResult): AddressSuggestion | null {
  const components = place.address_components || []
  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name || ''
  const getShort = (type: string) =>
    components.find((c) => c.types.includes(type))?.short_name || ''

  const streetNumber = get('street_number')
  const route = get('route')
  const locality = get('locality') || get('sublocality') || get('sublocality_level_1')
  const state = getShort('administrative_area_level_1') || get('administrative_area_level_1')
  const postalFromComponents = get('postal_code') || get('postal_code_prefix')
  const country = getShort('country')

  const addressLine1 = [streetNumber, route].filter(Boolean).join(' ') || place.name || ''

  const formattedAddress = place.formatted_address || ''
  const postalCode =
    postalFromComponents || extractPostalFromFormatted(formattedAddress)

  if (!addressLine1 && !locality && !postalCode) return null

  const placeName =
    formattedAddress ||
    [addressLine1, locality, state, postalCode, country].filter(Boolean).join(', ')

  return {
    id: place.place_id || `gp-${Date.now()}`,
    place_name: placeName,
    addressLine1,
    city: locality,
    state: state || undefined,
    postalCode,
    country,
  }
}

export function GooglePlacesAddressInput({
  id,
  value,
  onChange,
  onSelect,
  country,
  placeholder = 'Street address',
  className,
  disabled,
  autoComplete,
}: GooglePlacesAddressInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null)
  const [scriptLoaded, setScriptLoaded] = React.useState(false)
  const onChangeRef = React.useRef(onChange)
  const onSelectRef = React.useRef(onSelect)
  onChangeRef.current = onChange
  onSelectRef.current = onSelect
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  React.useEffect(() => {
    if (!apiKey || typeof window === 'undefined') return
    if (window.google?.maps?.places?.Autocomplete) {
      setScriptLoaded(true)
      return
    }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existing) {
      const check = () => {
        if (window.google?.maps?.places?.Autocomplete) setScriptLoaded(true)
        else setTimeout(check, 100)
      }
      check()
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setScriptLoaded(true)
    document.head.appendChild(script)
  }, [apiKey])

  React.useEffect(() => {
    if (!scriptLoaded || !inputRef.current || !apiKey) return
    const opts: google.maps.places.AutocompleteOptions = {
      types: ['geocode'],
      fields: ['address_components', 'formatted_address', 'place_id', 'name'],
      componentRestrictions: country ? { country: country.toLowerCase() } : undefined,
    }
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, opts)
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()
      if (!place) return
      const suggestion = parsePlaceResult(place)
      if (suggestion) {
        onChangeRef.current(suggestion.addressLine1)
        onSelectRef.current?.(suggestion)
      }
    })
    return () => {
      if (typeof google !== 'undefined' && autocompleteRef.current && listener) {
        google.maps.event.removeListener(listener)
      }
    }
  }, [scriptLoaded, apiKey, country])

  if (!apiKey) return null

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
      className={cn(inputBase, className)}
      role="combobox"
      aria-autocomplete="list"
    />
  )
}
