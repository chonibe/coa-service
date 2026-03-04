'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Gift, TicketPercent, Clock, HelpCircle, MessageCircle, User } from 'lucide-react'
import { Sheet } from '@/components/ui'
import { AuthSlideupMenu } from '@/components/shop/auth/AuthSlideupMenu'
import { PromoCodeModal } from '@/components/shop/checkout/PromoCodeModal'
import { validatePromo } from '@/lib/shop/useValidatePromo'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { openTawkChat } from '@/lib/tawk'

const MENU_ITEMS = [
  { label: 'Buy Gift Card', href: '/shop/gift-cards', icon: Gift },
  { label: 'Promo Codes', icon: TicketPercent, openPromoModal: true },
  { label: 'My Orders', href: '/shop/account', icon: Clock },
  { label: 'Help Center', href: '/shop/faq', icon: HelpCircle },
  { label: 'Chat with Us', href: '#', icon: MessageCircle, onClick: openTawkChat },
] as const

export interface ShopSlideoutMenuProps {
  open: boolean
  onClose: () => void
  theme?: 'light' | 'dark'
  authRedirectTo?: string
  /** For experience page: promo/order state from OrderContext */
  promoCode?: string
  promoDiscount?: number
  onPromoChange?: (code: string, discount: number) => void
  orderTotal?: number
  volumeDiscountLabel?: string
  volumeDiscountDescription?: string
}

/**
 * Shared slideout menu used by Experience header and street-collector top bar.
 * Same menu content: auth, Buy Gift Card, Promo Codes, My Orders, Help Center, Chat.
 */
export function ShopSlideoutMenu({
  open,
  onClose,
  theme = 'light',
  authRedirectTo = '/shop/experience',
  promoCode: controlledPromoCode,
  promoDiscount: controlledPromoDiscount,
  onPromoChange,
  orderTotal = 0,
  volumeDiscountLabel,
  volumeDiscountDescription,
}: ShopSlideoutMenuProps) {
  const [authOpen, setAuthOpen] = useState(false)
  const [promoModalOpen, setPromoModalOpen] = useState(false)
  const { user, isAuthenticated, loading } = useShopAuthContext()

  const useControlledPromo = onPromoChange != null
  const [localPromoCode, setLocalPromoCode] = useState('')
  const [localPromoDiscount, setLocalPromoDiscount] = useState(0)
  const promoCode = useControlledPromo ? (controlledPromoCode ?? '') : localPromoCode
  const promoDiscount = useControlledPromo ? (controlledPromoDiscount ?? 0) : localPromoDiscount

  const handlePromoApply = async (code: string) => {
    const { valid, discountCents } = await validatePromo(code, Math.round(orderTotal * 100))
    const discount = valid ? discountCents / 100 : 0
    if (useControlledPromo && onPromoChange) {
      onPromoChange(code, discount)
    } else {
      setLocalPromoCode(code)
      setLocalPromoDiscount(discount)
    }
  }

  const handlePromoRemove = () => {
    if (useControlledPromo && onPromoChange) {
      onPromoChange('', 0)
    } else {
      setLocalPromoCode('')
      setLocalPromoDiscount(0)
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        side="left"
        overlayClassName="z-[70]"
        className="!p-0 !h-[92vh] !top-[4vh] !bottom-auto"
        theme={theme}
      >
        <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-white/10">
            <span className="text-lg font-semibold text-neutral-900 dark:text-white">Menu</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="p-2 -m-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-950">
            {!loading && isAuthenticated && user ? (
              <>
                <p className="text-neutral-900 dark:text-white text-[15px] leading-snug mb-3">
                  <span className="font-semibold">
                    Welcome back{user.firstName ? `, ${user.firstName}` : ''}!
                  </span>
                  <br />
                  <span className="text-neutral-600 dark:text-neutral-400 text-sm">Your progress is saved.</span>
                </p>
                <Link
                  href="/shop/account"
                  onClick={onClose}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#047AFF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0366d6]"
                >
                  <User size={18} className="shrink-0" />
                  View My Account
                </Link>
              </>
            ) : (
              <>
                <p className="text-neutral-900 dark:text-white text-[15px] leading-snug mb-3">
                  <span className="font-semibold">Sign up</span>
                  {' to save your progress &'}
                  <br />
                  track orders
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    setAuthOpen(true)
                  }}
                  className="flex w-full items-center justify-center rounded-lg bg-[#047AFF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0366d6]"
                >
                  Login or Sign Up
                </button>
              </>
            )}
          </div>

          <nav className="flex flex-col py-4">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon
              const content = (
                <span className="flex items-center gap-4">
                  <Icon size={22} className="shrink-0 text-neutral-700 dark:text-neutral-300" strokeWidth={1.5} />
                  <span className="text-neutral-900 dark:text-white font-medium">{item.label}</span>
                </span>
              )
              if ('openPromoModal' in item && item.openPromoModal) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      onClose()
                      setPromoModalOpen(true)
                    }}
                    className="flex w-full items-center px-6 py-3.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-b border-neutral-100 dark:border-white/10 last:border-b-0"
                  >
                    {content}
                  </button>
                )
              }
              if ('onClick' in item && typeof item.onClick === 'function') {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.onClick!()
                      onClose()
                    }}
                    className="flex w-full items-center px-6 py-3.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-b border-neutral-100 dark:border-white/10 last:border-b-0"
                  >
                    {content}
                  </button>
                )
              }
              return (
                <Link
                  key={item.label}
                  href={'href' in item ? item.href : '#'}
                  onClick={onClose}
                  className="flex w-full items-center px-6 py-3.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-b border-neutral-100 dark:border-white/10 last:border-b-0"
                >
                  {content}
                </Link>
              )
            })}
          </nav>
        </div>
      </Sheet>

      <AuthSlideupMenu
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        redirectTo={authRedirectTo}
      />

      <PromoCodeModal
        open={promoModalOpen}
        onOpenChange={setPromoModalOpen}
        appliedCode={promoCode}
        appliedDiscount={promoDiscount}
        onApply={handlePromoApply}
        onRemove={handlePromoRemove}
        volumeDiscountLabel={volumeDiscountLabel}
        volumeDiscountDescription={volumeDiscountDescription}
      />
    </>
  )
}
