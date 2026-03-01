'use client'

import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

function openTawkChat() {
  if (typeof window !== 'undefined' && (window as Window & { Tawk_API?: { showWidget: () => void; maximize: () => void } }).Tawk_API) {
    const api = (window as Window & { Tawk_API?: { showWidget: () => void; maximize: () => void } }).Tawk_API
    api?.showWidget()
    api?.maximize()
  }
}

export interface ChatIconScrollRevealProps {
  /** Scroll threshold in pixels - icon appears when scrollY exceeds this. Default: 70vh */
  thresholdPx?: number
  /** Optional className for the icon container */
  className?: string
}

/**
 * Fixed chat icon in top-right that fades in when user scrolls past the hero.
 * Used on street-collector and other hero-first pages.
 */
export function ChatIconScrollReveal({ thresholdPx, className }: ChatIconScrollRevealProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const threshold = thresholdPx ?? Math.round(typeof window !== 'undefined' ? window.innerHeight * 0.7 : 500)
    const check = () => setShow(window.scrollY > threshold)
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [thresholdPx])

  return (
    <button
      type="button"
      onClick={openTawkChat}
      aria-label="Open chat"
      className={cn(
        'fixed top-4 right-4 sm:top-5 sm:right-6 z-50',
        'inline-flex items-center justify-center p-2.5 rounded-full',
        'bg-white/95 backdrop-blur-sm border border-[#1a1a1a]/10 shadow-md',
        'text-[#1a1a1a]/80 hover:text-[#2c4bce] hover:bg-white transition-all duration-300',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
        className
      )}
    >
      <MessageCircle size={22} className="shrink-0" aria-hidden />
    </button>
  )
}
