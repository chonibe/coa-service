'use client'

import { useState, useEffect } from 'react'
import { COUNTRY_OPTIONS, type CountryOption } from '@/lib/data/countries'

/**
 * Fetches shipping countries from Shopify store settings.
 * Falls back to static COUNTRY_OPTIONS if fetch fails.
 */
export function useShippingCountries(): CountryOption[] {
  const [countries, setCountries] = useState<CountryOption[]>(COUNTRY_OPTIONS)

  useEffect(() => {
    fetch('/api/shopify/shipping-countries')
      .then((r) => r.json())
      .then((data: { countries?: CountryOption[] }) => {
        if (data.countries?.length) {
          setCountries(data.countries)
        }
      })
      .catch(() => {})
  }, [])

  return countries
}
