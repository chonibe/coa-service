'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Container, SectionWrapper, Button } from '@/components/impact'
import { SUPPORT_EMAIL, supportMailto } from '@/lib/constants/support'

// ============================================================================
// Vendor Welcome — first-login screen
//
// Greets artists after their first sign-in, routes returning users into
// /vendor/home, and directs new artists into /vendor/onboarding.
// ============================================================================

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; firstName: string }

export default function VendorWelcomePage() {
  const router = useRouter()
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const res = await fetch('/api/vendor/profile', { credentials: 'include' })
        if (!res.ok) {
          if (res.status === 401) {
            router.replace('/login?intent=vendor')
            return
          }
          throw new Error(`profile fetch failed: ${res.status}`)
        }
        const data = await res.json()
        const vendor = data?.vendor
        if (!vendor) {
          router.replace('/login?intent=vendor')
          return
        }

        // Returning artists skip the welcome screen entirely.
        if (vendor.onboarding_completed) {
          router.replace('/vendor/home')
          return
        }

        if (cancelled) return
        const name: string = vendor.contact_name || vendor.vendor_name || ''
        const firstName = name.split(' ')[0] || ''
        setState({ kind: 'ready', firstName })
      } catch (error) {
        console.error('[vendor/welcome] bootstrap error', error)
        if (!cancelled) setState({ kind: 'ready', firstName: '' })
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [router])

  if (state.kind === 'loading') {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-[#1a1a1a]/70">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="font-body text-sm">Preparing your portal…</p>
        </div>
      </main>
    )
  }

  const greeting = state.firstName ? `Welcome, ${state.firstName}.` : 'Welcome.'

  return (
    <main className="min-h-[60vh] bg-white">
      <SectionWrapper spacing="lg" background="default">
        <Container maxWidth="narrow" paddingX="gutter">
          <div className="max-w-2xl">
            <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50 mb-6">
              Your artist portal
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em] leading-[1.05] mb-6">
              {greeting}
            </h1>
            <p className="font-body text-lg text-[#1a1a1a]/70 leading-relaxed mb-10">
              Let&apos;s set up a few essentials so we can start paying you for your work and sending orders out.
              It takes about five minutes, and you can come back to finish it later.
            </p>

            <div className="space-y-4 mb-12">
              {[
                'Your contact details so we can reach you about sales',
                'A PayPal email so we can pay you in USD',
                'Tax details we need to stay compliant on your behalf',
              ].map((line) => (
                <div key={line} className="flex gap-4 items-start">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 rounded-full bg-[#1a1a1a] shrink-0"
                  />
                  <p className="font-body text-[#1a1a1a]/80 leading-relaxed">{line}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button asChild variant="primary" size="lg">
                <Link href="/vendor/onboarding">Set up my portal</Link>
              </Button>
              <Link
                href="/vendor/home"
                className="font-body text-sm font-medium text-[#1a1a1a]/70 underline underline-offset-4"
              >
                I&apos;ll finish this later
              </Link>
            </div>

            <p className="mt-14 font-body text-sm text-[#1a1a1a]/60">
              Questions along the way? Write to{' '}
              <a
                href={supportMailto('Artist portal setup')}
                className="underline underline-offset-4 text-[#1a1a1a]"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </div>
        </Container>
      </SectionWrapper>
    </main>
  )
}
