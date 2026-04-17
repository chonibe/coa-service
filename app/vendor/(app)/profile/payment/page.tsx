'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ContentCard } from '@/components/app-shell'
import { SettingsPageHeader } from '@/components/vendor/SettingsPageHeader'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle2, AlertCircle, DollarSign, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * /vendor/profile/payment — Dedicated PayPal payout email page.
 *
 * Payouts flow through PayPal. We don't offer Stripe yet (explicit
 * product decision), so this page focuses on one field: the PayPal
 * email. A shortcut to the payout history keeps the vendor oriented.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function VendorPaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paypalEmail, setPaypalEmail] = useState('')
  const [initialEmail, setInitialEmail] = useState('')
  const [validation, setValidation] = useState<'idle' | 'valid' | 'invalid'>('idle')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/vendor/profile', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          const v = json.vendor || {}
          const existing = v.paypal_email || ''
          setPaypalEmail(existing)
          setInitialEmail(existing)
          if (existing) setValidation(EMAIL_RE.test(existing) ? 'valid' : 'invalid')
        }
      } catch (err) {
        console.error('[profile/payment] load', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function onEmailChange(value: string) {
    setPaypalEmail(value)
    if (value.length === 0) {
      setValidation('idle')
    } else {
      setValidation(EMAIL_RE.test(value) ? 'valid' : 'invalid')
    }
  }

  async function handleSave() {
    if (!EMAIL_RE.test(paypalEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Enter a valid PayPal email before saving.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/vendor/update-paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paypalEmail }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.message || json.error || `Save failed (${res.status})`)
      }
      setInitialEmail(paypalEmail)
      toast({
        title: 'PayPal email saved',
        description: 'Future payouts will go to this account.',
      })
    } catch (err: any) {
      toast({
        title: 'Could not save',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const dirty = paypalEmail !== initialEmail

  return (
    <div>
      <SettingsPageHeader
        title="Payment"
        subtitle="Where we send your PayPal payouts."
      />

      <div className="px-4 pb-28 space-y-4">
        {/* PayPal field */}
        <ContentCard padding="md">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold font-body text-gray-900">PayPal payout email</p>
              <p className="text-[11px] text-gray-500 font-body">
                This is where The Street Collector sends your earnings.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="h-10 bg-gray-100 rounded-impact-block-xs animate-pulse" />
          ) : (
            <>
              <div className="relative">
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="you@example.com"
                  className={cn(
                    'w-full px-3 py-2 pr-9 bg-gray-50 border rounded-impact-block-xs text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2',
                    validation === 'invalid'
                      ? 'border-red-300 focus:ring-red-200'
                      : validation === 'valid'
                        ? 'border-green-300 focus:ring-green-200'
                        : 'border-gray-200 focus:ring-impact-primary/20 focus:border-impact-primary'
                  )}
                />
                {validation === 'valid' && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
                {validation === 'invalid' && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                )}
              </div>
              {validation === 'invalid' && paypalEmail.length > 0 && (
                <p className="text-[11px] text-red-600 font-body mt-1">
                  Enter a valid email address.
                </p>
              )}
              <p className="text-[11px] text-gray-500 font-body mt-2">
                You can change this any time. Changes apply to all future payouts.
              </p>
            </>
          )}
        </ContentCard>

        {/* Helpful links */}
        <ContentCard padding="none">
          <Link
            href="/vendor/insights/payouts"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 font-body">
                View payout history
              </p>
              <p className="text-xs text-gray-500 font-body">
                Past payouts, receipts and status
              </p>
            </div>
          </Link>
        </ContentCard>

        <ContentCard padding="md">
          <p className="text-[11px] text-gray-500 font-body leading-relaxed">
            <strong className="text-gray-700">Need to switch providers?</strong>{' '}
            We currently only support PayPal for artist payouts. If you
            need a different arrangement, contact support.
          </p>
        </ContentCard>
      </div>

      {/* Sticky save bar — sits just above the AppShell bottom tab bar. */}
      <div className="fixed bottom-[calc(var(--app-tab-height)+var(--app-safe-bottom))] inset-x-0 border-t border-gray-100 bg-white/90 backdrop-blur px-4 py-3 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push('/vendor/profile/settings')}
            className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-body font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty || validation === 'invalid'}
            className={cn(
              'inline-flex items-center gap-1 px-5 py-2 rounded-full bg-impact-primary text-white text-sm font-body font-bold hover:opacity-90 transition-opacity',
              (saving || !dirty || validation === 'invalid') && 'opacity-50 cursor-not-allowed'
            )}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
