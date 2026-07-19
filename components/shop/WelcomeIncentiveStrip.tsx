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
 * Does not block browsing; dismissable; uses `/api/shop/newsletter`.
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
        'relative w-full border-b px-3 py-2.5 sm:px-4',
        isDark
          ? 'border-white/10 bg-[#12100f] text-[#f5ebe0]'
          : 'border-border bg-muted/80 text-foreground',
        className
      )}
      role="region"
      aria-label="Welcome offer"
      data-testid="welcome-incentive-strip"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 pr-8 sm:pr-0">
          {state.status === 'success' && revealedCode ? (
            <p className="text-sm leading-snug">
              <span className="font-semibold">{config.headline}.</span>{' '}
              <span className={isDark ? 'text-[#ffba94]' : 'text-experience-highlight'}>
                Code <strong className="tracking-wide">{revealedCode}</strong>
              </span>
              {' — '}
              {config.successHint}
            </p>
          ) : (
            <p className="text-sm leading-snug">
              <span className="font-semibold">{config.headline}</span>
              <span className={cn('ml-1.5', isDark ? 'text-white/65' : 'text-muted-foreground')}>
                {config.shortPitch}
              </span>
            </p>
          )}
        </div>

        {state.status !== 'success' ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {!expanded ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-opacity hover:opacity-90',
                  isDark
                    ? 'bg-[#047AFF] text-white'
                    : 'bg-experience-cta text-white'
                )}
              >
                {config.ctaLabel}
              </button>
            ) : (
              <form
                onSubmit={onSubmit}
                className="flex w-full flex-wrap items-center gap-2 sm:w-auto"
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
                    'h-8 min-w-[11rem] flex-1 rounded-md border px-2.5 text-xs sm:flex-none',
                    isDark
                      ? 'border-white/20 bg-white/5 text-white placeholder:text-white/40'
                      : 'border-border bg-background text-foreground'
                  )}
                />
                <button
                  type="submit"
                  disabled={state.status === 'pending'}
                  className={cn(
                    'h-8 rounded-md px-3 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-60',
                    isDark
                      ? 'bg-[#047AFF] text-white'
                      : 'bg-experience-cta text-white'
                  )}
                >
                  {state.status === 'pending' ? 'Sending…' : 'Reveal code'}
                </button>
              </form>
            )}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            'absolute right-2 top-2 rounded p-1 transition-opacity hover:opacity-80 sm:static sm:shrink-0',
            isDark ? 'text-white/50 hover:text-white' : 'text-muted-foreground'
          )}
          aria-label="Dismiss welcome offer"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>

      {state.status === 'error' ? (
        <p className="mx-auto mt-1 max-w-[1200px] text-xs text-red-400" role="status">
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
