'use client'

import { useState } from 'react'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'

export function FaqSectionLanding() {
  const { faq } = homeV2LandingContent
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <section className={styles.faqSection} aria-label="FAQ">
      <div className={styles.eyebrow}>{faq.eyebrow}</div>
      <h2 className={styles.sectionTitle} style={{ marginBottom: 48 }}>
        Everything you
        <br />
        <em>{faq.titleEmphasis}</em>
      </h2>

      {faq.items.map((item, idx) => {
        const open = openIdx === idx
        const triggerId = `home-v2-faq-trigger-${idx}`
        const panelId = `home-v2-faq-panel-${idx}`
        return (
          <div className={`${styles.faqItem} ${open ? styles.faqOpen : ''}`} key={item.question}>
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

