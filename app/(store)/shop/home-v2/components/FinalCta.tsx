"use client"

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'

type NewsletterState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export function FinalCta() {
  const { finalCta, urls } = homeV2LandingContent
  const reveal = useLandingScrollReveal({ rootMargin: '0px 0px -12% 0px' })
  const [email, setEmail] = React.useState('')
  const [state, setState] = React.useState<NewsletterState>({ status: 'idle' })

  const onSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmed = email.trim()
      if (!trimmed) {
        setState({ status: 'error', message: 'Enter an email to subscribe.' })
        return
      }
      setState({ status: 'pending' })
      try {
        const res = await fetch('/api/shop/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed }),
        })
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        if (!res.ok) {
          throw new Error(data?.error || 'Signup failed. Please try again.')
        }
        setState({ status: 'success' })
        setEmail('')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Signup failed.'
        setState({ status: 'error', message })
      }
    },
    [email],
  )

  return (
    <section ref={reveal.ref} className={cn(styles.final, reveal.className)} aria-label="Final call to action">
      <div className={styles.finalBg} aria-hidden>
        {finalCta.backgroundImages.map((src, idx) => (
          // eslint-disable-next-line @next/next/no-img-element -- match source HTML behavior
          <img key={`${src}-${idx}`} src={src} alt="" />
        ))}
      </div>

      <div className={styles.finalInner}>
        <h2 className={styles.finalTitle}>
          Your room deserves
          <br />
          <em>{finalCta.titleEmphasis}</em>
        </h2>
        <p className={styles.finalSub}>{finalCta.subtitle}</p>
        <div className={styles.finalBtns}>
          <Link href={urls.experience} className={styles.btnPrimary} style={{ marginBottom: 0 }}>
            {finalCta.primaryCta}
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href={urls.exploreArtists} className={styles.btnOutline}>
            {finalCta.secondaryCta}
          </Link>
        </div>

        <form
          onSubmit={onSubmit}
          aria-label="Subscribe to Street Collector updates"
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 28,
            maxWidth: 420,
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          <label htmlFor="landing-newsletter-email" style={{ flex: '1 1 220px', minWidth: 0 }}>
            <span className="sr-only">Email address</span>
            <input
              id="landing-newsletter-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={state.status === 'pending' || state.status === 'success'}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--white, #fff)',
                fontFamily: 'var(--font-landing-mono), monospace',
                fontSize: 14,
                letterSpacing: '0.04em',
                borderRadius: 0,
              }}
            />
          </label>
          <button
            type="submit"
            className={styles.btnOutline}
            disabled={state.status === 'pending' || state.status === 'success'}
            style={{ marginBottom: 0 }}
          >
            {state.status === 'pending'
              ? 'Subscribing…'
              : state.status === 'success'
                ? 'Subscribed'
                : 'Notify me'}
          </button>
          <div
            role="status"
            aria-live="polite"
            style={{
              flexBasis: '100%',
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: 4,
              color:
                state.status === 'error'
                  ? '#ffb49c'
                  : state.status === 'success'
                    ? 'var(--peach, #ffba94)'
                    : 'transparent',
              minHeight: 16,
            }}
          >
            {state.status === 'error'
              ? state.message
              : state.status === 'success'
                ? 'Thanks — keep an eye on your inbox.'
                : ''}
          </div>
        </form>
      </div>
    </section>
  )
}

