'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  dismissWelcomeIncentive,
  getWelcomeIncentiveConfig,
  isWelcomeIncentiveClaimed,
  markWelcomeIncentiveClaimed,
  shouldShowWelcomeIncentiveStrip,
  type WelcomeIncentiveConfig,
} from '@/lib/shop/welcome-incentive'

type NewsletterState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export type WelcomeIncentiveStripProps = {
  className?: string
  /** Dark landing pages (home-v2) vs light shop chrome. */
  tone?: 'dark' | 'light'
}

/**
 * Soft first-visit welcome offer: email → reveal configurable Stripe promo code.
 * In-flow strip (not sticky) so it does not fight floating nav / sticky CTAs.
 * Dismissable; uses `/api/shop/newsletter`.
 */
export function WelcomeIncentiveStrip({
  className,
  tone = 'dark',
}: WelcomeIncentiveStripProps) {
  const config = React.useMemo(() => getWelcomeIncentiveConfig(), [])
  const [visible, setVisible] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [state, setState] = React.useState<NewsletterState>({ status: 'idle' })
  const [revealedCode, setRevealedCode] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isWelcomeIncentiveClaimed(config)) {
      setRevealedCode(config.code)
      setVisible(false)
      return
    }
    setVisible(shouldShowWelcomeIncentiveStrip(config))
  }, [config])

  const onDismiss = React.useCallback(() => {
    dismissWelcomeIncentive(config)
    setVisible(false)
  }, [config])

  const onSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmed = email.trim()
      if (!trimmed) {
        setState({ status: 'error', message: 'Enter your email.' })
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
          throw new Error(data?.error || 'Could not subscribe. Try again.')
        }
        markWelcomeIncentiveClaimed(config)
        setRevealedCode(config.code)
        setState({ status: 'success' })
        setEmail('')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not subscribe.'
        setState({ status: 'error', message })
      }
    },
    [config, email]
  )

  if (!visible && state.status !== 'success') return null

  const isDark = tone === 'dark'

  return (
    <aside
      className={cn(
        'w-full border-b',
        isDark
          ? 'border-[color:var(--experience-border)] bg-[color:var(--experience-surface)] text-[color:var(--experience-text)]'
          : 'border-border bg-background text-foreground',
        className
      )}
      role="region"
      aria-label="Welcome offer"
      data-testid="welcome-incentive-strip"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-2.5 px-6 py-4 text-center sm:flex-row sm:justify-center sm:gap-4 sm:px-14 sm:py-3.5 sm:text-left">
        <div className="min-w-0">
          {state.status === 'success' && revealedCode ? (
            <p
              className={cn(
                'text-[11px] font-normal uppercase leading-relaxed tracking-[0.08em]',
                isDark ? 'text-[color:var(--experience-text-muted)]' : 'text-muted-foreground'
              )}
            >
              <span
                className={
                  isDark ? 'text-[color:var(--experience-highlight)]' : 'text-experience-highlight'
                }
              >
                {config.headline}
              </span>
              <span className="mx-1.5 opacity-40" aria-hidden>
                ·
              </span>
              Code{' '}
              <strong
                className={cn(
                  'tracking-[0.12em]',
                  isDark ? 'text-[color:var(--experience-text)]' : 'text-foreground'
                )}
              >
                {revealedCode}
              </strong>
              <span className="mx-1.5 opacity-40" aria-hidden>
                ·
              </span>
              {config.successHint}
            </p>
          ) : (
            <p
              className={cn(
                'text-[11px] font-normal uppercase leading-relaxed tracking-[0.08em]',
                isDark ? 'text-[color:var(--experience-text-muted)]' : 'text-muted-foreground'
              )}
            >
              <span
                className={
                  isDark ? 'text-[color:var(--experience-highlight)]' : 'text-experience-highlight'
                }
              >
                {config.headline}
              </span>
              <span className="mx-1.5 opacity-40" aria-hidden>
                ·
              </span>
              <span>{config.shortPitch}</span>
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
          {state.status !== 'success' ? (
            !expanded ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className={cn(
                  'border px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors',
                  isDark
                    ? 'border-white/25 text-[color:var(--experience-text-secondary)] hover:border-white/50 hover:text-[color:var(--experience-text)]'
                    : 'border-border text-foreground hover:bg-muted'
                )}
              >
                {config.ctaLabel}
              </button>
            ) : (
              <form
                onSubmit={onSubmit}
                className="flex w-full max-w-md flex-wrap items-center justify-center gap-2 sm:w-auto"
                aria-label="Claim welcome offer"
              >
                <label className="sr-only" htmlFor="welcome-incentive-email">
                  Email
                </label>
                <input
                  id="welcome-incentive-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  disabled={state.status === 'pending'}
                  className={cn(
                    'h-8 min-w-[11rem] flex-1 border px-3 text-xs tracking-wide sm:flex-none',
                    isDark
                      ? 'border-[color:var(--experience-border)] bg-transparent text-[color:var(--experience-text)] placeholder:text-[color:var(--experience-text-muted)]'
                      : 'border-border bg-background text-foreground'
                  )}
                />
                <button
                  type="submit"
                  disabled={state.status === 'pending'}
                    className={cn(
                      'h-8 border px-3 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors disabled:opacity-60',
                      isDark
                        ? 'border-white/25 text-[color:var(--experience-text-secondary)] hover:border-white/50 hover:text-[color:var(--experience-text)]'
                        : 'border-border text-foreground hover:bg-muted'
                    )}
                >
                  {state.status === 'pending' ? 'Sending…' : 'Reveal code'}
                </button>
              </form>
            )
          ) : null}

          <button
            type="button"
            onClick={onDismiss}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-80',
              isDark
                ? 'text-[color:var(--experience-text-muted)] hover:text-[color:var(--experience-text)]'
                : 'text-muted-foreground'
            )}
            aria-label="Dismiss welcome offer"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {state.status === 'error' ? (
        <p
          className="mx-auto max-w-[1200px] px-6 pb-3 text-center text-xs text-red-400 sm:px-14 sm:text-left"
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </aside>
  )
}

/** Server-safe: whether config allows the strip (client still gates on localStorage). */
export function welcomeIncentiveEnabled(config?: WelcomeIncentiveConfig): boolean {
  return (config ?? getWelcomeIncentiveConfig()).enabled
}
