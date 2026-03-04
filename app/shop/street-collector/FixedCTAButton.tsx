'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { ShopSlideoutMenu } from '@/components/shop/navigation/ShopSlideoutMenu'

const DEFAULT_LOGO_URL = 'https://thestreetcollector.com/cdn/shop/files/Group_707.png?v=1767356535&width=100'

interface FixedCTAButtonProps {
  text: string
  href: string
  logoUrl?: string
}

/**
 * Scroll-aware CTA: in hero the button is rendered by VideoPlayer overlay.
 * When scrolled past hero, shows a top bar with logo, hamburger, and CTA button.
 */
export function FixedCTAButton({ text, href, logoUrl = DEFAULT_LOGO_URL }: FixedCTAButtonProps) {
  const [showTopBar, setShowTopBar] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isMobile) return
    const sentinel = document.getElementById('street-collector-hero-sentinel')
    if (!sentinel) return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (!e) return
        setShowTopBar(!e.isIntersecting)
      },
      { threshold: 0, rootMargin: '0px' }
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [isMobile])

  const showMobile = isMobile
  const showDesktop = !isMobile && showTopBar

  if (showMobile) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center px-2 pb-4 sm:hidden"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <Link
          href={href}
          className="w-full flex items-center justify-center text-sm font-semibold rounded-lg px-5 py-2.5 text-white bg-[#047AFF] hover:bg-[#0366d6] shadow-lg transition-colors"
        >
          {text}
        </Link>
      </div>
    )
  }

  if (showDesktop) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 pb-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200/60 dark:border-white/10"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/shop/street-collector"
            aria-label="Street Collector Home"
            className="inline-flex items-center justify-center p-2 -m-2 transition-transform hover:scale-105"
          >
            <img src={logoUrl} alt="" width={32} height={32} className="shrink-0 w-8 h-8 object-contain" />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="inline-flex items-center justify-center p-2 -m-2 text-neutral-600 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white transition-colors"
          >
            <Menu size={24} className="shrink-0" />
          </button>
          <ShopSlideoutMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            theme="light"
            authRedirectTo="/shop/street-collector"
          />
        </div>
        <Link
          href={href}
          className="inline-flex items-center justify-center text-sm sm:text-base font-semibold rounded-lg px-5 sm:px-6 py-2.5 sm:py-3 text-white bg-[#047AFF] hover:bg-[#0366d6] shadow-lg transition-colors shrink-0"
        >
          {text}
        </Link>
      </div>
    )
  }

  return null
}
