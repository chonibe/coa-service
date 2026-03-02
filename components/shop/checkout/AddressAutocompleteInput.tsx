'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'

export interface AddressSuggestion {
  id: string
  place_name: string
  addressLine1: string
  city: string
  state?: string
  postalCode: string
  country: string
}

export interface AddressAutocompleteInputProps {
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

export function AddressAutocompleteInput({
  id,
  value,
  onChange,
  onSelect,
  country,
  placeholder = 'Street address',
  className,
  disabled,
  autoComplete,
}: AddressAutocompleteInputProps) {
  const [suggestions, setSuggestions] = React.useState<AddressSuggestion[]>([])
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = React.useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions([])
        return
      }
      setIsLoading(true)
      try {
        const params = new URLSearchParams({ q: query })
        if (country) params.set('country', country)
        const res = await fetch(`/api/mapbox/address-autocomplete?${params}`)
        const data = await res.json()
        setSuggestions(data.results || [])
        setIsOpen(true)
      } catch (err) {
        console.error('[AddressAutocomplete] Fetch error:', err)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    },
    [country]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    onChange(v)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (v.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }
    timeoutRef.current = setTimeout(() => fetchSuggestions(v), 300)
  }

  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.addressLine1)
    onSelect?.(suggestion)
    setSuggestions([])
    setIsOpen(false)
  }

  const handleFocus = () => {
    if (suggestions.length > 0) setIsOpen(true)
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={className}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={isOpen ? `${id}-listbox` : undefined}
      />
      {isOpen && suggestions.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-[210] mt-1 w-full rounded-md border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((s) => (
            <li
              key={s.id}
              role="option"
              tabIndex={0}
              className="cursor-pointer px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50"
              onMouseDown={() => handleSelect(s)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelect(s)
                }
              }}
            >
              <span className="font-medium">{s.place_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
