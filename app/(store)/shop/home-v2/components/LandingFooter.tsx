'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'

export function LandingFooter() {
  const { footer } = homeV2LandingContent
  const reveal = useLandingScrollReveal({ rootMargin: '0px 0px -5% 0px' })

  return (
    <footer ref={reveal.ref} className={cn(styles.footer, reveal.className)}>
      <span>{footer.left}</span>
      <div className={styles.footerLinks}>
        {footer.links.map((l) => (
          <Link key={`${l.href}-${l.label}`} href={l.href}>
            {l.label}
          </Link>
        ))}
      </div>
      <span>{footer.right}</span>
    </footer>
  )
}

