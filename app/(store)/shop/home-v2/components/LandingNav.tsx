'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let ticking = false
    const update = () => {
      setScrolled(window.scrollY > 60)
      ticking = false
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`} aria-label="Primary">
      <Link href={homeV2LandingContent.urls.home} aria-label="Street Collector Home">
        <Image
          src={homeV2LandingContent.nav.logoImageUrl}
          alt={homeV2LandingContent.nav.logoAlt}
          width={160}
          height={32}
          style={{ height: 32, width: 'auto', display: 'block' }}
          priority
        />
      </Link>
      <Link href={homeV2LandingContent.urls.experience} className={styles.navCta}>
        {homeV2LandingContent.nav.ctaText}
      </Link>
    </nav>
  )
}

