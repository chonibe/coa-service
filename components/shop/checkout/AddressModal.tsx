'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, MapPin, Search, ChevronDown, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExperienceTheme } from '@/app/(store)/shop/experience-v2/ExperienceThemeContext'
import { Button } from '@/components/ui'
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '@/components/ui'
import {
  COUNTRY_PHONE_CODES,
  PHONE_DIAL_OPTIONS,
  PHONE_CODE_TO_COUNTRY,
  getPhoneCodeForCountry,
} from '@/lib/data/countries'
import { getStatesForCountry } from '@/lib/data/states'
import type { CheckoutAddress } from '@/lib/shop/CheckoutContext'
import { useSaveAddressToAccount } from '@/lib/shop/useSaveAddressToAccount'
import { useSavedAddresses } from '@/lib/shop/useSavedAddresses'
import { useShippingCountries } from '@/lib/shop/useShippingCountries'
import { GooglePlacesAddressInput } from './GooglePlacesAddressInput'
import { useMobile } from '@/hooks/use-mobile'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function flagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐'
  const offset = 127397
  return [...countryCode.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join('')
}

function phoneCountryToCountry(dialCode: string): string {
  return PHONE_CODE_TO_COUNTRY[dialCode] ?? 'US'
}

/**
 * Slide-over phone country list only when the dialog is in the bottom-sheet layout (Tailwind &lt; sm, 640px).
 * From `sm:` up the dialog is centered like desktop; using the same breakpoint avoids a second panel beside the form.
 */
function useNarrowViewportForPhoneCountrySheet() {
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return () => {}
    }
    const mq = window.matchMedia('(max-width: 639px)')
    mq.addEventListener('change', onStoreChange)
    return () => mq.removeEventListener('change', onStoreChange)
  }, [])
  const getSnapshot = React.useCallback(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }
    try {
      return window.matchMedia('(max-width: 639px)').matches
    } catch {
      return false
    }
  }, [])
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AddressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialAddress?: CheckoutAddress | null
  onSave: (address: CheckoutAddress) => void
  /** When provided and complete, shows "Same as billing" option to use billing as delivery address */
  billingAddress?: CheckoutAddress | null
  /** 'shipping' | 'billing' — enables browser autofill from saved addresses (shipping/billing prefixes) */
  addressType?: 'shipping' | 'billing'
  /** Field to highlight/focus when modal opens (e.g., 'email', 'postalCode') */
  highlightField?: MissingField
}

const emptyAddress: CheckoutAddress = {
  email: '',
  fullName: '',
  country: 'US',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  phoneCountryCode: '+1',
  phoneNumber: '',
}

export type MissingField =
  | 'email'
  | 'fullName'
  | 'country'
  | 'addressLine1'
  | 'city'
  | 'postalCode'
  | 'phoneNumber'
  | null

// Per-field validators returning an error string or null
const fieldValidators: Partial<Record<keyof CheckoutAddress, (v: string) => string | null>> = {
  email: (v) => {
    if (!v.trim()) return 'Please enter your email.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Please enter a valid email.'
    return null
  },
  fullName: (v) => {
    if (!v.trim()) return 'Please enter your full name.'
    if (v.trim().split(/\s+/).length < 2) return 'Please include first and last name.'
    return null
  },
  addressLine1: (v) => (!v.trim() ? 'Please enter your street address.' : null),
  city: (v) => (!v.trim() ? 'Please enter your city.' : null),
  postalCode: (v) => (!v.trim() ? 'Please enter your postal code.' : null),
  phoneNumber: (v) => (!v.trim() ? 'Please enter your phone number.' : null),
}

function validateAddress(
  addr: Partial<CheckoutAddress>
): { error: string; field: MissingField } | null {
  if (!addr.email?.trim()) return { error: 'Please enter your email.', field: 'email' }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(addr.email.trim()))
    return { error: 'Please enter a valid email.', field: 'email' }
  if (!addr.fullName?.trim())
    return { error: 'Please insert your full name (first and last name).', field: 'fullName' }
  const nameParts = addr.fullName.trim().split(/\s+/)
  if (nameParts.length < 2)
    return { error: 'Please insert your full name (first and last name).', field: 'fullName' }
  if (!addr.country?.trim()) return { error: 'Please select your country.', field: 'country' }
  if (!addr.addressLine1?.trim())
    return { error: 'Please enter address line 1.', field: 'addressLine1' }
  if (!addr.city?.trim()) return { error: 'Please enter your city.', field: 'city' }
  if (!addr.postalCode?.trim())
    return { error: 'Please enter your postal code.', field: 'postalCode' }
  if (!addr.phoneNumber?.trim())
    return { error: 'Please enter your phone number.', field: 'phoneNumber' }
  return null
}

export function getMissingAddressField(addr: CheckoutAddress | null): MissingField {
  if (!addr) return 'email'
  const validation = validateAddress(addr)
  return validation?.field || null
}

function isAddressComplete(addr: CheckoutAddress | null | undefined): boolean {
  return !!addr && validateAddress(addr) === null
}

function formatAddressShort(addr: CheckoutAddress): string {
  const parts = [addr.addressLine1, addr.city, addr.state, addr.postalCode].filter(Boolean)
  return parts.join(', ')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddressModal({
  open,
  onOpenChange,
  initialAddress,
  onSave,
  billingAddress,
  addressType = 'shipping',
  highlightField,
}: AddressModalProps) {
  const { theme } = useExperienceTheme()
  const countryOptions = useShippingCountries()
  const { saveShippingAddress, saveBillingAddress } = useSaveAddressToAccount()
  const { addresses: savedAddresses } = useSavedAddresses()
  const ac = (field: string) => (addressType ? `${addressType} ${field}` : field)
  const isDark = theme === 'dark'

  const savedAddressesToShow = React.useMemo(() => {
    return savedAddresses.map(({ id, address, label }) => ({
      id,
      addr: address,
      label: label || 'Saved address',
    }))
  }, [savedAddresses])

  // Form state
  const [form, setForm] = React.useState<CheckoutAddress>(
    () => initialAddress ?? { ...emptyAddress }
  )
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const [highlightedField, setHighlightedField] = React.useState<MissingField>(
    highlightField || null
  )
  // Per-field inline errors (shown on blur)
  const [fieldErrors, setFieldErrors] = React.useState<Partial<Record<keyof CheckoutAddress, string>>>({})
  // Fields that have been touched (blurred at least once)
  const [touchedFields, setTouchedFields] = React.useState<Partial<Record<keyof CheckoutAddress, boolean>>>({})

  const isMobile = useMobile()
  const narrowPhoneCountrySheet = useNarrowViewportForPhoneCountrySheet()

  // UI state
  const [sameAsBilling, setSameAsBilling] = React.useState(false)
  const [addressExpanded, setAddressExpanded] = React.useState(false)
  const [showLine2, setShowLine2] = React.useState(false)
  const [showCountryPicker, setShowCountryPicker] = React.useState(false)
  const [showPhonePicker, setShowPhonePicker] = React.useState(false)
  const [countrySearch, setCountrySearch] = React.useState('')
  const countrySearchRef = React.useRef<HTMLInputElement>(null)

  // Location state
  const [locationLoading, setLocationLoading] = React.useState(false)
  const [locationError, setLocationError] = React.useState<string | null>(null)

  // ZIP autofill
  const [zipAutofillLoading, setZipAutofillLoading] = React.useState(false)
  const zipAutofillTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Field refs for focus management
  const emailRef = React.useRef<HTMLInputElement>(null)
  const fullNameRef = React.useRef<HTMLInputElement>(null)
  const addressLine1Ref = React.useRef<HTMLInputElement>(null)
  const cityRef = React.useRef<HTMLInputElement>(null)
  const postalCodeRef = React.useRef<HTMLInputElement>(null)
  const phoneNumberRef = React.useRef<HTMLInputElement>(null)

  const hasValidBilling = isAddressComplete(billingAddress)

  // Apply dark mode to Google Places .pac-container
  React.useEffect(() => {
    if (open && isDark) {
      document.body.setAttribute('data-pac-dark', 'true')
      return () => document.body.removeAttribute('data-pac-dark')
    }
  }, [open, isDark])

  // Reset form on open
  React.useEffect(() => {
    if (open) {
      setForm(initialAddress ?? { ...emptyAddress })
      setValidationError(null)
      setSameAsBilling(false)
      setLocationError(null)
      setFieldErrors({})
      setTouchedFields({})
      setAddressExpanded(
        !!(
          initialAddress?.addressLine1 ||
          initialAddress?.city ||
          initialAddress?.postalCode ||
          initialAddress?.phoneNumber
        )
      )
      setShowLine2(!!(initialAddress?.addressLine2))
      setShowCountryPicker(false)
      setShowPhonePicker(false)
      setCountrySearch('')
      setHighlightedField(highlightField || null)
    }
  }, [open, initialAddress, highlightField])

  // Focus country search when picker opens
  React.useEffect(() => {
    if (showCountryPicker) {
      setTimeout(() => countrySearchRef.current?.focus(), 50)
    } else {
      setCountrySearch('')
    }
  }, [showCountryPicker])

  // Centered dialog (sm+) uses Select; never leave the slide sheet open after resize.
  React.useEffect(() => {
    if (!narrowPhoneCountrySheet) setShowPhonePicker(false)
  }, [narrowPhoneCountrySheet])

  // Focus highlighted field when modal opens
  React.useEffect(() => {
    if (!open || !highlightedField) return
    const timer = setTimeout(() => {
      switch (highlightedField) {
        case 'email': emailRef.current?.focus(); break
        case 'fullName': fullNameRef.current?.focus(); break
        case 'addressLine1':
          addressLine1Ref.current?.focus()
          setAddressExpanded(true)
          break
        case 'city':
          cityRef.current?.focus()
          setAddressExpanded(true)
          break
        case 'postalCode':
          postalCodeRef.current?.focus()
          setAddressExpanded(true)
          break
        case 'phoneNumber':
          phoneNumberRef.current?.focus()
          setAddressExpanded(true)
          break
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [open, highlightedField])

  // Auto-set country from geo / browser locale
  React.useEffect(() => {
    if (!open) return
    if (initialAddress?.country) return
    const applyCountry = (code: string) => {
      const upper = code.toUpperCase()
      if (countryOptions.some((c) => c.code === upper)) {
        setForm((p) => ({
          ...p,
          country: upper,
          phoneCountryCode: getPhoneCodeForCountry(upper),
          state: '',
        }))
      }
    }
    fetch('/api/geo/country')
      .then((r) => r.json())
      .then((data: { country: string | null }) => {
        if (data.country) { applyCountry(data.country); return }
        let region: string | undefined
        try {
          region = typeof Intl !== 'undefined' && navigator.language
            ? (new (Intl as any).Locale(navigator.language).region as string)
            : navigator.language?.split('-')[1]
        } catch { region = navigator.language?.split('-')[1] }
        if (region) applyCountry(region)
      })
      .catch(() => {
        let region: string | undefined
        try {
          region = typeof Intl !== 'undefined' && navigator.language
            ? (new (Intl as any).Locale(navigator.language).region as string)
            : navigator.language?.split('-')[1]
        } catch { region = navigator.language?.split('-')[1] }
        if (region) applyCountry(region)
      })
  }, [open, initialAddress, countryOptions])

  React.useEffect(() => {
    if (form.country && !COUNTRY_PHONE_CODES[form.country]) {
      setForm((p) => ({ ...p, phoneCountryCode: getPhoneCodeForCountry(form.country) }))
    }
  }, [form.country])

  // ZIP autofill via forward geocoding
  React.useEffect(() => {
    if (zipAutofillTimeoutRef.current) {
      clearTimeout(zipAutofillTimeoutRef.current)
      zipAutofillTimeoutRef.current = null
    }
    const shouldAutofill =
      form.addressLine1?.trim() &&
      form.city?.trim() &&
      form.country?.trim() &&
      !form.postalCode?.trim() &&
      addressExpanded
    if (!shouldAutofill) return
    zipAutofillTimeoutRef.current = setTimeout(async () => {
      setZipAutofillLoading(true)
      try {
        const params = new URLSearchParams({
          address: form.addressLine1,
          city: form.city,
          ...(form.state && { state: form.state }),
          ...(form.country && { country: form.country }),
        })
        const res = await fetch(`/api/geo/forward?${params.toString()}`)
        if (!res.ok) throw new Error('Geocoding failed')
        const data = await res.json()
        if (data.postalCode && !form.postalCode?.trim()) {
          setForm((p) => ({ ...p, postalCode: data.postalCode }))
        }
      } catch (err) {
        console.debug('[AddressModal] Zip autofill failed:', err)
      } finally {
        setZipAutofillLoading(false)
      }
    }, 800)
    return () => {
      if (zipAutofillTimeoutRef.current) clearTimeout(zipAutofillTimeoutRef.current)
    }
  }, [form.addressLine1, form.city, form.state, form.country, form.postalCode, addressExpanded])

  // Browser autofill sync
  const formRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!open) return
    const syncFromAutofill = () => {
      const root = formRef.current
      if (!root) return
      const updates: Partial<CheckoutAddress> = {}
      const emailEl = root.querySelector<HTMLInputElement>('[data-testid="address-email"], #address-email')
      const fullNameEl = root.querySelector<HTMLInputElement>('#address-fullname')
      const line1El = root.querySelector<HTMLInputElement>('#address-line1')
      const line2El = root.querySelector<HTMLInputElement>('#address-line2')
      const cityEl = root.querySelector<HTMLInputElement>('#address-city')
      const postalEl = root.querySelector<HTMLInputElement>('#address-postal')
      const phoneEl = root.querySelector<HTMLInputElement>('#address-phone')
      const countrySelect = root.querySelector<HTMLSelectElement>('#address-country-native')
      if (emailEl?.value) updates.email = emailEl.value
      if (fullNameEl?.value) updates.fullName = fullNameEl.value
      if (line1El?.value) updates.addressLine1 = line1El.value
      if (line2El?.value) updates.addressLine2 = line2El.value
      if (cityEl?.value) updates.city = cityEl.value
      if (postalEl?.value) updates.postalCode = postalEl.value
      const hasTextAutofill = !!(updates.email || updates.fullName || updates.addressLine1 || updates.city || updates.postalCode)
      if (hasTextAutofill && countrySelect?.value && countryOptions.some((c) => c.code === countrySelect!.value)) {
        updates.country = countrySelect.value
        updates.phoneCountryCode = getPhoneCodeForCountry(countrySelect.value)
      }
      if (phoneEl?.value) {
        const raw = phoneEl.value.trim()
        const plusMatch = raw.match(/^(\+\d{1,4})\s*(.*)$/)
        if (plusMatch) {
          const [, code, rest] = plusMatch
          const dial = code!
          if (PHONE_DIAL_OPTIONS.some((o) => o.dial === dial)) {
            updates.phoneCountryCode = dial
            updates.phoneNumber = rest.replace(/\D/g, '')
          } else {
            updates.phoneNumber = raw.replace(/\D/g, '')
          }
          const inferred = PHONE_CODE_TO_COUNTRY[dial]
          if (inferred && !updates.country && hasTextAutofill) updates.country = inferred
        } else {
          updates.phoneNumber = raw.replace(/\D/g, '')
        }
      }
      if (Object.keys(updates).length > 0) setForm((p) => ({ ...p, ...updates }))
    }
    let intervalId: ReturnType<typeof setInterval> | null = null
    const startId = setTimeout(() => {
      intervalId = setInterval(syncFromAutofill, 150)
      setTimeout(() => { if (intervalId) clearInterval(intervalId) }, 2500)
    }, 100)
    return () => {
      clearTimeout(startId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [open, countryOptions])

  // Handlers
  const handleCountryChange = (code: string) => {
    const phoneCode = getPhoneCodeForCountry(code)
    setForm((p) => ({ ...p, country: code, phoneCountryCode: phoneCode, state: '' }))
  }

  const handleBlur = (field: keyof CheckoutAddress, value: string) => {
    setTouchedFields((p) => ({ ...p, [field]: true }))
    const validator = fieldValidators[field]
    if (validator) {
      const err = validator(value)
      setFieldErrors((p) => ({ ...p, [field]: err ?? undefined }))
    }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Location services are not available')
      return
    }
    setLocationLoading(true)
    setLocationError(null)
    setAddressExpanded(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(
            `/api/geo/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
          )
          if (!res.ok) throw new Error('Reverse geocode failed')
          const data = await res.json()
          const addr = data.address || {}
          const house =
            [addr.house_number, addr.road].filter(Boolean).join(' ') ||
            data.display_name?.split(',')[0] ||
            ''
          const city = addr.city || addr.town || addr.village || addr.municipality || ''
          const state = addr.state || ''
          const postalCode = addr.postcode || ''
          const countryCode = (addr.country_code || '').toUpperCase()
          const validCountry =
            countryCode && countryOptions.some((c) => c.code === countryCode)
              ? countryCode
              : undefined
          setForm((p) => ({
            ...p,
            addressLine1: house || p.addressLine1,
            city: city || p.city,
            state: state || p.state,
            postalCode: postalCode || p.postalCode,
            ...(validCountry && {
              country: validCountry,
              phoneCountryCode: getPhoneCodeForCountry(validCountry),
              state: state || '',
            }),
          }))
        } catch {
          setLocationError('Could not get address from location')
        } finally {
          setLocationLoading(false)
        }
      },
      (err) => {
        setLocationError(err.code === 1 ? 'Location permission denied' : 'Could not get your location')
        setLocationLoading(false)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  const statesForCountry = React.useMemo(() => getStatesForCountry(form.country), [form.country])
  const hasStateDropdown = statesForCountry.length > 0

  const handlePhoneChange = (raw: string) => {
    const plusMatch = raw.trim().match(/^(\+\d{1,4})\s*(.*)$/)
    if (plusMatch) {
      const [, code, rest] = plusMatch
      const dial = code!
      if (PHONE_DIAL_OPTIONS.some((o) => o.dial === dial)) {
        const updates: Partial<CheckoutAddress> = {
          phoneCountryCode: dial,
          phoneNumber: rest.replace(/\D/g, ''),
        }
        const inferred = PHONE_CODE_TO_COUNTRY[dial]
        if (inferred) { updates.country = inferred; updates.state = '' }
        setForm((p) => ({ ...p, ...updates }))
        return
      }
    }
    setForm((p) => ({ ...p, phoneNumber: raw.replace(/\D/g, '') }))
  }

  const handleDone = () => {
    if (sameAsBilling && hasValidBilling && billingAddress) {
      onSave(billingAddress)
      if (addressType === 'shipping') saveShippingAddress(billingAddress)
      else saveBillingAddress(billingAddress)
      onOpenChange(false)
      return
    }
    const validation = validateAddress(form)
    if (validation) {
      setValidationError(validation.error)
      setHighlightedField(validation.field)
      // Mark all fields as touched to show all inline errors
      const allTouched: Partial<Record<keyof CheckoutAddress, boolean>> = {}
      const allErrors: Partial<Record<keyof CheckoutAddress, string>> = {}
      ;(Object.keys(fieldValidators) as (keyof CheckoutAddress)[]).forEach((field) => {
        allTouched[field] = true
        const err = fieldValidators[field]?.(String(form[field] ?? ''))
        if (err) allErrors[field] = err
      })
      setTouchedFields(allTouched)
      setFieldErrors(allErrors)
      setTimeout(() => {
        const fieldMap: Record<string, React.RefObject<HTMLInputElement>> = {
          email: emailRef,
          fullName: fullNameRef,
          addressLine1: addressLine1Ref,
          city: cityRef,
          postalCode: postalCodeRef,
          phoneNumber: phoneNumberRef,
        }
        if (validation.field) {
          if (validation.field === 'addressLine1' || validation.field === 'city' ||
              validation.field === 'postalCode' || validation.field === 'phoneNumber') {
            setAddressExpanded(true)
          }
          fieldMap[validation.field]?.current?.focus()
          fieldMap[validation.field]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 50)
      return
    }
    setValidationError(null)
    setHighlightedField(null)
    onSave(form)
    if (addressType === 'shipping') saveShippingAddress(form)
    else saveBillingAddress(form)
    onOpenChange(false)
  }

  // Field state helpers
  const isFieldValid = (field: keyof CheckoutAddress): boolean => {
    if (!touchedFields[field]) return false
    const validator = fieldValidators[field]
    if (!validator) return false
    return validator(String(form[field] ?? '')) === null
  }

  const getFieldError = (field: keyof CheckoutAddress): string | undefined => {
    if (!touchedFields[field]) return undefined
    return fieldErrors[field]
  }

  // Shared input class
  const inputClass = (field: keyof CheckoutAddress, extra?: string) => {
    const hasError = !!getFieldError(field) || highlightedField === field
    const isValid = isFieldValid(field)
    return cn(
      'h-12 text-[16px] sm:h-10 sm:text-sm pr-9',
      isDark && '!border-[#3e3838] !bg-[#1a1616] !text-[#f0e8e8] placeholder:!text-[#b89090]',
      hasError && '!ring-2 !ring-amber-500 !border-amber-500',
      isValid && !hasError && '!border-emerald-500',
      extra
    )
  }

  const labelClass = cn('text-sm', isDark ? 'text-[#d4b8b8]' : 'text-neutral-700')

  // Filtered country list for picker
  const filteredCountries = React.useMemo(() => {
    if (!countrySearch.trim()) return countryOptions
    const q = countrySearch.toLowerCase()
    return countryOptions.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }, [countryOptions, countrySearch])

  // Selected country pinned at top (only when not searching)
  const selectedCountry = countryOptions.find((c) => c.code === form.country)
  const pickerList = React.useMemo(() => {
    if (countrySearch.trim()) return filteredCountries
    const rest = countryOptions.filter((c) => c.code !== form.country)
    return selectedCountry ? [selectedCountry, ...rest] : countryOptions
  }, [countryOptions, filteredCountries, countrySearch, form.country, selectedCountry])

  // Inline field error message
  const FieldError = ({ field }: { field: keyof CheckoutAddress }) => {
    const err = getFieldError(field)
    if (!err) return null
    return (
      <p className={cn('mt-1 text-xs', isDark ? 'text-amber-400' : 'text-amber-600')}>
        {err}
      </p>
    )
  }

  // Field suffix icon (checkmark or nothing)
  const FieldSuffix = ({ field }: { field: keyof CheckoutAddress }) => {
    const valid = isFieldValid(field)
    const hasError = !!getFieldError(field)
    if (hasError) return null
    if (!valid) return null
    return (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Check className={cn('w-4 h-4', isDark ? 'text-emerald-400' : 'text-emerald-500')} />
      </div>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        {/*
          Radix Content must not combine translate-based centering with tailwindcss-animate enter/exit:
          both use transform, so the sheet can render off-screen while the overlay still dims.
          Shell: full-viewport flex (no transform). Card: relative for absolute country/phone sheets.
        */}
        <Dialog.Content
          className={cn(
            'group fixed inset-0 z-[201] flex flex-col justify-end sm:justify-center sm:items-center',
            'border-0 bg-transparent p-0 shadow-none outline-none pointer-events-none'
          )}
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            // Prevent Radix Dialog from auto-focusing the first focusable element
            // (which can be the phone country Select on desktop, causing it to open unprompted).
            // We handle focus manually via the highlightedField effect.
            e.preventDefault()
          }}
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement
            if (
              target.closest?.('.pac-container') ||
              target.closest?.('gmp-place-autocomplete')
            ) {
              e.preventDefault()
            }
          }}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement
            if (
              target.closest?.('.pac-container') ||
              target.closest?.('gmp-place-autocomplete')
            ) {
              e.preventDefault()
            }
          }}
        >
          <div
            className={cn(
              'pointer-events-auto relative flex w-full max-w-full flex-col overflow-hidden',
              'max-h-[96dvh] min-h-0 sm:max-h-[90vh] sm:w-full sm:max-w-md',
              'rounded-t-2xl sm:rounded-xl',
              isDark ? 'bg-[#171515]' : 'bg-white',
              'shadow-2xl',
              'group-data-[state=open]:animate-in group-data-[state=closed]:animate-out',
              'group-data-[state=closed]:fade-out-0 group-data-[state=open]:fade-in-0',
              'max-sm:group-data-[state=closed]:slide-out-to-bottom max-sm:group-data-[state=open]:slide-in-from-bottom',
              'sm:group-data-[state=open]:zoom-in-95 sm:group-data-[state=closed]:zoom-out-95'
            )}
          >
          <div className={cn('flex min-h-0 flex-1 flex-col', isDark && 'dark')}>

            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
              <div className={cn('w-10 h-1 rounded-full', isDark ? 'bg-white/20' : 'bg-neutral-300')} />
            </div>

            {/* Header */}
            <div className={cn(
              'flex shrink-0 items-center justify-between border-b px-4 py-4',
              isDark ? 'border-white/10' : 'border-neutral-100'
            )}>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                data-testid="address-dialog-close-button"
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                  isDark
                    ? 'text-[#c4a0a0] hover:bg-[#201c1c] hover:text-[#d4b8b8]'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
                )}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <Dialog.Title className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-neutral-950')}>
                Add Address
              </Dialog.Title>
              <div className="w-9" />
            </div>

            {/* Scrollable form */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4">

              {/* Saved addresses */}
              {savedAddressesToShow.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className={cn('text-xs font-medium uppercase tracking-wider', isDark ? 'text-[#c4a0a0]' : 'text-neutral-500')}>
                    Choose from saved
                  </p>
                  <div className="space-y-2">
                    {savedAddressesToShow.map(({ id, addr, label }) => {
                      const addrWithEmail = {
                        ...addr,
                        email: addr.email?.trim() || initialAddress?.email?.trim() || form.email?.trim() || '',
                      }
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            if (isAddressComplete(addrWithEmail)) {
                              onSave(addrWithEmail)
                              onOpenChange(false)
                            } else {
                              setForm(addrWithEmail)
                            }
                          }}
                          className={cn(
                            'w-full text-left rounded-xl border px-4 py-3 transition-colors',
                            isDark
                              ? 'border-white/20 hover:border-[#60A5FA]/50 hover:bg-[#60A5FA]/10'
                              : 'border-neutral-200 hover:border-[#047AFF]/50 hover:bg-[#047AFF]/5'
                          )}
                        >
                          <p className={cn('text-xs font-medium mb-0.5', isDark ? 'text-[#c4a0a0]' : 'text-neutral-500')}>
                            {label}
                          </p>
                          <p className={cn('text-sm truncate', isDark ? 'text-white' : 'text-neutral-900')}>
                            {formatAddressShort(addr)}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                  <p className={cn('text-xs pt-1', isDark ? 'text-[#c4a0a0]' : 'text-neutral-500')}>
                    Or enter a new address below
                  </p>
                  <div className={cn('border-t my-2', isDark ? 'border-white/10' : 'border-neutral-100')} />
                </div>
              )}

              {/* GPS hero CTA */}
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locationLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2.5 h-12 rounded-xl border-2 font-medium text-sm transition-colors mb-3',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isDark
                    ? 'border-[#60A5FA]/40 bg-[#60A5FA]/10 text-[#60A5FA] hover:bg-[#60A5FA]/15 hover:border-[#60A5FA]/60'
                    : 'border-[#047AFF]/40 bg-[#047AFF]/5 text-[#047AFF] hover:bg-[#047AFF]/10 hover:border-[#047AFF]/60'
                )}
              >
                {locationLoading ? (
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <MapPin className="w-4 h-4 shrink-0" aria-hidden />
                )}
                {locationLoading ? 'Locating…' : 'Use current location'}
              </button>
              {locationError && (
                <p className={cn('text-xs mb-3 text-center', isDark ? 'text-amber-400' : 'text-amber-600')}>
                  {locationError}
                </p>
              )}

              {/* Country context — above the form */}
              <button
                type="button"
                onClick={() => setShowCountryPicker(true)}
                className={cn(
                  'flex items-center gap-1.5 text-sm transition-colors mb-4',
                  isDark ? 'text-[#b89090] hover:text-[#d4b8b8]' : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <span>
                  Delivering to{' '}
                  <span aria-hidden>{flagEmoji(form.country)}</span>{' '}
                  {countryOptions.find((c) => c.code === form.country)?.name ?? form.country}
                </span>
                <span className={cn('text-xs font-medium', isDark ? 'text-[#60A5FA]' : 'text-[#047AFF]')}>
                  · Change
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn('flex-1 h-px', isDark ? 'bg-white/10' : 'bg-neutral-200')} />
                <span className={cn('text-xs shrink-0', isDark ? 'text-[#b89090]' : 'text-neutral-400')}>
                  or enter below
                </span>
                <div className={cn('flex-1 h-px', isDark ? 'bg-white/10' : 'bg-neutral-200')} />
              </div>

              {/* Validation error banner */}
              {validationError && (
                <div className={cn(
                  'mb-4 rounded-xl px-4 py-3 text-sm',
                  isDark ? 'bg-amber-900/30 text-amber-200' : 'bg-amber-50 border border-amber-200 text-amber-800'
                )}>
                  {validationError}
                </div>
              )}

              {/* Same as billing */}
              {hasValidBilling && billingAddress && (
                <div className="mb-4 flex items-center gap-2">
                  <Checkbox
                    id="same-as-billing"
                    checked={sameAsBilling}
                    onCheckedChange={(c) => setSameAsBilling(!!c)}
                  />
                  <Label
                    htmlFor="same-as-billing"
                    className={cn('text-sm cursor-pointer', isDark ? 'text-[#d4b8b8]' : 'text-neutral-700')}
                  >
                    Same as billing address
                  </Label>
                </div>
              )}

              {/* Form fields */}
              <div
                ref={formRef}
                key={open ? 'address-form-open' : 'address-form-closed'}
                className={cn('space-y-3 address-form', sameAsBilling && 'pointer-events-none opacity-60')}
                data-testid="stripe-address-element-loaded"
              >
                {/* Hidden native select for browser country autofill */}
                <select
                  id="address-country-native"
                  autoComplete={ac('country-code')}
                  defaultValue={form.country}
                  className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
                  tabIndex={-1}
                  aria-hidden
                >
                  {countryOptions.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>

                {/* Email */}
                <div>
                  <Label htmlFor="address-email" className={labelClass}>Email</Label>
                  <div className="relative mt-1.5">
                    <Input
                      ref={emailRef}
                      id="address-email"
                      data-testid="address-email"
                      type="email"
                      inputMode="email"
                      enterKeyHint="next"
                      autoCapitalize="none"
                      autoComplete={ac('email')}
                      value={form.email}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, email: e.target.value }))
                        if (highlightedField === 'email') setHighlightedField(null)
                        if (touchedFields.email) {
                          const err = fieldValidators.email?.(e.target.value)
                          setFieldErrors((p) => ({ ...p, email: err ?? undefined }))
                        }
                      }}
                      onBlur={(e) => handleBlur('email', e.target.value)}
                      className={inputClass('email')}
                      placeholder="your@email.com"
                    />
                    <FieldSuffix field="email" />
                  </div>
                  <FieldError field="email" />
                </div>

                {/* Full name */}
                <div>
                  <Label htmlFor="address-fullname" className={labelClass}>Full name</Label>
                  <div className="relative mt-1.5">
                    <Input
                      ref={fullNameRef}
                      id="address-fullname"
                      type="text"
                      enterKeyHint="next"
                      autoCapitalize="words"
                      autoComplete={ac('name')}
                      value={form.fullName}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, fullName: e.target.value }))
                        if (highlightedField === 'fullName') setHighlightedField(null)
                        if (touchedFields.fullName) {
                          const err = fieldValidators.fullName?.(e.target.value)
                          setFieldErrors((p) => ({ ...p, fullName: err ?? undefined }))
                        }
                      }}
                      onBlur={(e) => handleBlur('fullName', e.target.value)}
                      className={inputClass('fullName')}
                      placeholder="Jane Smith"
                    />
                    <FieldSuffix field="fullName" />
                  </div>
                  <FieldError field="fullName" />
                </div>

                {/* Address line 1 — Google Places or plain input */}
                <div>
                  <Label htmlFor="address-line1" className={labelClass}>Street address</Label>
                  <div
                    onFocus={() => setAddressExpanded(true)}
                    onClick={() => setAddressExpanded(true)}
                    className="mt-1.5 relative"
                  >
                    <Search
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10',
                        isDark ? 'text-[#b89090]' : 'text-neutral-400'
                      )}
                      aria-hidden
                    />
                    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
                    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ? (
                      <GooglePlacesAddressInput
                        ref={addressLine1Ref}
                        id="address-line1"
                        value={form.addressLine1}
                        enterKeyHint="next"
                        inputMode="text"
                        onChange={(v) => {
                          setForm((p) => ({ ...p, addressLine1: v }))
                          if (highlightedField === 'addressLine1') setHighlightedField(null)
                          if (touchedFields.addressLine1) {
                            const err = fieldValidators.addressLine1?.(v)
                            setFieldErrors((p) => ({ ...p, addressLine1: err ?? undefined }))
                          }
                        }}
                        onSelect={(s) => {
                          const validCountry =
                            s.country && countryOptions.some((c) => c.code === s.country)
                              ? s.country
                              : undefined
                          const states = validCountry ? getStatesForCountry(validCountry) : []
                          const matchedState =
                            s.state && states.length
                              ? states.find(
                                  (st) =>
                                    st.name.toLowerCase() === s.state!.toLowerCase() ||
                                    st.code.toLowerCase() === s.state!.toLowerCase()
                                )?.code ?? s.state
                              : s.state ?? ''
                          setForm((p) => ({
                            ...p,
                            addressLine1: s.addressLine1,
                            city: s.city,
                            state: matchedState,
                            postalCode: s.postalCode || '',
                            ...(validCountry && {
                              country: validCountry,
                              phoneCountryCode: getPhoneCodeForCountry(validCountry),
                            }),
                          }))
                          setAddressExpanded(true)
                          // Mark address fields as touched + valid after autocomplete
                          setTouchedFields((p) => ({ ...p, addressLine1: true, city: true, postalCode: true }))
                          setFieldErrors((p) => ({ ...p, addressLine1: undefined, city: undefined, postalCode: undefined }))
                        }}
                        country={form.country}
                        autoComplete={ac('address-line1')}
                        placeholder="Search your address…"
                        className={cn(
                          'pl-9 h-12 text-[16px] sm:h-10 sm:text-sm',
                          isDark && '!border-[#3e3838] !bg-[#1a1616] !text-[#f0e8e8] placeholder:!text-[#b89090]',
                          !!getFieldError('addressLine1') && '!ring-2 !ring-amber-500 !border-amber-500',
                          isFieldValid('addressLine1') && !getFieldError('addressLine1') && '!border-emerald-500'
                        )}
                      />
                    ) : (
                      <Input
                        ref={addressLine1Ref}
                        id="address-line1"
                        type="text"
                        enterKeyHint="next"
                        autoCapitalize="words"
                        autoComplete={ac('address-line1')}
                        value={form.addressLine1}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, addressLine1: e.target.value }))
                          if (highlightedField === 'addressLine1') setHighlightedField(null)
                          if (touchedFields.addressLine1) {
                            const err = fieldValidators.addressLine1?.(e.target.value)
                            setFieldErrors((p) => ({ ...p, addressLine1: err ?? undefined }))
                          }
                        }}
                        onBlur={(e) => handleBlur('addressLine1', e.target.value)}
                        className={inputClass('addressLine1', 'pl-9')}
                        placeholder="Search your address…"
                      />
                    )}
                    {isFieldValid('addressLine1') && !getFieldError('addressLine1') && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Check className={cn('w-4 h-4', isDark ? 'text-emerald-400' : 'text-emerald-500')} />
                      </div>
                    )}
                  </div>
                  <FieldError field="addressLine1" />
                </div>

                {/* Expanded fields */}
                {addressExpanded && (
                  <>
                    {/* Address line 2 — collapsible */}
                    {!showLine2 && !form.addressLine2 ? (
                      <button
                        type="button"
                        onClick={() => setShowLine2(true)}
                        className={cn(
                          'text-sm text-left hover:underline',
                          isDark ? 'text-[#60A5FA]' : 'text-[#047AFF]'
                        )}
                      >
                        + Add apartment, suite, or unit
                      </button>
                    ) : (
                      <div>
                        <Label htmlFor="address-line2" className={labelClass}>
                          Apartment, suite, unit (optional)
                        </Label>
                        <Input
                          id="address-line2"
                          type="text"
                          enterKeyHint="next"
                          autoCapitalize="words"
                          autoComplete={ac('address-line2')}
                          value={form.addressLine2 ?? ''}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, addressLine2: e.target.value || undefined }))
                          }
                          className={cn(
                            'mt-1.5 h-12 text-[16px] sm:h-10 sm:text-sm',
                            isDark && '!border-[#3e3838] !bg-[#1a1616] !text-[#f0e8e8] placeholder:!text-[#b89090]'
                          )}
                          placeholder="Apt., suite, unit number, etc."
                        />
                      </div>
                    )}

                    {/* City + ZIP side-by-side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="address-city" className={labelClass}>City</Label>
                        <div className="relative mt-1.5">
                          <Input
                            ref={cityRef}
                            id="address-city"
                            type="text"
                            enterKeyHint="next"
                            autoCapitalize="words"
                            autoComplete={ac('address-level2')}
                            value={form.city}
                            onChange={(e) => {
                              setForm((p) => ({ ...p, city: e.target.value }))
                              if (highlightedField === 'city') setHighlightedField(null)
                              if (touchedFields.city) {
                                const err = fieldValidators.city?.(e.target.value)
                                setFieldErrors((p) => ({ ...p, city: err ?? undefined }))
                              }
                            }}
                            onBlur={(e) => handleBlur('city', e.target.value)}
                            className={inputClass('city')}
                            placeholder="City"
                          />
                          <FieldSuffix field="city" />
                        </div>
                        <FieldError field="city" />
                      </div>
                      <div>
                        <Label htmlFor="address-postal" className={labelClass}>
                          ZIP / Postal
                          {zipAutofillLoading && (
                            <span className={cn('ml-1.5 text-xs', isDark ? 'text-[#b89090]' : 'text-neutral-400')}>…</span>
                          )}
                        </Label>
                        <div className="relative mt-1.5">
                          <Input
                            ref={postalCodeRef}
                            id="address-postal"
                            data-testid="address-postal"
                            type="text"
                            inputMode="numeric"
                            enterKeyHint="next"
                            autoCapitalize="none"
                            autoComplete={ac('postal-code')}
                            value={form.postalCode}
                            onChange={(e) => {
                              setForm((p) => ({ ...p, postalCode: e.target.value }))
                              if (highlightedField === 'postalCode') setHighlightedField(null)
                              if (touchedFields.postalCode) {
                                const err = fieldValidators.postalCode?.(e.target.value)
                                setFieldErrors((p) => ({ ...p, postalCode: err ?? undefined }))
                              }
                            }}
                            onBlur={(e) => handleBlur('postalCode', e.target.value)}
                            className={inputClass('postalCode')}
                            placeholder="ZIP / Postal"
                          />
                          <FieldSuffix field="postalCode" />
                        </div>
                        <FieldError field="postalCode" />
                      </div>
                    </div>

                    {/* State — full width below */}
                    {hasStateDropdown ? (
                      <div>
                        <Label htmlFor="address-state" className={labelClass}>State</Label>
                        <Select
                          value={form.state || ''}
                          onValueChange={(v) => setForm((p) => ({ ...p, state: v }))}
                        >
                          <SelectTrigger
                            id="address-state"
                            className={cn(
                              'mt-1.5 h-12 text-[16px] sm:h-10 sm:text-sm',
                              isDark && '!border-[#3e3838] !bg-[#1a1616] !text-[#f0e8e8]'
                            )}
                          >
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent className={cn('z-[200]', isDark && '!border-white/10 !bg-[#1a1616] !text-[#f0e8e8]')}>
                            {statesForCountry.map((s) => (
                              <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : form.country ? (
                      <div>
                        <Label htmlFor="address-state" className={labelClass}>State / Province</Label>
                        <Input
                          id="address-state"
                          type="text"
                          enterKeyHint="next"
                          autoCapitalize="words"
                          autoComplete={ac('address-level1')}
                          value={form.state ?? ''}
                          onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                          className={cn(
                            'mt-1.5 h-12 text-[16px] sm:h-10 sm:text-sm',
                            isDark && '!border-[#3e3838] !bg-[#1a1616] !text-[#f0e8e8] placeholder:!text-[#b89090]'
                          )}
                          placeholder="State or province"
                        />
                      </div>
                    ) : null}

                    {/* Phone — flag prefix button + tel input */}
                    <div>
                      <Label className={labelClass}>Phone number</Label>
                      <div className={cn(
                        'mt-1.5 flex rounded-xl border overflow-hidden',
                        isDark ? 'border-[#3e3838]' : 'border-neutral-200',
                        !!getFieldError('phoneNumber') && 'ring-2 ring-amber-500 border-amber-500',
                        isFieldValid('phoneNumber') && !getFieldError('phoneNumber') && (isDark ? 'border-emerald-600' : 'border-emerald-500')
                      )}>
                        {narrowPhoneCountrySheet ? (
                          <button
                            type="button"
                            onClick={() => setShowPhonePicker(true)}
                            className={cn(
                              'flex items-center gap-1.5 px-3 border-r shrink-0 h-12 sm:h-10 transition-colors text-sm font-medium',
                              isDark
                                ? 'text-[#f0e8e8] bg-[#201c1c] border-[#3e3838] hover:bg-[#2a2424]'
                                : 'text-neutral-700 bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
                            )}
                            aria-label="Change phone country code"
                          >
                            <span className="text-base leading-none" aria-hidden>
                              {flagEmoji(phoneCountryToCountry(form.phoneCountryCode))}
                            </span>
                            <span className="text-xs">{form.phoneCountryCode}</span>
                            <ChevronDown className={cn('w-3 h-3', isDark ? 'text-[#b89090]' : 'text-neutral-400')} aria-hidden />
                          </button>
                        ) : (
                          <Select
                            value={form.phoneCountryCode}
                            onValueChange={(v) => setForm((p) => ({ ...p, phoneCountryCode: v }))}
                          >
                            <SelectTrigger className={cn(
                              'w-[90px] shrink-0 h-10 rounded-none border-0 border-r text-sm font-medium',
                              isDark
                                ? 'bg-[#201c1c] border-[#3e3838] text-[#f0e8e8]'
                                : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                            )}>
                              <SelectValue>
                                <span className="flex items-center gap-1.5">
                                  <span className="text-base leading-none">{flagEmoji(phoneCountryToCountry(form.phoneCountryCode))}</span>
                                  <span className="text-xs">{form.phoneCountryCode}</span>
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {PHONE_DIAL_OPTIONS.map(({ dial }) => (
                                <SelectItem key={dial} value={dial}>
                                  <span className="flex items-center gap-2">
                                    <span>{flagEmoji(PHONE_CODE_TO_COUNTRY[dial] ?? '')}</span>
                                    <span>{dial}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Input
                          ref={phoneNumberRef}
                          id="address-phone"
                          data-testid="address-phone"
                          type={isMobile ? 'tel' : 'text'}
                          inputMode="tel"
                          enterKeyHint="done"
                          autoCapitalize="none"
                          /* Desktop: `shipping tel` / `billing tel` still opens Safari/Chrome Contacts UI; keep autofill only on mobile. */
                          autoComplete={isMobile ? ac('tel') : 'off'}
                          value={form.phoneNumber}
                          onChange={(e) => {
                            handlePhoneChange(e.target.value)
                            if (highlightedField === 'phoneNumber') setHighlightedField(null)
                            if (touchedFields.phoneNumber) {
                              const err = fieldValidators.phoneNumber?.(e.target.value)
                              setFieldErrors((p) => ({ ...p, phoneNumber: err ?? undefined }))
                            }
                          }}
                          onBlur={(e) => handleBlur('phoneNumber', e.target.value)}
                          className={cn(
                            'flex-1 border-0 rounded-none h-12 sm:h-10 text-[16px] sm:text-sm',
                            'focus:ring-0 focus:ring-offset-0',
                            isDark && '!bg-[#1a1616] !text-[#f0e8e8] placeholder:!text-[#b89090]'
                          )}
                          placeholder="Phone number"
                        />
                        {isFieldValid('phoneNumber') && !getFieldError('phoneNumber') && (
                          <div className="flex items-center pr-3">
                            <Check className={cn('w-4 h-4', isDark ? 'text-emerald-400' : 'text-emerald-500')} />
                          </div>
                        )}
                      </div>
                      <FieldError field="phoneNumber" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sticky bottom save button */}
            <div className={cn(
              'shrink-0 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
              isDark ? 'border-white/10 bg-[#171515]' : 'border-neutral-100 bg-white'
            )}>
              <Button
                onClick={handleDone}
                data-testid="add-address-done-button"
                className="w-full h-12 text-base font-semibold"
              >
                Save Address
              </Button>
            </div>
          </div>

          {/* Country picker sheet — slides in from right */}
          <div className={cn(
            'absolute inset-0 z-10 flex flex-col transition-transform duration-300 ease-in-out',
            isDark ? 'bg-[#171515]' : 'bg-white',
            showCountryPicker ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          )}>
            <div className={cn(
              'flex shrink-0 items-center gap-3 border-b px-4 py-4',
              isDark ? 'border-white/10' : 'border-neutral-100'
            )}>
              <button
                type="button"
                onClick={() => setShowCountryPicker(false)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                  isDark
                    ? 'text-[#c4a0a0] hover:bg-[#201c1c] hover:text-[#d4b8b8]'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
                )}
                aria-label="Back"
              >
                <X className="h-5 w-5" />
              </button>
              <span className={cn('text-base font-semibold', isDark ? 'text-white' : 'text-neutral-950')}>
                Select country
              </span>
            </div>
            {/* Search input */}
            <div className={cn('px-4 py-3 border-b', isDark ? 'border-white/10' : 'border-neutral-100')}>
              <div className="relative">
                <Search className={cn(
                  'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none',
                  isDark ? 'text-[#b89090]' : 'text-neutral-400'
                )} aria-hidden />
                <input
                  ref={countrySearchRef}
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search countries…"
                  className={cn(
                    'w-full h-10 pl-9 pr-3 rounded-lg border text-sm outline-none transition-colors',
                    isDark
                      ? 'bg-[#1a1616] border-[#3e3838] text-[#f0e8e8] placeholder:text-[#b89090] focus:border-[#60A5FA]/50'
                      : 'bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-[#047AFF]/50'
                  )}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {pickerList.length === 0 ? (
                <p className={cn('px-4 py-8 text-sm text-center', isDark ? 'text-[#b89090]' : 'text-neutral-400')}>
                  No countries found
                </p>
              ) : (
                pickerList.map((c, idx) => {
                  const isSelected = form.country === c.code
                  const isPinned = !countrySearch.trim() && idx === 0 && isSelected
                  return (
                    <React.Fragment key={c.code}>
                      <button
                        type="button"
                        onClick={() => {
                          handleCountryChange(c.code)
                          setShowCountryPicker(false)
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left transition-colors',
                          isDark ? 'hover:bg-[#201c1c]' : 'hover:bg-neutral-50',
                          isSelected
                            ? isDark ? 'text-[#60A5FA] font-medium' : 'text-[#047AFF] font-medium'
                            : isDark ? 'text-white' : 'text-neutral-900'
                        )}
                      >
                        <span className="text-base w-6 text-center" aria-hidden>{flagEmoji(c.code)}</span>
                        <span className="flex-1">{c.name}</span>
                        {isSelected && (
                          <Check className={cn('w-4 h-4 shrink-0', isDark ? 'text-[#60A5FA]' : 'text-[#047AFF]')} />
                        )}
                      </button>
                      {/* Divider after pinned selected country */}
                      {isPinned && (
                        <div className={cn('mx-4 border-t', isDark ? 'border-white/10' : 'border-neutral-100')} />
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </div>
          </div>

          {/* Phone picker sheet — narrow viewports only; sm+ uses inline Select above */}
          {narrowPhoneCountrySheet && (
            <div className={cn(
              'absolute inset-0 z-10 flex flex-col transition-transform duration-300 ease-in-out',
              isDark ? 'bg-[#171515]' : 'bg-white',
              showPhonePicker ? 'translate-x-0' : 'translate-x-full pointer-events-none'
            )}>
              <div className={cn(
                'flex shrink-0 items-center gap-3 border-b px-4 py-4',
                isDark ? 'border-white/10' : 'border-neutral-100'
              )}>
                <button
                  type="button"
                  onClick={() => setShowPhonePicker(false)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                    isDark
                      ? 'text-[#c4a0a0] hover:bg-[#201c1c] hover:text-[#d4b8b8]'
                      : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
                  )}
                  aria-label="Back"
                >
                  <X className="h-5 w-5" />
                </button>
                <span className={cn('text-base font-semibold', isDark ? 'text-white' : 'text-neutral-950')}>
                  Phone country code
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {PHONE_DIAL_OPTIONS.map(({ dial }) => {
                  const countryCode = PHONE_CODE_TO_COUNTRY[dial] ?? ''
                  const countryName = countryOptions.find((c) => c.code === countryCode)?.name ?? dial
                  const isSelected = form.phoneCountryCode === dial
                  return (
                    <button
                      key={dial}
                      type="button"
                      onClick={() => {
                        setForm((p) => ({ ...p, phoneCountryCode: dial }))
                        setShowPhonePicker(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left transition-colors',
                        isDark ? 'hover:bg-[#201c1c]' : 'hover:bg-neutral-50',
                        isSelected
                          ? isDark ? 'text-[#60A5FA] font-medium' : 'text-[#047AFF] font-medium'
                          : isDark ? 'text-white' : 'text-neutral-900'
                      )}
                    >
                      <span className="text-base w-6 text-center" aria-hidden>{flagEmoji(countryCode)}</span>
                      <span className="flex-1">{countryName}</span>
                      <span className={cn('tabular-nums text-xs', isDark ? 'text-[#b89090]' : 'text-neutral-500')}>
                        {dial}
                      </span>
                      {isSelected && (
                        <Check className={cn('w-4 h-4 shrink-0', isDark ? 'text-[#60A5FA]' : 'text-[#047AFF]')} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
