'use client'

import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { openTawkChat } from '@/lib/tawk'

const HOME_ICON_URL = 'https://thestreetcollector.com/cdn/shop/files/Group_707.png?v=1767356535&width=100'

export interface LegalLink {
  label: string
  href: string
}

export interface BackBarProps {
  href?: string
  label?: string
  iconUrl?: string
  /** Legal/terms links shown on the right (Terms of Service, Privacy Policy, etc.) */
  legalLinks?: LegalLink[]
  /** Show chat icon on the right that opens Tawk.to chat */
  showChatIcon?: boolean
  /** Show center logo icon (default: true) */
  showLogo?: boolean
  /** Custom right-side slot (e.g. cart chip) — when set, replaces chat icon */
  rightSlot?: React.ReactNode
  className?: string
}

/**
 * Minimal top bar with back button, home icon, and optional legal links.
 * Used on shop pages to go back or return to the street-collector page.
 */

export function BackBar({
  href = '/shop/street-collector',
  label = 'Back to home',
  iconUrl = HOME_ICON_URL,
  legalLinks = [],
  showChatIcon = true,
  showLogo = true,
  rightSlot,
  className,
}: BackBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full',
        'bg-white border-b border-[#1a1a1a]/10',
        'safe-area-inset-top',
        className
      )}
    >
      <div className="relative flex items-center justify-center h-14 sm:h-16 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.history.back()
            }
          }}
          aria-label="Back"
          className="absolute left-4 sm:left-6 inline-flex items-center justify-center p-2 -m-2 text-[#1a1a1a]/80 hover:text-[#2c4bce] transition-transform hover:scale-110 cursor-pointer"
        >
          <ArrowLeft size={24} className="shrink-0" />
        </button>
        {showLogo && (
        <Link
          href={href}
          aria-label={label}
          className="inline-flex items-center justify-center p-2 -m-2 transition-transform hover:scale-110"
        >
          <img
            src={iconUrl}
            alt=""
            width={32}
            height={32}
            className="shrink-0 w-8 h-8 object-contain"
          />
        </Link>
        )}
        <div className="absolute right-4 sm:right-6 flex items-center gap-3 sm:gap-4">
          {legalLinks.length > 0 && (
            <nav
              className="hidden sm:flex items-center gap-3 sm:gap-4"
              aria-label="Terms & conditions"
            >
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-[#1a1a1a]/60 hover:text-[#2c4bce] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
          {rightSlot ?? (showChatIcon && (
            <button
              type="button"
              onClick={openTawkChat}
              aria-label="Open chat"
              className="inline-flex items-center justify-center p-2 -m-2 text-[#1a1a1a]/80 hover:text-[#2c4bce] transition-colors hover:scale-110 cursor-pointer"
            >
              <MessageCircle size={22} className="shrink-0" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
