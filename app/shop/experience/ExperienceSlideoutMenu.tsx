'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Menu, Gift, TicketPercent, Clock, HelpCircle, MessageCircle } from 'lucide-react'
import { Sheet } from '@/components/ui'
import { AuthSlideupMenu } from '@/components/shop/auth/AuthSlideupMenu'
import { ExperienceCartChip } from './ExperienceCartChip'
import { useExperienceOrder } from './ExperienceOrderContext'
import { openTawkChat } from '@/lib/tawk'
import { cn } from '@/lib/utils'

const MENU_ITEMS = [
  { label: 'Buy Gift Card', href: '/shop', icon: Gift },
  { label: 'Promo Codes', href: '/shop/cart', icon: TicketPercent },
  { label: 'My Orders', href: '/shop/account', icon: Clock },
  { label: 'Help Center', href: '/shop/faq', icon: HelpCircle },
  { label: 'Chat with Us', href: '#', icon: MessageCircle, onClick: openTawkChat },
] as const

export function ExperienceSlideoutMenu() {
  const [open, setOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [shouldPulse, setShouldPulse] = useState(false)
  const prevLampQuantity = useRef(0)
  const { orderBarProps } = useExperienceOrder()

  const showLampCard = orderBarProps && typeof orderBarProps.lampPrice === 'number'
  const lamp = orderBarProps?.lamp
  const lampQuantity = orderBarProps?.lampQuantity ?? 0
  const pastLampPaywall = orderBarProps?.pastLampPaywall ?? false

  useEffect(() => {
    if (lampQuantity > prevLampQuantity.current && lampQuantity > 0) {
      setShouldPulse(true)
    }
    prevLampQuantity.current = lampQuantity
  }, [lampQuantity])
  const handleLampQuantityChange = orderBarProps?.onLampQuantityChange ?? (() => {})
  const setDetailProduct = orderBarProps?.onViewLampDetail

  return (
    <>
      <header
        className={cn(
          'shrink-0 flex items-center h-14 sm:h-16 px-4 sm:px-6',
          'bg-neutral-950 border-b border-white/10 safe-area-inset-top'
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="inline-flex items-center justify-center p-2 -m-2 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <Menu size={24} className="shrink-0" />
        </button>

        {/* Spacer — pushes lamp + cart to the right when lamp shown */}
        {showLampCard && lamp && <div className="flex-1 min-w-0" />}

        {/* Lamp + counter — right side next to cart (only after paywall) */}
        {showLampCard && lamp && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
              {pastLampPaywall && (
                <div className="flex items-center gap-0.5">
                  <button type="button" onClick={() => handleLampQuantityChange(Math.max(0, lampQuantity - 1))} className="w-5 h-5 flex items-center justify-center rounded text-[12px] font-medium bg-white/10 hover:bg-white/20 text-white" aria-label="Decrease quantity">−</button>
                  <button type="button" onClick={() => handleLampQuantityChange(lampQuantity + 1)} className="w-5 h-5 flex items-center justify-center rounded text-[12px] font-medium bg-white/10 hover:bg-white/20 text-white" aria-label="Increase quantity">+</button>
                </div>
              )}
              <motion.button
                type="button"
                onClick={() => setDetailProduct?.(lamp)}
                className={cn(
                  'flex items-center gap-2 min-w-0 rounded-md px-2 py-1 -mx-1 -my-0.5 transition-colors cursor-pointer text-left relative',
                  lampQuantity > 0
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-white/5 hover:bg-white/15 text-white/80 hover:text-white'
                )}
                aria-label={`${lampQuantity} Street ${lampQuantity > 1 ? 'Lamps' : 'Lamp'}. View details`}
                animate={
                  shouldPulse
                    ? {
                        scale: [1, 1.35, 1],
                        filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)'],
                      }
                    : { scale: 1 }
                }
                transition={{ duration: 0.5, ease: 'easeOut' }}
                onAnimationComplete={() => setShouldPulse(false)}
              >
                <span className="relative inline-flex">
                  <span className={cn('absolute inset-0 flex items-center justify-center translate-x-0.5 text-[11px] font-bold tabular-nums pointer-events-none', lampQuantity > 0 ? 'text-green-400' : 'text-[#ffffff]')}>
                    {lampQuantity}
                  </span>
                  <svg viewBox="0 0 306 400" fill="currentColor" className={cn('w-6 h-7 shrink-0', lampQuantity > 0 ? 'text-neutral-300' : 'text-white/60')} xmlns="http://www.w3.org/2000/svg">
                    <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
                  </svg>
                </span>
                <span className={cn('text-xs font-medium truncate', lampQuantity > 0 ? 'text-white' : 'text-white/80')}>Street {lampQuantity > 1 ? 'Lamps' : 'Lamp'}</span>
              </motion.button>
            </div>
          </div>
        )}

        <div className={cn('flex items-center self-center shrink-0', showLampCard && lamp && 'ml-3')}>
          <ExperienceCartChip variant="dark" className={cn(showLampCard && lamp ? '' : 'ml-auto')} />
        </div>
      </header>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        overlayClassName="z-[70]"
        className="!p-0"
      >
        <div className="flex flex-col h-full bg-white">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <span className="text-lg font-semibold text-neutral-900">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="p-2 -m-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 border-b border-neutral-200 bg-white">
            <p className="text-neutral-900 text-[15px] leading-snug mb-3">
              <span className="font-semibold">Sign up</span>
              {' to save your progress &'}
              <br />
              track orders
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setAuthOpen(true)
              }}
              className="flex w-full items-center justify-center rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pink-600"
            >
              Login or Sign Up
            </button>
          </div>

          <nav className="flex flex-col py-4">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon
              const content = (
                <span className="flex items-center gap-4">
                  <Icon size={22} className="shrink-0 text-neutral-700" strokeWidth={1.5} />
                  <span className="text-neutral-900 font-medium">{item.label}</span>
                </span>
              )
              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.onClick?.()
                      setOpen(false)
                    }}
                    className="flex w-full items-center px-6 py-3.5 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
                  >
                    {content}
                  </button>
                )
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center px-6 py-3.5 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
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
        redirectTo="/shop/experience"
      />
    </>
  )
}
