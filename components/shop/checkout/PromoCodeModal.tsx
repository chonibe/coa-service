'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExperienceTheme } from '@/app/shop/experience/ExperienceThemeContext'
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
const AVAILABLE_PROMOS: { code: string; description: string; isDefault?: boolean }[] = [
  { code: 'WELCOME', description: '25% off orders above $449', isDefault: true },
  { code: 'WELCOME10', description: '10% off your first order' },
  { code: 'FREESHIP', description: 'Free shipping on orders over $50' },
]

const ACCENT = 'text-rose-500'
const ACCENT_BG = 'bg-rose-500'

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
  const { theme } = useExperienceTheme()
  const [inputValue, setInputValue] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [addCodeExpanded, setAddCodeExpanded] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setInputValue('')
      setError(null)
      setAddCodeExpanded(false)
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
    setAddCodeExpanded(false)
  }

  const handleApplyFromList = (code: string) => {
    if (appliedCode === code) {
      onRemove()
    } else {
      onApply(code)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 top-0 z-[101] flex flex-col',
            theme === 'dark' ? 'bg-neutral-950' : 'bg-white',
            'max-h-[100dvh] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            'sm:data-[state=closed]:slide-out-to-bottom-4 sm:data-[state=open]:slide-in-from-bottom-4'
          )}
        >
          {/* Wrapper for dark mode - portaled content needs explicit theme */}
          <div className={cn('flex flex-col h-full', theme === 'dark' && 'dark')}>
            {/* Header: X | Promo Codes | Done (pink accent) */}
            <div className={cn('flex shrink-0 items-center justify-between border-b px-4 py-5', theme === 'dark' ? 'border-white/10' : 'border-neutral-100')}>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <Dialog.Title className="text-lg font-semibold text-neutral-950 dark:text-white">Promo Codes</Dialog.Title>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                data-testid="promo-code-done-button"
                className={cn('text-sm font-medium', ACCENT, 'hover:opacity-90')}
              >
                Done
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* Volume Discount (non-interactive) */}
              {volumeDiscountLabel && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{volumeDiscountLabel}</p>
                  {volumeDiscountDescription && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">{volumeDiscountDescription}</p>
                  )}
                </div>
              )}

              {/* Selectable promo cards - white cards with pink checkmark */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {appliedCode && !AVAILABLE_PROMOS.some((p) => p.code === appliedCode) && (
                  <button
                    type="button"
                    onClick={onRemove}
                    data-testid="applied-custom-code"
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                      'bg-white dark:bg-neutral-900 border-rose-400/50 dark:border-rose-500/50 shadow-sm'
                    )}
                  >
                    <span className={cn('h-5 w-5 shrink-0 rounded-full flex items-center justify-center', ACCENT_BG, 'text-white')}>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-950 dark:text-white">{appliedCode} (applied)</p>
                      {appliedDiscount > 0 && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">-${appliedDiscount.toFixed(2)}</p>
                      )}
                    </div>
                  </button>
                )}
                {AVAILABLE_PROMOS.map((p) => {
                  const isSelected = appliedCode === p.code
                  return (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => handleApplyFromList(p.code)}
                      data-testid={p.code}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                        'bg-white dark:bg-neutral-900',
                        isSelected
                          ? 'border-rose-400/50 dark:border-rose-500/50 shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                      )}
                    >
                      <span
                        className={cn(
                          'h-5 w-5 shrink-0 rounded-full flex items-center justify-center',
                          isSelected ? `${ACCENT_BG} text-white` : 'border-2 border-neutral-300 dark:border-neutral-600'
                        )}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-950 dark:text-white">
                          {p.code}{p.isDefault ? ' (default)' : ''}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{p.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Add Promo Code or Gift Card - collapsible link */}
              <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-white/10" data-testid="add-promo-code">
                <button
                  type="button"
                  onClick={() => setAddCodeExpanded(!addCodeExpanded)}
                  className="text-sm font-medium text-neutral-900 dark:text-white underline underline-offset-2 hover:opacity-80"
                >
                  Add Promo Code or Gift Card
                </button>
                {addCodeExpanded && (
                  <div className="mt-3 flex gap-2">
                    <Input
                      id="promo-input"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 dark:!border-neutral-600 dark:!bg-neutral-900 dark:!text-white dark:placeholder:!text-neutral-400"
                    />
                    <Button onClick={handleApply}>Apply</Button>
                  </div>
                )}
                {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
