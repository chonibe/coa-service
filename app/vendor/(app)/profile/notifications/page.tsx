'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContentCard } from '@/components/app-shell'
import { SettingsPageHeader } from '@/components/vendor/SettingsPageHeader'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, ShoppingBag, Wallet, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * /vendor/profile/notifications — Dedicated notification preferences page.
 *
 * Three simple toggles, saved in-place. We avoid the tiny "save at
 * the bottom" pattern here because there is no destructive state; each
 * toggle writes through on change.
 */

interface NotificationForm {
  notifyOnSale: boolean
  notifyOnPayout: boolean
  notifyOnMessage: boolean
}

const TOGGLES: Array<{
  key: keyof NotificationForm
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    key: 'notifyOnSale',
    label: 'Sales & authentications',
    description: 'When a collector purchases or authenticates one of your pieces.',
    icon: ShoppingBag,
  },
  {
    key: 'notifyOnPayout',
    label: 'Payouts',
    description: 'When a payout is scheduled, sent or fails.',
    icon: Wallet,
  },
  {
    key: 'notifyOnMessage',
    label: 'Collector messages',
    description: 'When a collector sends you a direct message or question.',
    icon: MessageCircle,
  },
]

export default function VendorNotificationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<keyof NotificationForm | null>(null)
  const [form, setForm] = useState<NotificationForm>({
    notifyOnSale: true,
    notifyOnPayout: true,
    notifyOnMessage: true,
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/vendor/profile', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          const v = json.vendor || {}
          setForm({
            notifyOnSale: v.notify_on_sale ?? true,
            notifyOnPayout: v.notify_on_payout ?? true,
            notifyOnMessage: v.notify_on_message ?? true,
          })
        }
      } catch (err) {
        console.error('[profile/notifications] load', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function toggle(key: keyof NotificationForm) {
    const next = { ...form, [key]: !form[key] }
    setForm(next)
    setSavingKey(key)
    try {
      const res = await fetch('/api/vendor/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          notify_on_sale: next.notifyOnSale,
          notify_on_payout: next.notifyOnPayout,
          notify_on_message: next.notifyOnMessage,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.message || j.error || `Save failed (${res.status})`)
      }
    } catch (err: any) {
      setForm(form)
      toast({
        title: 'Could not update',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div>
      <SettingsPageHeader
        title="Notifications"
        subtitle="Choose which events we email you about."
      />

      <div className="px-4 pb-12 space-y-3">
        <ContentCard padding="none">
          {TOGGLES.map((item, index) => {
            const Icon = item.icon
            const value = form[item.key]
            const isSaving = savingKey === item.key
            return (
              <div
                key={item.key}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5',
                  index < TOGGLES.length - 1 && 'border-b border-gray-50'
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 font-body">{item.label}</p>
                  <p className="text-xs text-gray-500 font-body">{item.description}</p>
                </div>
                {loading ? (
                  <div className="w-11 h-6 bg-gray-100 rounded-full animate-pulse" />
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={value}
                    aria-label={`${value ? 'Disable' : 'Enable'} ${item.label}`}
                    disabled={isSaving}
                    onClick={() => toggle(item.key)}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors shrink-0',
                      value ? 'bg-impact-primary' : 'bg-gray-300',
                      isSaving && 'opacity-60'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                        value ? 'translate-x-[22px]' : 'translate-x-0.5'
                      )}
                    />
                    {isSaving && (
                      <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-white/70" />
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </ContentCard>

        <p className="text-[11px] text-gray-500 font-body px-1">
          Notifications go to the email on file. Update it from{' '}
          <button
            type="button"
            onClick={() => router.push('/vendor/profile/edit')}
            className="underline text-gray-700"
          >
            public profile
          </button>
          .
        </p>
      </div>
    </div>
  )
}
