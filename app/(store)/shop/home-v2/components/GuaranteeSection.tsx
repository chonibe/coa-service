'use client'

import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import styles from '../landing.module.css'
import { getStorePageContent } from '@/lib/content/site-content'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'

const homeV2LandingContent = getStorePageContent('homeV2')

export function GuaranteeSection() {
  const reveal = useLandingScrollReveal({ mode: 'stagger', rootMargin: '0px 0px -15% 0px' })

  return (
    <div ref={reveal.ref} className={cn(styles.guarantee, reveal.className)} role="region" aria-label="Guarantee">
      {homeV2LandingContent.guarantee.map((g, i) => (
        <div
          className={cn(styles.gItem, styles.landingStagger)}
          style={{ '--stagger': i } as CSSProperties}
          key={g.title}
        >
          <span className={styles.gIcon} aria-hidden>
            {g.icon}
          </span>
          <h3 className={styles.gTitle}>{g.title}</h3>
          <p className={styles.gBody}>{g.body}</p>
        </div>
      ))}
    </div>
  )
}
