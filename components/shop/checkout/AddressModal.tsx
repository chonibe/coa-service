'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExperienceTheme } from '@/app/shop/experience/ExperienceThemeContext'
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

export interface AddressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialAddress?: CheckoutAddress | null
  onSave: (address: CheckoutAddress) => void
  /** When provided and complete, shows "Same as billing" option to use billing as delivery address */
  billingAddress?: CheckoutAddress | null
  /** 'shipping' | 'billing' — enables browser autofill from saved addresses (shipping/billing prefixes) */
  addressType?: 'shipping' | 'billing'
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

function validateAddress(addr: Partial<CheckoutAddress>): string | null {
  if (!addr.email?.trim()) return 'Please enter your email.'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(addr.email.trim())) return 'Please enter a valid email.'
  if (!addr.fullName?.trim()) return 'Please insert your full name (first and last name).'
  const nameParts = addr.fullName.trim().split(/\s+/)
  if (nameParts.length < 2) return 'Please insert your full name (first and last name).'
  if (!addr.country?.trim()) return 'Please select your country.'
  if (!addr.addressLine1?.trim()) return 'Please enter address line 1.'
  if (!addr.city?.trim()) return 'Please enter your city.'
  if (!addr.postalCode?.trim()) return 'Please enter your postal code.'
  if (!addr.phoneNumber?.trim()) return 'Please enter your phone number.'
  return null
}

function isAddressComplete(addr: CheckoutAddress | null | undefined): boolean {
  return !!addr && validateAddress(addr) === null
}

function formatAddressShort(addr: CheckoutAddress): string {
  const parts = [addr.addressLine1, addr.city, addr.state, addr.postalCode].filter(Boolean)
  return parts.join(', ')
}

export function AddressModal({
  open,
  onOpenChange,
  initialAddress,
  onSave,
  billingAddress,
  addressType = 'shipping',
}: AddressModalProps) {
  const { theme } = useExperienceTheme()
  const countryOptions = useShippingCountries()
  const { saveShippingAddress, saveBillingAddress } = useSaveAddressToAccount()
  const { addresses: savedAddresses } = useSavedAddresses()
  const ac = (field: string) => (addressType ? `${addressType} ${field}` : field)

  const savedAddressesToShow = React.useMemo(() => {
    return savedAddresses.map(({ id, address, label }) => ({
      id,
      addr: address,
      label: label || `Saved address`,
    }))
  }, [savedAddresses])
  const [form, setForm] = React.useState<CheckoutAddress>(
    () => initialAddress ?? { ...emptyAddress }
  )
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const [sameAsBilling, setSameAsBilling] = React.useState(false)
  const [addressExpanded, setAddressExpanded] = React.useState(false)
  const [locationLoading, setLocationLoading] = React.useState(false)
  const [locationError, setLocationError] = React.useState<string | null>(null)
  const hasValidBilling = isAddressComplete(billingAddress)

  /* Apply dark mode to Google Places .pac-container (rendered to body) */
  React.useEffect(() => {
    if (open && theme === 'dark') {
      document.body.setAttribute('data-pac-dark', 'true')
      return () => document.body.removeAttribute('data-pac-dark')
    }
  }, [open, theme])

  React.useEffect(() => {
    if (open) {
      setForm(initialAddress ?? { ...emptyAddress })
      setValidationError(null)
      setSameAsBilling(false)
      setLocationError(null)
      setAddressExpanded(!!(initialAddress?.addressLine1 || initialAddress?.city || initialAddress?.postalCode || initialAddress?.phoneNumber))
    }
  }, [open, initialAddress])

  /* Auto-set country from session geo (Vercel IP) or browser locale when form opens without an existing address */
  React.useEffect(() => {
    if (!open) return
    if (initialAddress?.country) return
    const applyCountry = (code: string) => {
      const upper = code.toUpperCase()
      if (countryOptions.some((c) => c.code === upper)) {
        setForm((p) => ({ ...p, country: upper, phoneCountryCode: getPhoneCodeForCountry(upper), state: '' }))
      }
    }
    fetch('/api/geo/country')
      .then((r) => r.json())
      .then((data: { country: string | null }) => {
        if (data.country) {
          applyCountry(data.country)
          return
        }
        let region: string | undefined
        try {
          region = typeof Intl !== 'undefined' && navigator.language
            ? (new (Intl as any).Locale(navigator.language).region as string)
            : navigator.language?.split('-')[1]
        } catch {
          region = navigator.language?.split('-')[1]
        }
        if (region) applyCountry(region)
      })
      .catch(() => {
        let region: string | undefined
        try {
          region = typeof Intl !== 'undefined' && navigator.language
            ? (new (Intl as any).Locale(navigator.language).region as string)
            : navigator.language?.split('-')[1]
        } catch {
          region = navigator.language?.split('-')[1]
        }
        if (region) applyCountry(region)
      })
  }, [open, initialAddress, countryOptions])

  React.useEffect(() => {
    if (form.country && !COUNTRY_PHONE_CODES[form.country]) {
      setForm((p) => ({ ...p, phoneCountryCode: getPhoneCodeForCountry(form.country) }))
    }
  }, [form.country])

  /* Sync form state from browser autofill – updates inputs AND dropdowns (Country, Phone code) */
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
      const phoneEl = root.querySelector<HTMLInputElement>('input[type="tel"]')
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
      if (Object.keys(updates).length > 0) {
        setForm((p) => ({ ...p, ...updates }))
      }
    }
    let intervalId: ReturnType<typeof setInterval> | null = null
    const startId = setTimeout(() => {
      intervalId = setInterval(syncFromAutofill, 150)
      setTimeout(() => {
        if (intervalId) clearInterval(intervalId)
      }, 2500)
    }, 100)
    return () => {
      clearTimeout(startId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [open, countryOptions])

  const handleCountryChange = (code: string) => {
    const phoneCode = getPhoneCodeForCountry(code)
    setForm((p) => ({ ...p, country: code, phoneCountryCode: phoneCode, state: '' }))
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
          const house = [addr.house_number, addr.road].filter(Boolean).join(' ') || data.display_name?.split(',')[0] || ''
          const city = addr.city || addr.town || addr.village || addr.municipality || ''
          const state = addr.state || ''
          const postalCode = addr.postcode || ''
          const countryCode = (addr.country_code || '').toUpperCase()
          const validCountry = countryCode && countryOptions.some((c) => c.code === countryCode) ? countryCode : undefined
          setForm((p) => ({
            ...p,
            addressLine1: house || p.addressLine1,
            city: city || p.city,
            state: state || p.state,
            postalCode: postalCode || p.postalCode,
            ...(validCountry && { country: validCountry, phoneCountryCode: getPhoneCodeForCountry(validCountry), state: state || '' }),
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

  const statesForCountry = React.useMemo(
    () => getStatesForCountry(form.country),
    [form.country]
  )
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
        if (inferred) {
          updates.country = inferred
          updates.state = ''
        }
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
    const err = validateAddress(form)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    onSave(form)
    if (addressType === 'shipping') saveShippingAddress(form)
    else saveBillingAddress(form)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 top-0 z-[101] flex flex-col',
            theme === 'dark' ? 'bg-neutral-950' : 'bg-white',
            'max-h-[100dvh] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            'sm:data-[state=closed]:slide-out-to-bottom-4 sm:data-[state=open]:slide-in-from-bottom-4'
          )}
          aria-describedby={undefined}
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement
            if (target.closest?.('.pac-container')) e.preventDefault()
          }}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement
            if (target.closest?.('.pac-container')) e.preventDefault()
          }}
        >
          {/* Wrapper for dark mode - min-h-0 lets flex children scroll properly */}
          <div className={cn('flex flex-col h-full min-h-0', theme === 'dark' && 'dark')}>
          {/* Header */}
          <div className={cn('flex shrink-0 items-center justify-between border-b px-4 py-5', theme === 'dark' ? 'border-white/10' : 'border-neutral-100')}>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              data-testid="address-dialog-close-button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <Dialog.Title className="text-lg font-semibold text-neutral-950 dark:text-white">Add Address</Dialog.Title>
            <button
              type="button"
              onClick={handleDone}
              data-testid="add-address-done-button"
              className="text-sm font-medium text-[#047AFF] hover:text-[#0366d6]"
            >
              Done
            </button>
          </div>

          {/* Scrollable form - min-h-0 enables flex child to shrink and scroll */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4">
            {savedAddressesToShow.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
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
                        className="w-full text-left rounded-lg border border-neutral-200 dark:border-white/20 px-4 py-3 hover:border-[#047AFF]/50 dark:hover:border-[#60A5FA]/50 hover:bg-[#047AFF]/5 dark:hover:bg-[#60A5FA]/10 transition-colors"
                      >
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
                        <p className="text-sm text-neutral-900 dark:text-white truncate">{formatAddressShort(addr)}</p>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-1">Or enter a new address below</p>
                <div className="border-t border-neutral-100 dark:border-white/10 my-4" />
              </div>
            )}
            {validationError && (
              <div className="mb-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                {validationError}
              </div>
            )}
            {hasValidBilling && billingAddress && (
              <div className="mb-4 flex items-center gap-2">
                <Checkbox
                  id="same-as-billing"
                  checked={sameAsBilling}
                  onCheckedChange={(c) => setSameAsBilling(!!c)}
                />
                <Label htmlFor="same-as-billing" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Same as billing address
                </Label>
              </div>
            )}
            <div
              ref={formRef}
              key={open ? 'address-form-open' : 'address-form-closed'}
              className={cn('space-y-4 address-form', sameAsBilling && 'pointer-events-none opacity-60')}
              data-testid="stripe-address-element-loaded"
            >
              {/* Hidden native select for browser country autofill – we poll and sync to our Radix dropdown */}
              <select
                id="address-country-native"
                autoComplete={ac('country-code')}
                defaultValue={form.country}
                className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
                tabIndex={-1}
                aria-hidden
              >
                {countryOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div>
                <Label htmlFor="address-email" className="text-sm text-neutral-700 dark:text-neutral-300">
                  Email
                </Label>
                <Input
                  id="address-email"
                  data-testid="address-email"
                  type="email"
                  autoComplete={ac('email')}
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="mt-1.5 dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white dark:placeholder:!text-neutral-400"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="address-fullname" className="text-sm text-neutral-700 dark:text-neutral-300">
                  Full name
                </Label>
                <Input
                  id="address-fullname"
                  type="text"
                  autoComplete={ac('name')}
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="mt-1.5 dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white dark:placeholder:!text-neutral-400"
                  placeholder="First and last name"
                />
              </div>
              <div>
                <Label htmlFor="address-country" className="text-sm text-neutral-700 dark:text-neutral-300">
                  Country or region
                </Label>
                <Select value={form.country} onValueChange={handleCountryChange}>
                  <SelectTrigger id="address-country" className={cn('mt-1.5', theme === 'dark' && '!border-neutral-600 !bg-neutral-900 !text-white')}>
                    <SelectValue placeholder="United States" />
                  </SelectTrigger>
                  <SelectContent className={cn('z-[200]', theme === 'dark' && '!border-white/10 !bg-neutral-900 !text-white')}>
                    {countryOptions.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="address-line1" className="text-sm text-neutral-700 dark:text-neutral-300">
                    Address line 1
                  </Label>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locationLoading}
                    title="Use current location"
                    aria-label="Use current location"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#047AFF]/30 bg-[#047AFF]/5 px-2.5 py-1.5 text-xs text-[#047AFF] hover:bg-[#047AFF]/10 hover:border-[#047AFF]/50 font-medium disabled:opacity-50 transition-colors"
                  >
                    <MapPin className="w-4 h-4 shrink-0" aria-hidden />
                    {locationLoading ? 'Locating…' : 'Current location'}
                  </button>
                </div>
                {locationError && (
                  <p className="text-xs text-amber-600 mt-0.5">{locationError}</p>
                )}
                <div
                  onFocus={() => setAddressExpanded(true)}
                  onClick={() => setAddressExpanded(true)}
                  className="mt-1.5"
                >
                  {(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
                    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) ? (
                    <GooglePlacesAddressInput
                      id="address-line1"
                      value={form.addressLine1}
                      onChange={(v) => setForm((p) => ({ ...p, addressLine1: v }))}
                      onSelect={(s) => {
                        const validCountry = s.country && countryOptions.some((c) => c.code === s.country)
                          ? s.country
                          : undefined
                        const states = validCountry ? getStatesForCountry(validCountry) : []
                        const matchedState = s.state && states.length
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
                      }}
                      country={form.country}
                      autoComplete={ac('address-line1')}
                      placeholder="Street address"
                    />
                  ) : (
                    <Input
                      id="address-line1"
                      type="text"
                      autoComplete={ac('address-line1')}
                      value={form.addressLine1}
                      onChange={(e) => setForm((p) => ({ ...p, addressLine1: e.target.value }))}
                      className="dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white dark:placeholder:!text-neutral-400"
                      placeholder="Street address"
                    />
                  )}
                </div>
              </div>
              {addressExpanded && (
                <>
                  <div>
                    <Label htmlFor="address-line2" className="text-sm text-neutral-700 dark:text-neutral-300">
                      Address line 2
                    </Label>
                    <Input
                      id="address-line2"
                      type="text"
                      autoComplete={ac('address-line2')}
                      value={form.addressLine2 ?? ''}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, addressLine2: e.target.value || undefined }))
                      }
                      className="mt-1.5 dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white dark:placeholder:!text-neutral-400"
                      placeholder="Apt., suite, unit number, etc. (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address-city" className="text-sm text-neutral-700 dark:text-neutral-300">
                      City
                    </Label>
                    <Input
                      id="address-city"
                      type="text"
                      autoComplete={ac('address-level2')}
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      className="mt-1.5 dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white dark:placeholder:!text-neutral-400"
                      placeholder="City"
                    />
                  </div>
                  {hasStateDropdown ? (
                    <div>
                      <Label htmlFor="address-state" className="text-sm text-neutral-700">
                        State
                      </Label>
                      <Select
                        value={form.state || ''}
                        onValueChange={(v) => setForm((p) => ({ ...p, state: v }))}
                      >
                        <SelectTrigger id="address-state" className={cn('mt-1.5', theme === 'dark' && '!border-neutral-600 !bg-neutral-900 !text-white')}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent className={cn('z-[200]', theme === 'dark' && '!border-white/10 !bg-neutral-900 !text-white')}>
                          {statesForCountry.map((s) => (
                            <SelectItem key={s.code} value={s.code}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : form.country ? (
                    <div>
                      <Label htmlFor="address-state" className="text-sm text-neutral-700 dark:text-neutral-300">
                        State / Province
                      </Label>
                      <Input
                        id="address-state"
                        type="text"
                        autoComplete={ac('address-level1')}
                        value={form.state ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                        className="mt-1.5 dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white dark:placeholder:!text-neutral-400"
                        placeholder="State or province"
                      />
                    </div>
                  ) : null}
                  <div>
                    <Label htmlFor="address-postal" className="text-sm text-neutral-700 dark:text-neutral-300">
                      ZIP / Postal code
                    </Label>
                    <Input
                      id="address-postal"
                      data-testid="address-postal"
                      type="text"
                      autoComplete={ac('postal-code')}
                      value={form.postalCode}
                      onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))}
                      className="mt-1.5 dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white dark:placeholder:!text-neutral-400"
                      placeholder="ZIP or postal code"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-neutral-700 dark:text-neutral-300">Phone number</Label>
                    <div className="mt-1.5 flex gap-2">
                      <Select
                        value={form.phoneCountryCode}
                        onValueChange={(v) =>
                          setForm((p) => ({ ...p, phoneCountryCode: v }))
                        }
                      >
                        <SelectTrigger className={cn('w-24 shrink-0', theme === 'dark' && '!border-neutral-600 !bg-neutral-900 !text-white')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={cn('z-[200]', theme === 'dark' && '!border-white/10 !bg-neutral-900 !text-white')}>
                          {PHONE_DIAL_OPTIONS.map(({ dial }) => (
                            <SelectItem key={dial} value={dial}>
                              {dial}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="tel"
                        autoComplete={ac('tel')}
                        value={form.phoneNumber}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="flex-1 dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white dark:placeholder:!text-neutral-400"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
