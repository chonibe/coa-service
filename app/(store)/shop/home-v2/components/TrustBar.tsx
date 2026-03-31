'use client'

import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'

function TrustIcon({ kind }: { kind: 'check' | 'shield' | 'return' | 'clock' }) {
  const common = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none' as const, stroke: 'currentColor', strokeWidth: 2 }
  switch (kind) {
    case 'check':
      return (
        <svg {...common} aria-hidden className={styles.trustIcon}>
          <path d="M5 12l5 5L20 7" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...common} aria-hidden className={styles.trustIcon}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    case 'return':
      return (
        <svg {...common} aria-hidden className={styles.trustIcon}>
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 .49-3.83" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common} aria-hidden className={styles.trustIcon}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
      )
  }
}

export function TrustBar() {
  const items = homeV2LandingContent.trust
  const icons: Array<'check' | 'shield' | 'return' | 'clock'> = ['check', 'shield', 'return', 'clock']

  return (
    <div className={styles.trust} role="region" aria-label="Trust">
      {items.map((text, idx) => (
        <div className={styles.trustItem} key={`${text}-${idx}`}>
          <TrustIcon kind={icons[idx] ?? 'check'} />
          {text}
        </div>
      ))}
    </div>
  )
}

