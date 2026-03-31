'use client'

import Link from 'next/link'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'

export function LandingFooter() {
  const { footer } = homeV2LandingContent
  return (
    <footer className={styles.footer}>
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

