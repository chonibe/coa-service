'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import {
  PHONE_DIAL_OPTIONS,
  PHONE_CODE_TO_COUNTRY,
  getPhoneCodeForCountry,
} from '@/lib/data/countries'
import { getStatesForCountry } from '@/lib/data/states'
import type { CheckoutAddress } from '@/lib/shop/CheckoutContext'
import { useShippingCountries } from '@/lib/shop/useShippingCountries'

export interface InlineAddressFormProps {
  initialAddress?: CheckoutAddress | null
  onSubmit: (address: CheckoutAddress) => void
  onBack?: () => void
  submitLabel?: string
  /** When true, omits the Back button and uses compact single-column layout */
  compact?: boolean
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
  if (!addr.fullName?.trim()) return 'Please enter your full name (first and last).'
  const nameParts = addr.fullName.trim().split(/\s+/)
  if (nameParts.length < 2) return 'Please enter your full name (first and last).'
  if (!addr.country?.trim()) return 'Please select your country.'
  if (!addr.addressLine1?.trim()) return 'Please enter your address.'
  if (!addr.city?.trim()) return 'Please enter your city.'
  if (!addr.postalCode?.trim()) return 'Please enter your postal code.'
  if (!addr.phoneNumber?.trim()) return 'Please enter your phone number.'
  return null
}

export function InlineAddressForm({
  initialAddress,
  onSubmit,
  onBack,
  submitLabel = 'Continue to Payment',
  compact = false,
}: InlineAddressFormProps) {
  const countryOptions = useShippingCountries()
  const [form, setForm] = React.useState<CheckoutAddress>(
    () => initialAddress ?? { ...emptyAddress }
  )
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (initialAddress) setForm(initialAddress)
  }, [initialAddress])

  /* Auto-set country from session geo (Vercel IP) when form has no address yet */
  React.useEffect(() => {
    if (initialAddress?.country) return
    fetch('/api/geo/country')
      .then((r) => r.json())
      .then((data: { country: string | null }) => {
        const code = data.country?.toUpperCase()
        if (code && countryOptions.some((c) => c.code === code)) {
          setForm((p) => ({
            ...p,
            country: code,
            phoneCountryCode: getPhoneCodeForCountry(code),
            state: '',
          }))
        }
      })
      .catch(() => {})
  }, [initialAddress?.country, countryOptions])

  const handleCountryChange = (code: string) => {
    const phoneCode = getPhoneCodeForCountry(code)
    setForm((p) => ({ ...p, country: code, phoneCountryCode: phoneCode, state: '' }))
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateAddress(form)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', compact && 'space-y-2')}>
      {error && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="inline-email" className="text-xs text-neutral-600">Email</Label>
        <Input
          id="inline-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="mt-1 h-9 text-sm"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <Label htmlFor="inline-fullname" className="text-xs text-neutral-600">Full name</Label>
        <Input
          id="inline-fullname"
          type="text"
          value={form.fullName}
          onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
          className="mt-1 h-9 text-sm"
          placeholder="First and last name"
        />
      </div>

      <div>
        <Label htmlFor="inline-country" className="text-xs text-neutral-600">Country</Label>
        <Select value={form.country} onValueChange={handleCountryChange}>
          <SelectTrigger id="inline-country" className="mt-1 h-9 text-sm">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countryOptions.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="inline-addr1" className="text-xs text-neutral-600">Address</Label>
        <Input
          id="inline-addr1"
          type="text"
          value={form.addressLine1}
          onChange={(e) => setForm((p) => ({ ...p, addressLine1: e.target.value }))}
          className="mt-1 h-9 text-sm"
          placeholder="Street address"
        />
      </div>

      <div>
        <Label htmlFor="inline-addr2" className="text-xs text-neutral-600">Apt / Suite (optional)</Label>
        <Input
          id="inline-addr2"
          type="text"
          value={form.addressLine2 ?? ''}
          onChange={(e) => setForm((p) => ({ ...p, addressLine2: e.target.value || undefined }))}
          className="mt-1 h-9 text-sm"
          placeholder="Apt, suite, unit"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="inline-city" className="text-xs text-neutral-600">City</Label>
          <Input
            id="inline-city"
            type="text"
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            className="mt-1 h-9 text-sm"
            placeholder="City"
          />
        </div>
        {hasStateDropdown ? (
          <div>
            <Label htmlFor="inline-state" className="text-xs text-neutral-600">State</Label>
            <Select value={form.state || ''} onValueChange={(v) => setForm((p) => ({ ...p, state: v }))}>
              <SelectTrigger id="inline-state" className="mt-1 h-9 text-sm">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
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
            <Label htmlFor="inline-state" className="text-xs text-neutral-600">State / Province</Label>
            <Input
              id="inline-state"
              type="text"
              value={form.state ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
              className="mt-1 h-9 text-sm"
              placeholder="State or province"
            />
          </div>
        ) : null}
        <div className={(hasStateDropdown || form.country) ? 'col-span-2' : ''}>
          <Label htmlFor="inline-postal" className="text-xs text-neutral-600">Postal code</Label>
          <Input
            id="inline-postal"
            type="text"
            value={form.postalCode}
            onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))}
            className="mt-1 h-9 text-sm"
            placeholder="Postal code"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs text-neutral-600">Phone number</Label>
        <div className="mt-1 flex gap-1.5">
          <Select
            value={form.phoneCountryCode}
            onValueChange={(v) => setForm((p) => ({ ...p, phoneCountryCode: v }))}
          >
            <SelectTrigger className="w-[72px] shrink-0 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PHONE_DIAL_OPTIONS.map(({ dial }) => (
                <SelectItem key={dial} value={dial}>
                  {dial}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="flex-1 h-9 text-sm"
            placeholder="Phone number"
          />
        </div>
      </div>

      <div className={cn('flex gap-2 pt-2', compact && 'pt-1.5')}>
        {onBack && !compact && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          className={cn(
            'rounded-lg bg-neutral-950 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors',
            onBack && !compact ? 'flex-1' : 'w-full'
          )}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
