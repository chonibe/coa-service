'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExperienceTheme } from '@/app/(store)/shop/experience-v2/ExperienceThemeContext'
import { Checkbox, Label } from '@/components/ui'
import { PaymentStep } from './PaymentStep'
import { AddressModal } from './AddressModal'
import type { CheckoutAddress } from '@/lib/shop/CheckoutContext'

interface CartLineItem {
  productId: string
  variantId: string
  variantGid: string
  handle: string
  title: string
  price: number
  quantity: number
  image?: string
}

export interface PaymentMethodsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartLineItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  itemCount: number
  customerEmail?: string
  shippingAddress: {
    email?: string
    fullName?: string
    country?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    phoneNumber?: string
  }
  onSuccess: (redirectUrl: string) => void
  onError: (message: string) => void
  onPaymentMethodChange?: (type: string) => void
  /** Billing address section: same as Address + add billing address */
  billingAddress?: CheckoutAddress | null
  sameAsShipping?: boolean
  onSameAsShippingChange?: (v: boolean) => void
  onBillingAddressSave?: (addr: CheckoutAddress) => void
  /** Preloaded checkout session clientSecret – starts loading immediately when cart opens */
  preloadedClientSecret?: string | null
  /** Ref for the payment form – parent can call requestSubmit() to trigger submit */
  formRef?: React.RefObject<HTMLFormElement | null>
}

export function PaymentMethodsModal({
  open,
  onOpenChange,
  items,
  subtotal,
  discount,
  shipping,
  total,
  itemCount,
  customerEmail,
  shippingAddress,
  onSuccess,
  onError,
  onPaymentMethodChange,
  billingAddress,
  sameAsShipping = true,
  onSameAsShippingChange,
  onBillingAddressSave,
  preloadedClientSecret,
  formRef,
}: PaymentMethodsModalProps) {
  const { theme } = useExperienceTheme()
  const [billingModalOpen, setBillingModalOpen] = React.useState(false)
  const showBillingSection = onSameAsShippingChange != null && onBillingAddressSave != null

  const handleSameAsChange = (checked: boolean) => {
    onSameAsShippingChange?.(checked)
    if (checked) setBillingModalOpen(false)
  }

  const handleBillingSave = (addr: CheckoutAddress) => {
    onBillingAddressSave?.(addr)
    setBillingModalOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          onPointerDownOutside={(e) => {
            // Prevent closing when user clicks Stripe Payment Element iframe (PayPal/GPay tab can trigger outside detection)
            const target = e.target as HTMLElement
            if (target?.tagName === 'IFRAME' || target?.closest?.('.stripe-payment-element, [data-stripe-payment]')) {
              e.preventDefault()
            }
          }}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement
            if (target?.tagName === 'IFRAME' || target?.closest?.('.stripe-payment-element, [data-stripe-payment]')) {
              e.preventDefault()
            }
          }}
          className={cn(
            'fixed inset-x-0 bottom-0 top-0 z-[101] flex flex-col',
            theme === 'dark' ? 'bg-[#171515]' : 'bg-white',
            'max-h-[100dvh] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            'sm:data-[state=closed]:slide-out-to-bottom-4 sm:data-[state=open]:slide-in-from-bottom-4'
          )}
        >
          {/* Wrapper for dark mode - min-h-0 lets flex children scroll properly */}
          <div className={cn('flex flex-col h-full min-h-0', theme === 'dark' && 'dark')}>
          <VisuallyHidden>
            <Dialog.Title>Payment</Dialog.Title>
          </VisuallyHidden>
          <div className={cn('flex shrink-0 items-center justify-between border-b px-4 py-5', theme === 'dark' ? 'border-white/10' : 'border-neutral-100')}>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              data-testid="payment-dialog-close-button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-[#201c1c] hover:text-neutral-700 dark:hover:text-[#d4b8b8]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="flex-1" aria-hidden />
            <button
              type="submit"
              form="checkout-payment-form"
              data-testid="place-order-in-modal-button"
              className="text-sm font-semibold text-white bg-[#047AFF] hover:bg-[#0366d6] px-4 py-2 rounded-lg"
            >
              Place Order
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4" data-testid="stripe-payment-element-loaded">
            <PaymentStep
              compact
              formId="checkout-payment-form"
              formRef={formRef}
              items={items}
              subtotal={subtotal}
              discount={discount}
              shipping={shipping}
              total={total}
              itemCount={itemCount}
              customerEmail={customerEmail}
              shippingAddress={shippingAddress}
              onSuccess={onSuccess}
              onError={onError}
              onPaymentMethodChange={onPaymentMethodChange}
              preloadedClientSecret={preloadedClientSecret}
            />
            {showBillingSection && (
              <div className="mt-6 border-t border-neutral-200 dark:border-white/10 pt-6">
                <h3 className="text-sm font-medium text-neutral-950 dark:text-white">Billing address</h3>
                <div className="mt-3 flex items-center gap-2">
                  <Checkbox
                    id="same-as-address"
                    checked={sameAsShipping}
                    onCheckedChange={(c) => handleSameAsChange(!!c)}
                  />
                  <Label htmlFor="same-as-address" className="text-sm text-neutral-700 dark:text-[#d4b8b8] cursor-pointer">
                    Same as Address
                  </Label>
                </div>
                {!sameAsShipping && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setBillingModalOpen(true)}
                      className="w-full rounded-lg border border-neutral-200 dark:border-white/20 px-4 py-3 text-left text-sm text-neutral-700 dark:text-[#d4b8b8] hover:bg-neutral-50 dark:hover:bg-[#201c1c]/50"
                    >
                      {billingAddress
                        ? `${billingAddress.addressLine1}, ${billingAddress.city}`
                        : 'Add billing address'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      {showBillingSection && (
        <AddressModal
          open={billingModalOpen}
          onOpenChange={setBillingModalOpen}
          initialAddress={billingAddress ?? undefined}
          onSave={handleBillingSave}
          addressType="billing"
        />
      )}
    </Dialog.Root>
  )
}
