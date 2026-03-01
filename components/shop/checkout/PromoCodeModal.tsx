'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Input } from '@/components/ui'

export interface PromoCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appliedCode: string
  appliedDiscount: number
  onApply: (code: string) => void
  onRemove: () => void
  /** Optional volume/lamp discount section (e.g. "Volume Discount Applied") */
  volumeDiscountLabel?: string
  volumeDiscountDescription?: string
}

/** Static list of available promo codes for display (Stripe validates at checkout) */
const AVAILABLE_PROMOS: { code: string; description: string }[] = [
  { code: 'WELCOME', description: '25% off orders above $449' },
  { code: 'WELCOME10', description: '10% off your first order' },
  { code: 'FREESHIP', description: 'Free shipping on orders over $50' },
]

export function PromoCodeModal({
  open,
  onOpenChange,
  appliedCode,
  appliedDiscount,
  onApply,
  onRemove,
  volumeDiscountLabel,
  volumeDiscountDescription,
}: PromoCodeModalProps) {
  const [inputValue, setInputValue] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setInputValue('')
      setError(null)
    }
  }, [open])

  const handleApply = () => {
    const code = inputValue.trim().toUpperCase()
    if (!code) {
      setError('Please enter a promo code')
      return
    }
    setError(null)
    onApply(code)
    setInputValue('')
  }

  const handleApplyFromList = (code: string) => {
    setInputValue(code)
    onApply(code)
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
            <Dialog.Title className="text-lg font-semibold text-neutral-950">Promo Codes</Dialog.Title>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              data-testid="promo-code-done-button"
              className="text-sm font-medium text-pink-600 hover:text-pink-700"
            >
              Done
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {volumeDiscountLabel && (
              <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="text-sm font-medium text-neutral-900">{volumeDiscountLabel}</p>
                {volumeDiscountDescription && (
                  <p className="text-xs text-neutral-600 mt-0.5">{volumeDiscountDescription}</p>
                )}
              </div>
            )}

            {appliedCode && (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-green-800">{appliedCode} applied</p>
                  {appliedDiscount > 0 && (
                    <p className="text-xs text-green-700">-${appliedDiscount.toFixed(2)}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onRemove}
                  className="text-sm font-medium text-green-700 underline hover:text-green-900"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="space-y-3">
              {AVAILABLE_PROMOS.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => handleApplyFromList(p.code)}
                  data-testid={p.code}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                    appliedCode === p.code
                      ? 'border-pink-300 bg-pink-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center',
                        appliedCode === p.code ? 'border-pink-500 bg-pink-500' : 'border-neutral-300'
                      )}
                    >
                      {appliedCode === p.code && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <div>
                      <p className="font-medium text-neutral-950">{p.code} {appliedCode === p.code && '(applied)'}</p>
                      <p className="text-xs text-neutral-600">{p.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4" data-testid="add-promo-code">
              <label htmlFor="promo-input" className="mb-2 block text-sm font-medium text-neutral-700">
                Add Promo Code or Gift Card
              </label>
              <div className="flex gap-2">
                <Input
                  id="promo-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1"
                />
                <Button onClick={handleApply}>Apply</Button>
              </div>
              {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
