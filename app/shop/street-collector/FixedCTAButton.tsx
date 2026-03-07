'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ShopSlideoutMenu } from '@/components/shop/navigation/ShopSlideoutMenu'

const DEFAULT_LOGO_URL = 'https://thestreetcollector.com/cdn/shop/files/Group_707.png?v=1767356535&width=100'

interface FixedCTAButtonProps {
  text: string
  href: string
  logoUrl?: string
}

/**
 * Scroll-aware CTA: in hero the button is rendered by VideoPlayer overlay.
 * When scrolled past hero: hides top bar on scroll down, shows on scroll up.
 */
export function FixedCTAButton({ text, href, logoUrl = DEFAULT_LOGO_URL }: FixedCTAButtonProps) {
  const [showTopBar, setShowTopBar] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pastHero, setPastHero] = useState(false)
  const lastScrollY = useRef(0)

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
        setPastHero(!e.isIntersecting)
      },
      { threshold: 0, rootMargin: '0px' }
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [isMobile])

  useEffect(() => {
    if (isMobile || !pastHero) return
    const handleScroll = () => {
      const y = window.scrollY
      if (y < 50) {
        setShowTopBar(true)
      } else if (y > lastScrollY.current) {
        setShowTopBar(false)
      } else {
        setShowTopBar(true)
      }
      lastScrollY.current = y
    }
    lastScrollY.current = window.scrollY
    setShowTopBar(window.scrollY < 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMobile, pastHero])

  const showMobile = isMobile
  const renderDesktopBar = !isMobile && pastHero

  if (showMobile) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center px-2 pb-4 sm:hidden"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <Link
          href={href}
          className="w-full flex items-center justify-center text-sm font-semibold rounded-lg px-5 py-2.5 shadow-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: '#FFBA94', color: '#390000' }}
        >
          {text}
        </Link>
      </div>
    )
  }

  if (renderDesktopBar) {
    return (
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 sm:px-4 py-1.5 bg-white/80 dark:bg-[#151212]/80 backdrop-blur-md border-b border-neutral-200/60 dark:border-white/10 transition-transform duration-300 ease-out',
          !showTopBar && '-translate-y-full'
        )}
        style={{ paddingTop: 'max(0.375rem, env(safe-area-inset-top, 0px))' }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/shop/street-collector"
            aria-label="Street Collector Home"
            className="inline-flex items-center justify-center p-1 -m-1 transition-transform hover:scale-105"
          >
            <img src={logoUrl} alt="" width={24} height={24} className="shrink-0 w-6 h-6 object-contain" />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="inline-flex items-center justify-center p-1 -m-1 text-neutral-600 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white transition-colors"
          >
            <Menu size={20} className="shrink-0" />
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
          className="inline-flex items-center justify-center text-xs sm:text-sm font-semibold rounded-md px-3 sm:px-4 py-1.5 sm:py-2 shadow-md transition-colors shrink-0 hover:opacity-90"
          style={{ backgroundColor: '#FFBA94', color: '#390000' }}
        >
          {text}
        </Link>
      </div>
    )
  }

  return null
}
