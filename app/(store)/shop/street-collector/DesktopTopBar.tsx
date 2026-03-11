'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'

interface DesktopTopBarProps {
  text: string
  href: string
  logoUrl: string
}

/**
 * Desktop top bar with logo, menu, and CTA. Shows when scrolled past hero (md+ only).
 */
export function DesktopTopBar({ text, href, logoUrl }: DesktopTopBarProps) {
  const [pastHero, setPastHero] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [SlideoutMenu, setSlideoutMenu] = useState<React.ComponentType<{
    open: boolean
    onClose: () => void
    theme?: 'light' | 'dark'
    authRedirectTo?: string
  }> | null>(null)

  useEffect(() => {
    if (menuOpen && !SlideoutMenu) {
      import('@/components/shop/navigation/ShopSlideoutMenu').then((m) =>
        setSlideoutMenu(() => m.ShopSlideoutMenu)
      )
    }
  }, [menuOpen, SlideoutMenu])

  useEffect(() => {
    let io: IntersectionObserver | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let retries = 0
    const maxRetries = 20
    let cancelled = false

    const setup = () => {
      if (cancelled) return
      const sentinel = document.getElementById('street-collector-hero-sentinel')
      if (!sentinel) {
        if (retries < maxRetries) {
          retries += 1
          timeoutId = setTimeout(setup, 100)
        }
        return
      }
      io = new IntersectionObserver(
        (entries) => {
          const e = entries[0]
          if (e) setPastHero(!e.isIntersecting)
        },
        { threshold: 0 }
      )
      io.observe(sentinel)
    }
    setup()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      io?.disconnect()
    }
  }, [])

  if (!pastHero) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[120] hidden md:flex items-center justify-between px-3 sm:px-4 py-1.5 bg-white/80 dark:bg-[#171515]/80 backdrop-blur-md border-b border-neutral-200/60 dark:border-white/10"
      style={{ paddingTop: 'max(0.375rem, env(safe-area-inset-top, 0px))' }}
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/"
          aria-label="Street Collector Home"
          className="inline-flex items-center justify-center p-1 -m-1 transition-transform hover:scale-105"
        >
          <img
            src={getProxiedImageUrl(logoUrl)}
            alt=""
            width={24}
            height={24}
            className="shrink-0 w-6 h-6 object-contain"
          />
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="inline-flex items-center justify-center p-1 -m-1 text-neutral-600 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white transition-colors"
        >
          <Menu size={20} className="shrink-0" />
        </button>
        {SlideoutMenu && (
          <SlideoutMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            theme="light"
            authRedirectTo="/"
          />
        )}
      </div>
      <Link
        href={href}
        prefetch={false}
        className="inline-flex items-center justify-center text-xs sm:text-sm font-semibold rounded-md px-3 sm:px-4 py-1.5 sm:py-2 shadow-md transition-colors shrink-0 hover:opacity-90"
        style={{ backgroundColor: '#FFBA94', color: '#390000' }}
      >
        {text}
      </Link>
    </div>
  )
}
