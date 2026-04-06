'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'

export function FaqSectionLanding() {
  const { faq } = homeV2LandingContent
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const reveal = useLandingScrollReveal({ mode: 'stagger', rootMargin: '0px 0px -8% 0px' })

  return (
    <section ref={reveal.ref} className={cn(styles.faqSection, reveal.className)} aria-label="FAQ">
      <div
        className={styles.landingStagger}
        style={{ '--stagger': 0 } as CSSProperties}
      >
        <div className={styles.eyebrow}>{faq.eyebrow}</div>
        <h2 className={styles.sectionTitle} style={{ marginBottom: 48 }}>
          Everything you
          <br />
          <em>{faq.titleEmphasis}</em>
        </h2>
      </div>

      {faq.items.map((item, idx) => {
        const open = openIdx === idx
        const triggerId = `home-v2-faq-trigger-${idx}`
        const panelId = `home-v2-faq-panel-${idx}`
        return (
          <div
            className={cn(styles.faqItem, styles.landingStagger, open && styles.faqOpen)}
            style={{ '--stagger': idx + 1 } as CSSProperties}
            key={item.question}
          >
            <button
              type="button"
              id={triggerId}
              className={styles.faqQ}
              onClick={() => setOpenIdx(open ? null : idx)}
              aria-expanded={open}
              aria-controls={panelId}
            >
              <span>{item.question}</span>
              <span className={styles.faqIcon} aria-hidden>
                +
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              className={styles.faqA}
              aria-labelledby={triggerId}
              aria-hidden={!open}
            >
              {item.answer}
            </div>
          </div>
        )
      })}
    </section>
  )
}

