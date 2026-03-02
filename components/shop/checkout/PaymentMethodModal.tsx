'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox, Label } from '@/components/ui'
import { AddressModal } from './AddressModal'
import { CardInputSection } from './CardInputSection'
import type { CheckoutAddress, SavedCardInfo } from '@/lib/shop/CheckoutContext'
import type { PaymentMethodType } from '@/lib/shop/CheckoutContext'

export interface PaymentMethodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedMethod: PaymentMethodType
  onSelect: (method: PaymentMethodType) => void
  /** Called when user saves card/Link in the modal */
  onCardSaved: (card: SavedCardInfo) => void
  shippingAddress: CheckoutAddress | null
  sameAsShipping: boolean
  onSameAsShippingChange: (v: boolean) => void
  billingAddress: CheckoutAddress | null
  onBillingAddressSave: (addr: CheckoutAddress) => void
}

const PAYMENT_OPTIONS: { id: PaymentMethodType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'link',
    label: 'Google Pay',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 38 24" width={28} height={20} aria-hidden>
        <path d="M18.093 11.976v3.2h-1.018v-7.9h2.691a2.447 2.447 0 0 1 1.747.692 2.28 2.28 0 0 1 .11 3.224l-.11.116c-.47.447-1.098.69-1.747.674l-1.673-.006zm0-3.732v2.788h1.698c.377.012.741-.135 1.005-.404a1.391 1.391 0 0 0-1.005-2.354l-1.698-.03z" fill="#5F6368" />
        <path d="M13.986 11.284c0-.308-.024-.616-.073-.92h-4.29v1.747h2.451a2.096 2.096 0 0 1-.9 1.373v1.134h1.464a4.433 4.433 0 0 0 1.348-3.334z" fill="#4285F4" />
        <path d="M9.629 15.721a4.352 4.352 0 0 0 3.01-1.097l-1.466-1.14a2.752 2.752 0 0 1-4.094-1.44H5.577v1.17a4.53 4.53 0 0 0 4.052 2.507z" fill="#34A853" />
        <path d="M7.079 12.05a2.709 2.709 0 0 1 0-1.735v-1.17H5.577a4.505 4.505 0 0 0 0 4.075l1.502-1.17z" fill="#FBBC04" />
        <path d="M9.629 8.44a2.452 2.452 0 0 1 1.74.68l1.3-1.293a4.37 4.37 0 0 0-3.065-1.183 4.53 4.53 0 0 0-4.027 2.5l1.502 1.171a2.715 2.715 0 0 1 2.55-1.875z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    id: 'paypal',
    label: 'PayPal',
    icon: (
      <svg viewBox="0 0 38 24" width={28} height={20} fill="none" aria-hidden>
        <path fill="#003087" d="M23.9 8.3c.2-1 0-1.7-.6-2.3-.6-.7-1.7-1-3.1-1h-4.1c-.94 0-1.74.7-1.97 1.63L14 15.6c0 .2.1.4.3.4H17l.4-3.4 1.8-2.2 4.7-2.1z" />
        <path fill="#3086C8" d="M23.9 8.3l-.2.2c-.5 2.8-2.2 3.8-4.6 3.8H18c-.3 0-.5.2-.6.5l-.6 3.9-.2 1c0 .2.1.4.3.4H19c.3 0 .5-.2.5-.4v-.1l.4-2.4v-.1c0-.2.3-.4.5-.4h.3c2.1 0 3.7-.8 4.1-3.2.2-1 .1-1.8-.4-2.4-.1-.5-.3-.7-.5-.8z" />
      </svg>
    ),
  },
  {
    id: 'card',
    label: 'Credit Card',
    icon: <CreditCard className="h-5 w-5 text-neutral-600" />,
  },
]

export function PaymentMethodModal({
  open,
  onOpenChange,
  selectedMethod,
  onSelect,
  onCardSaved,
  shippingAddress,
  sameAsShipping,
  onSameAsShippingChange,
  billingAddress,
  onBillingAddressSave,
}: PaymentMethodModalProps) {
  const [billingModalOpen, setBillingModalOpen] = React.useState(false)
  const [setupClientSecret, setSetupClientSecret] = React.useState<string | null>(null)
  const [cardError, setCardError] = React.useState<string | null>(null)
  const showCardInput = selectedMethod === 'card' || selectedMethod === 'link'
  const cardSectionRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) {
      setSetupClientSecret(null)
      setCardError(null)
      return
    }
    if (showCardInput && !setupClientSecret) {
      fetch('/api/checkout/create-setup-intent', { method: 'POST' })
        .then(async (r) => {
          const data = await r.json()
          if (!r.ok) {
            throw new Error(data.error || 'Could not load payment form')
          }
          if (data.clientSecret) {
            setSetupClientSecret(data.clientSecret)
          } else {
            throw new Error(data.error || 'Could not load payment form')
          }
        })
        .catch((err) => setCardError(err?.message || 'Could not load payment form'))
    }
  }, [open, showCardInput, setupClientSecret])

  React.useEffect(() => {
    if (showCardInput && setupClientSecret && cardSectionRef.current) {
      cardSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [showCardInput, setupClientSecret])

  const handleSameAsChange = (checked: boolean) => {
    onSameAsShippingChange(checked)
    if (checked) setBillingModalOpen(false)
  }

  const handleBillingSave = (addr: CheckoutAddress) => {
    onBillingAddressSave(addr)
    setBillingModalOpen(false)
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
        >
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <Dialog.Title className="text-lg font-semibold text-neutral-950">Payment Method</Dialog.Title>
            <div className="w-9" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-3">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setCardError(null)
                    onSelect(opt.id)
                    if (opt.id === 'paypal') onOpenChange(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors',
                    selectedMethod === opt.id
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center">{opt.icon}</div>
                  <span className="font-medium text-neutral-950">{opt.label}</span>
                  {selectedMethod === opt.id && (
                    <span className="ml-auto text-sm text-neutral-600">Selected</span>
                  )}
                </button>
              ))}
            </div>

            {showCardInput && (
              <div ref={cardSectionRef} className="mt-6 border-t border-neutral-200 pt-6 shrink-0">
                <h3 className="text-sm font-medium text-neutral-950 mb-3">Enter card details</h3>
                {cardError && (
                  <p className="text-sm text-red-500 mb-3">{cardError}</p>
                )}
                {setupClientSecret ? (
                  <CardInputSection
                    clientSecret={setupClientSecret}
                    customerEmail={shippingAddress?.email}
                    onSuccess={(card) => {
                      onCardSaved(card)
                      onOpenChange(false)
                    }}
                    onError={setCardError}
                  />
                ) : (
                  <div className="flex items-center gap-2 py-4 text-neutral-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
                    <span className="text-sm">Loading payment form...</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 border-t border-neutral-200 pt-6 shrink-0">
              <h3 className="text-sm font-medium text-neutral-950">Billing address</h3>
              <div className="mt-3 flex items-center gap-2">
                <Checkbox
                  id="same-as-shipping"
                  checked={sameAsShipping}
                  onCheckedChange={(c) => handleSameAsChange(!!c)}
                />
                <Label htmlFor="same-as-shipping" className="text-sm text-neutral-700 cursor-pointer">
                  Same as Address
                </Label>
              </div>
              {!sameAsShipping && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setBillingModalOpen(true)}
                    className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    {billingAddress
                      ? `${billingAddress.addressLine1}, ${billingAddress.city}`
                      : 'Add billing address'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      <AddressModal
        open={billingModalOpen}
        onOpenChange={setBillingModalOpen}
        initialAddress={billingAddress}
        onSave={handleBillingSave}
        addressType="billing"
      />
    </Dialog.Root>
  )
}
