'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Gift, Percent, Clock, HelpCircle, MessageCircle } from 'lucide-react'
import { Sheet } from '@/components/ui'
import { AuthSlideupMenu } from '@/components/shop/auth/AuthSlideupMenu'
import { ExperienceCartChip } from './ExperienceCartChip'
import { openTawkChat } from '@/lib/tawk'
import { cn } from '@/lib/utils'

const MENU_ITEMS = [
  { label: 'Buy Gift Card', href: '/shop', icon: Gift },
  { label: 'Promo Codes', href: '/shop/cart', icon: Percent },
  { label: 'My Orders', href: '/shop/account', icon: Clock },
  { label: 'Help Center', href: '/shop/faq', icon: HelpCircle },
  { label: 'Chat with Us', href: '#', icon: MessageCircle, onClick: openTawkChat },
] as const

export function ExperienceSlideoutMenu() {
  const [open, setOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <>
      <header
        className={cn(
          'shrink-0 flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6',
          'bg-neutral-950 border-b border-white/10 safe-area-inset-top'
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="inline-flex items-center justify-center p-2 -m-2 text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <Menu size={24} className="shrink-0" />
        </button>
        <ExperienceCartChip variant="dark" className="ml-auto" />
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
