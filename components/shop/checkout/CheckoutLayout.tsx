'use client'

import * as React from 'react'
import { Home, CreditCard, Loader2, Tag } from 'lucide-react'
import { validatePromo } from '@/lib/shop/useValidatePromo'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  useCheckout,
  type PaymentMethodType,
  type CheckoutAddress,
} from '@/lib/shop/CheckoutContext'
import { AddressModal } from './AddressModal'
import { PAYPAL_LOGO_URL } from './PaymentButtonAssets'
import { PaymentMethodModal } from './PaymentMethodModal'
import { PromoCodeModal } from './PromoCodeModal'
import { useShippingCountries } from '@/lib/shop/useShippingCountries'

function getPaymentMethodLabel(method: PaymentMethodType): string {
  switch (method) {
    case 'link':
      return 'Google Pay'
    case 'paypal':
      return 'PayPal'
    case 'card':
    default:
      return 'Credit Card'
  }
}

function PaymentButtonIcon({ method, size = 'md' }: { method: PaymentMethodType; size?: 'sm' | 'md' | 'lg' }) {
  const w = size === 'lg' ? 28 : size === 'sm' ? 18 : 20
  const h = size === 'lg' ? 18 : size === 'sm' ? 12 : 14
  if (method === 'link') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width={w} height={h} aria-hidden className="shrink-0">
        <path d="M13.986 11.284c0-.308-.024-.616-.073-.92h-4.29v1.747h2.451a2.096 2.096 0 0 1-.9 1.373v1.134h1.464a4.433 4.433 0 0 0 1.348-3.334z" fill="#4285F4" />
        <path d="M9.629 15.721a4.352 4.352 0 0 0 3.01-1.097l-1.466-1.14a2.752 2.752 0 0 1-4.094-1.44H5.577v1.17a4.53 4.53 0 0 0 4.052 2.507z" fill="#34A853" />
        <path d="M7.079 12.05a2.709 2.709 0 0 1 0-1.735v-1.17H5.577a4.505 4.505 0 0 0 0 4.075l1.502-1.17z" fill="#FBBC04" />
        <path d="M9.629 8.44a2.452 2.452 0 0 1 1.74.68l1.3-1.293a4.37 4.37 0 0 0-3.065-1.183 4.53 4.53 0 0 0-4.027 2.5l1.502 1.171a2.715 2.715 0 0 1 2.55-1.875z" fill="#EA4335" />
      </svg>
    )
  }
  if (method === 'paypal') {
    return (
      <img
        src={PAYPAL_LOGO_URL}
        alt="PayPal"
        width={w}
        height={h}
        aria-hidden
        className="shrink-0 object-contain"
      />
    )
  }
  return <CreditCard className={size === 'lg' ? 'h-7 w-7 shrink-0' : 'h-5 w-5 shrink-0'} />
}

export interface CheckoutLayoutProps {
  /** Order items / line items section - custom content */
  children: React.ReactNode
  subtotal: number
  discount?: number
  /** Additional discount label (e.g. "Credits" or "Promo") */
  discountLabel?: string
  shipping: number
  total: number
  onCheckout: () => void | Promise<void>
  isCheckingOut?: boolean
  error?: string | null
  /** Disable checkout (e.g. empty cart, unavailable items) */
  disabled?: boolean
  /** Compact layout for drawer */
  variant?: 'drawer' | 'page'
  /** Item count for total label */
  itemCount?: number
  /** Optional AnimatedPrice-like component for total */
  renderTotal?: (value: number) => React.ReactNode
  /** Hide "Checkout" title when parent provides it */
  hideTitle?: boolean
  /** Optional bar/section rendered at top (e.g. lamp discount progress) */
  topSection?: React.ReactNode
  /** When true, hide Discount line in summary (discount already shown in topSection) */
  suppressDiscountInSummary?: boolean
}

export function CheckoutLayout({
  children,
  subtotal,
  discount = 0,
  discountLabel,
  shipping,
  total,
  onCheckout,
  isCheckingOut = false,
  error,
  disabled = false,
  variant = 'drawer',
  itemCount,
  renderTotal,
  hideTitle = false,
  topSection,
  suppressDiscountInSummary = false,
}: CheckoutLayoutProps) {
  const countryOptions = useShippingCountries()
  const checkout = useCheckout()
  const {
    address,
    billingAddress,
    sameAsShipping,
    paymentMethod,
    openSection,
    promoCode,
    promoDiscount,
    savedCard,
    setAddress,
    setBillingAddress,
    setSameAsShipping,
    setPaymentMethod,
    setSavedCard,
    setPromoCode,
    setPromoDiscount,
    openAddressModal,
    openPaymentModal,
    openPromoModal,
    closeModals,
    validateAndOpenFirstIncomplete,
  } = checkout

  const isAddressComplete = checkout.isAddressComplete()
  const effectiveDiscount = discount + promoDiscount
  const finalTotal = total - promoDiscount

  const handlePayClick = async () => {
    if (disabled) return
    if (!validateAndOpenFirstIncomplete()) return
    await onCheckout()
  }

  const addressDisplay = address
    ? `${address.addressLine1}${address.city ? `, ${address.city}` : ''}`
    : null
  const countryName = address?.country
    ? countryOptions.find((c) => c.code === address.country)?.name ?? address.country
    : null

  return (
    <div className="flex flex-col px-6">
      {!hideTitle && (
        <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">Checkout</h3>
      )}

      {topSection && <div className="mt-4">{topSection}</div>}

      {/* Add Address */}
      <button
        type="button"
        onClick={() => {
          closeModals()
          openAddressModal()
        }}
        className="mt-4 flex w-full items-center gap-3 py-4 text-left transition-colors hover:opacity-80"
      >
        <Home className={cn('h-5 w-5 shrink-0', isAddressComplete ? 'text-neutral-500 dark:text-[#c4a0a0]' : 'text-amber-600 dark:text-amber-500')} />
        <div className="min-w-0 flex-1">
          {addressDisplay ? (
            <>
              <p className="truncate font-medium text-neutral-950 dark:text-white">{addressDisplay}</p>
              {countryName && (
                <p className="text-xs text-neutral-600 dark:text-[#c4a0a0]">{countryName}</p>
              )}
            </>
          ) : (
            <p className={cn('font-medium', isAddressComplete ? 'text-neutral-950 dark:text-white' : 'text-amber-700 dark:text-amber-400')}>
              Add Address
            </p>
          )}
        </div>
      </button>

      {/* Payment method — icon + label; show saved card "(Visa) ending in 1122" when available */}
      <button
        type="button"
        onClick={() => {
          closeModals()
          openPaymentModal()
        }}
        className="mt-4 flex w-full items-center justify-between gap-3 py-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <PaymentButtonIcon method={paymentMethod} />
          <span className="font-medium text-neutral-950">
            {savedCard && (paymentMethod === 'card' || paymentMethod === 'link')
              ? `${savedCard.brand.charAt(0).toUpperCase() + savedCard.brand.slice(1)} ending in ${savedCard.last4}`
              : getPaymentMethodLabel(paymentMethod)}
          </span>
        </div>
        <span className="text-sm font-medium text-neutral-400 dark:text-[#b89090] shrink-0">
          Change
        </span>
      </button>

      <div className="my-4 border-t border-neutral-200 dark:border-white/10" />

      {/* Promo — between dividers */}
      <button
        type="button"
        onClick={() => {
          closeModals()
          openPromoModal()
        }}
        className="flex w-full items-center justify-between gap-3 py-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Tag className="h-5 w-5 shrink-0 text-neutral-600 dark:text-[#c4a0a0]" />
          <span className="font-medium text-neutral-950 dark:text-white">
            {promoCode ? promoCode : 'Add promo code'}
          </span>
        </div>
        <span className="text-sm font-medium text-neutral-400 dark:text-[#b89090] shrink-0">
          Change
        </span>
      </button>

      <div className="my-4 border-t border-neutral-200 dark:border-white/10" />

      {/* Order items (slot) */}
      {children}

      {/* Discount, Shipping, Total */}
      <div className="mt-4 space-y-2 border-t border-neutral-200 dark:border-white/10 pt-4">
        {effectiveDiscount > 0 && !suppressDiscountInSummary && (
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600 dark:text-[#c4a0a0]">
              Discount{discountLabel ? ` (${discountLabel})` : ''}
            </span>
            <span className="font-medium text-green-700">
              -${effectiveDiscount.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600 dark:text-[#c4a0a0]">Shipping</span>
          <span className="font-medium text-neutral-950 dark:text-white">
            {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="font-semibold text-neutral-950 dark:text-white">
            Total
            {itemCount != null
              ? ` (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`
              : ''}
          </span>
          <span className="text-lg font-bold text-neutral-950 dark:text-white">
            {renderTotal ? renderTotal(finalTotal) : `$${Math.max(0, finalTotal).toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Payment button */}
      <div className="mt-4 space-y-2">
        {error && (
          <p className="text-center text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handlePayClick}
          disabled={isCheckingOut || disabled}
          className={cn(
            'flex w-full items-center justify-center gap-3 rounded-lg py-4 text-base font-semibold transition-colors',
            isCheckingOut || disabled
              ? 'cursor-not-allowed bg-neutral-200 dark:bg-[#201c1c] text-neutral-500 dark:text-[#c4a0a0]'
              : 'bg-neutral-950 dark:bg-[#f0e8e8] text-white dark:text-[#171515] hover:bg-neutral-800 dark:hover:bg-[#e8d4d4]'
          )}
        >
          {isCheckingOut ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {paymentMethod === 'link' ? (
                <PaymentButtonIcon method="link" size="lg" />
              ) : paymentMethod === 'paypal' ? (
                <>
                  <PaymentButtonIcon method="paypal" size="lg" />
                  PayPal
                </>
              ) : (
                <>Place order</>
              )}
            </>
          )}
        </motion.button>
      </div>

      {/* Modals */}
      <AddressModal
        open={openSection === 'address'}
        onOpenChange={(open) => !open && closeModals()}
        initialAddress={address}
        onSave={(addr) => {
          setAddress(addr)
          if (sameAsShipping) setBillingAddress(addr)
          closeModals()
        }}
        billingAddress={!sameAsShipping ? billingAddress : null}
      />
      <PaymentMethodModal
        open={openSection === 'payment'}
        onOpenChange={(open) => !open && closeModals()}
        selectedMethod={paymentMethod}
        onSelect={(m) => {
          setPaymentMethod(m)
          if (m === 'paypal') closeModals()
        }}
        onCardSaved={(card) => {
          setSavedCard(card)
          closeModals()
        }}
        shippingAddress={address}
        sameAsShipping={sameAsShipping}
        onSameAsShippingChange={(v) => {
          setSameAsShipping(v)
          if (v) setBillingAddress(null)
        }}
        billingAddress={sameAsShipping ? address : billingAddress}
        onBillingAddressSave={(addr) => setBillingAddress(addr)}
      />
      <PromoCodeModal
        open={openSection === 'promo'}
        onOpenChange={(open) => !open && closeModals()}
        appliedCode={promoCode}
        appliedDiscount={promoDiscount}
        onApply={async (code) => {
          setPromoCode(code)
          const subtotalCents = Math.round(subtotal * 100)
          const { valid, discountCents } = await validatePromo(code, subtotalCents)
          setPromoDiscount(valid ? discountCents / 100 : 0)
          closeModals()
        }}
        onRemove={() => {
          setPromoCode('')
          setPromoDiscount(0)
        }}
      />
    </div>
  )
}
