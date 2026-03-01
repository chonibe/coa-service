'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
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
  COUNTRY_OPTIONS,
  COUNTRY_PHONE_CODES,
  PHONE_DIAL_OPTIONS,
  getPhoneCodeForCountry,
} from '@/lib/data/countries'
import type { CheckoutAddress } from '@/lib/shop/CheckoutContext'

export interface AddressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialAddress?: CheckoutAddress | null
  onSave: (address: CheckoutAddress) => void
}

const emptyAddress: CheckoutAddress = {
  email: '',
  fullName: '',
  country: 'US',
  addressLine1: '',
  addressLine2: '',
  city: '',
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

export function AddressModal({
  open,
  onOpenChange,
  initialAddress,
  onSave,
}: AddressModalProps) {
  const [form, setForm] = React.useState<CheckoutAddress>(
    () => initialAddress ?? { ...emptyAddress }
  )
  const [validationError, setValidationError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setForm(initialAddress ?? { ...emptyAddress })
      setValidationError(null)
    }
  }, [open, initialAddress])

  React.useEffect(() => {
    if (form.country && !COUNTRY_PHONE_CODES[form.country]) {
      setForm((p) => ({ ...p, phoneCountryCode: getPhoneCodeForCountry(form.country) }))
    }
  }, [form.country])

  const handleCountryChange = (code: string) => {
    const phoneCode = getPhoneCodeForCountry(code)
    setForm((p) => ({ ...p, country: code, phoneCountryCode: phoneCode }))
  }

  const handleDone = () => {
    const err = validateAddress(form)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    onSave(form)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 top-0 z-[101] flex flex-col bg-white',
            'max-h-[100dvh] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            'sm:data-[state=closed]:slide-out-to-bottom-4 sm:data-[state=open]:slide-in-from-bottom-4'
          )}
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              data-testid="address-dialog-close-button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <Dialog.Title className="text-lg font-semibold text-neutral-950">Add Address</Dialog.Title>
            <button
              type="button"
              onClick={handleDone}
              data-testid="add-address-done-button"
              className="text-sm font-medium text-pink-600 hover:text-pink-700"
            >
              Done
            </button>
          </div>

          {/* Scrollable form */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {validationError && (
              <div className="mb-4 rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-800">
                {validationError}
              </div>
            )}
            <div className="space-y-4 address-form" data-testid="stripe-address-element-loaded">
              <div>
                <Label htmlFor="address-email" className="text-sm text-neutral-700">
                  Email
                </Label>
                <Input
                  id="address-email"
                  data-testid="address-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="mt-1.5"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="address-fullname" className="text-sm text-neutral-700">
                  Full name
                </Label>
                <Input
                  id="address-fullname"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="mt-1.5"
                  placeholder="First and last name"
                />
              </div>
              <div>
                <Label htmlFor="address-country" className="text-sm text-neutral-700">
                  Country or region
                </Label>
                <Select value={form.country} onValueChange={handleCountryChange}>
                  <SelectTrigger id="address-country" className="mt-1.5">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="address-line1" className="text-sm text-neutral-700">
                  Address line 1
                </Label>
                <Input
                  id="address-line1"
                  type="text"
                  value={form.addressLine1}
                  onChange={(e) => setForm((p) => ({ ...p, addressLine1: e.target.value }))}
                  className="mt-1.5"
                  placeholder="Street address"
                />
              </div>
              <div>
                <Label htmlFor="address-line2" className="text-sm text-neutral-700">
                  Address line 2
                </Label>
                <Input
                  id="address-line2"
                  type="text"
                  value={form.addressLine2 ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, addressLine2: e.target.value || undefined }))
                  }
                  className="mt-1.5"
                  placeholder="Apt., suite, unit number, etc. (optional)"
                />
              </div>
              <div>
                <Label htmlFor="address-city" className="text-sm text-neutral-700">
                  City
                </Label>
                <Input
                  id="address-city"
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  className="mt-1.5"
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="address-postal" className="text-sm text-neutral-700">
                  Postal code
                </Label>
                <Input
                  id="address-postal"
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))}
                  className="mt-1.5"
                  placeholder="Postal code"
                />
              </div>
              <div>
                <Label className="text-sm text-neutral-700">Phone number</Label>
                <div className="mt-1.5 flex gap-2">
                  <Select
                    value={form.phoneCountryCode}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, phoneCountryCode: v }))
                    }
                  >
                    <SelectTrigger className="w-24 shrink-0">
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
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phoneNumber: e.target.value }))
                    }
                    className="flex-1"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
