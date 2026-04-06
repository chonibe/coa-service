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
  enterKeyHint?: React.HTMLAttributes<HTMLInputElement>['enterKeyHint']
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}

/** Extract postal/ZIP code from formatted address when address_components lacks it */
function extractPostalFromFormatted(formatted: string): string {
  if (!formatted?.trim()) return ''
  // US ZIP: 12345 or 12345-6789
  // eslint-disable-next-line security/detect-unsafe-regex
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

/** Parse legacy Places PlaceResult */
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

/** New Places API (Place class) uses addressComponents with longText / shortText */
function parseNewPlaceToSuggestion(place: {
  id?: string
  displayName?: string
  formattedAddress?: string
  addressComponents?: Array<{ longText?: string; shortText?: string; types: string[] }>
}): AddressSuggestion | null {
  const components = place.addressComponents ?? []
  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.longText || ''
  const getShort = (type: string) =>
    components.find((c) => c.types.includes(type))?.shortText || ''

  const streetNumber = get('street_number')
  const route = get('route')
  const locality = get('locality') || get('sublocality') || get('sublocality_level_1')
  const state = getShort('administrative_area_level_1') || get('administrative_area_level_1')
  const postalFromComponents = get('postal_code') || ''
  const countryCode = getShort('country')

  const addressLine1 =
    [streetNumber, route].filter(Boolean).join(' ') || (place.displayName ?? '')

  const formattedAddress = place.formattedAddress || ''
  const postalCode = postalFromComponents || extractPostalFromFormatted(formattedAddress)

  if (!addressLine1 && !locality && !postalCode) return null

  const placeName =
    formattedAddress ||
    [addressLine1, locality, state, postalCode, countryCode].filter(Boolean).join(', ')

  return {
    id: place.id || `gp-${Date.now()}`,
    place_name: placeName,
    addressLine1,
    city: locality,
    state: state || undefined,
    postalCode,
    country: countryCode,
  }
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === 'function') ref(value)
      else (ref as React.MutableRefObject<T | null>).current = value
    }
  }
}

type WidgetMode = 'pending' | 'legacy' | 'element'

export const GooglePlacesAddressInput = React.forwardRef<
  HTMLInputElement,
  GooglePlacesAddressInputProps
>(function GooglePlacesAddressInput(
  {
    id,
    value,
    onChange,
    onSelect,
    country,
    placeholder = 'Street address',
    className,
    disabled,
    enterKeyHint,
    inputMode,
  },
  forwardedRef
) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null)
  const elementHostRef = React.useRef<HTMLDivElement>(null)
  const placeAutocompleteElRef = React.useRef<
    google.maps.places.PlaceAutocompleteElement | null
  >(null)

  const [widgetMode, setWidgetMode] = React.useState<WidgetMode>('pending')
  const [scriptLoaded, setScriptLoaded] = React.useState(false)

  const onChangeRef = React.useRef(onChange)
  const onSelectRef = React.useRef(onSelect)
  onChangeRef.current = onChange
  onSelectRef.current = onSelect

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  const countryRef = React.useRef(country)
  countryRef.current = country

  React.useEffect(() => {
    if (!apiKey || typeof window === 'undefined') return

    const markReady = () => {
      const g = window.google?.maps as
        | (typeof google.maps & {
            importLibrary?: (name: string) => Promise<unknown>
          })
        | undefined
      if (!g?.importLibrary) {
        setWidgetMode(typeof google.maps.places?.Autocomplete === 'function' ? 'legacy' : 'pending')
        setScriptLoaded(true)
        return
      }
      void g
        .importLibrary('places')
        .then((lib: unknown) => {
          const L = lib as {
            PlaceAutocompleteElement?: new (opts?: object) => google.maps.places.PlaceAutocompleteElement
          }
          if (typeof L.PlaceAutocompleteElement === 'function') {
            setWidgetMode('element')
          } else {
            setWidgetMode('legacy')
          }
          setScriptLoaded(true)
        })
        .catch(() => {
          setWidgetMode(typeof google.maps.places?.Autocomplete === 'function' ? 'legacy' : 'pending')
          setScriptLoaded(true)
        })
    }

    if (window.google?.maps?.importLibrary) {
      markReady()
      return
    }
    if (window.google?.maps?.places?.Autocomplete) {
      markReady()
      return
    }

    const existing = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existing) {
      const check = () => {
        if (window.google?.maps?.importLibrary || window.google?.maps?.places?.Autocomplete) {
          markReady()
        } else {
          setTimeout(check, 100)
        }
      }
      check()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => markReady()
    document.head.appendChild(script)
  }, [apiKey])

  /** New PlaceAutocompleteElement (required for Google Cloud projects created after March 2025). */
  React.useLayoutEffect(() => {
    if (!scriptLoaded || widgetMode !== 'element' || !elementHostRef.current || !apiKey) return
    const host = elementHostRef.current
    host.textContent = ''

    const constCtor = (
      google.maps.places as typeof google.maps.places & {
        PlaceAutocompleteElement?: new (opts?: object) => google.maps.places.PlaceAutocompleteElement
      }
    ).PlaceAutocompleteElement
    if (typeof constCtor !== 'function') {
      setWidgetMode('legacy')
      return
    }

    const c = countryRef.current
    const el = new constCtor({
      placeholder,
      includedRegionCodes: c?.trim() ? [c.trim().toLowerCase()] : [],
    })
    el.id = id
    if (disabled) {
      try {
        ;(el as { disabled?: boolean }).disabled = true
      } catch {
        /* optional property */
      }
    }
    el.className = cn(
      inputBase.replace(/^flex /, ''),
      'flex w-full min-h-10 items-center',
      className
    )
    el.value = value
    host.appendChild(el)
    placeAutocompleteElRef.current = el

    const assignForwardedToInnerInput = () => {
      try {
        const inner = (el as { input?: HTMLInputElement }).input
        if (!inner || !forwardedRef) return
        if (typeof forwardedRef === 'function') forwardedRef(inner)
        else (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = inner
      } catch {
        /* shadow DOM timing */
      }
    }
    queueMicrotask(assignForwardedToInnerInput)

    const onGmpSelect = async (ev: Event) => {
      const e = ev as unknown as { placePrediction?: { toPlace: () => google.maps.places.Place } }
      const pred = e.placePrediction
      if (!pred) return
      const place = pred.toPlace()
      try {
        await place.fetchFields({
          fields: ['addressComponents', 'formattedAddress', 'displayName', 'id'],
        })
      } catch {
        return
      }
      const suggestion = parseNewPlaceToSuggestion(place)
      if (suggestion) {
        onChangeRef.current(suggestion.addressLine1)
        onSelectRef.current?.(suggestion)
      }
    }

    const onInput = () => {
      try {
        onChangeRef.current((el as { value: string }).value ?? '')
      } catch {
        /* */
      }
    }

    el.addEventListener('gmp-select', onGmpSelect)
    el.addEventListener('input', onInput)

    return () => {
      el.removeEventListener('gmp-select', onGmpSelect)
      el.removeEventListener('input', onInput)
      host.textContent = ''
      placeAutocompleteElRef.current = null
      if (forwardedRef && typeof forwardedRef !== 'function') {
        (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = null
      }
    }
    /* className / value / forwardedRef: synced outside this effect to avoid tearing down PlaceAutocompleteElement */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded, widgetMode, apiKey, id, placeholder, disabled])

  React.useEffect(() => {
    const el = placeAutocompleteElRef.current
    if (!el || widgetMode !== 'element') return
    try {
      const c = country?.trim()
      ;(el as { includedRegionCodes?: string[] }).includedRegionCodes = c ? [c.toLowerCase()] : []
    } catch {
      /* */
    }
  }, [country, widgetMode])

  React.useEffect(() => {
    const el = placeAutocompleteElRef.current
    if (!el || widgetMode !== 'element') return
    try {
      if ((el as { value: string }).value !== value) {
        ;(el as { value: string }).value = value
      }
    } catch {
      /* */
    }
  }, [value, widgetMode])

  /** Legacy Autocomplete — still used when importLibrary / PlaceAutocompleteElement unavailable. */
  React.useLayoutEffect(() => {
    if (!scriptLoaded || widgetMode !== 'legacy' || !inputRef.current || !apiKey) return
    const inputEl = inputRef.current
    const c = countryRef.current
    const opts: google.maps.places.AutocompleteOptions = {
      types: ['geocode'],
      fields: ['address_components', 'formatted_address', 'place_id', 'name'],
      componentRestrictions: c?.trim() ? { country: c.toLowerCase() } : undefined,
    }
    let ac: google.maps.places.Autocomplete
    try {
      ac = new google.maps.places.Autocomplete(inputEl, opts)
    } catch {
      return
    }
    autocompleteRef.current = ac
    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place) return
      const suggestion = parsePlaceResult(place)
      if (suggestion) {
        onChangeRef.current(suggestion.addressLine1)
        onSelectRef.current?.(suggestion)
      }
    })
    return () => {
      if (typeof google === 'undefined') {
        autocompleteRef.current = null
        return
      }
      google.maps.event.removeListener(listener)
      google.maps.event.clearInstanceListeners(ac)
      autocompleteRef.current = null
    }
  }, [scriptLoaded, widgetMode, apiKey])

  React.useEffect(() => {
    const ac = autocompleteRef.current
    if (!ac || typeof google === 'undefined' || widgetMode !== 'legacy') return
    try {
      if (country?.trim()) {
        ac.setComponentRestrictions({ country: country.toLowerCase() })
      } else {
        ac.setComponentRestrictions(null)
      }
    } catch {
      /* */
    }
  }, [country, widgetMode])

  if (!apiKey) return null

  if (widgetMode === 'element' && scriptLoaded) {
    return <div ref={elementHostRef} className="w-full min-h-[2.5rem]" />
  }

  return (
    <input
      ref={mergeRefs(inputRef, forwardedRef)}
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
      enterKeyHint={enterKeyHint}
      inputMode={inputMode}
      className={cn(inputBase, className)}
    />
  )
})

GooglePlacesAddressInput.displayName = 'GooglePlacesAddressInput'
