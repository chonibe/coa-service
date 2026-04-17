'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ContentCard } from '@/components/app-shell'
import { SettingsPageHeader } from '@/components/vendor/SettingsPageHeader'
import {
  ChevronRight,
  User,
  CreditCard,
  FileText,
  Bell,
  MapPin,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * /vendor/profile/settings — Account settings hub.
 *
 * Each row now links to a dedicated focused page (no more hash
 * anchors into the 1900-line legacy monolith). Every destination is
 * AppShell-native.
 *
 * Sub-pages:
 *   - /vendor/profile/edit           (public identity)
 *   - /vendor/profile/payment        (PayPal payout email)
 *   - /vendor/profile/tax            (tax id, country, account type)
 *   - /vendor/profile/address        (delivery / shipping)
 *   - /vendor/profile/notifications  (email alerts)
 */

interface SettingsSummary {
  vendorName: string
  contactEmail: string
  paypalEmail: string
  taxComplete: boolean
  addressComplete: boolean
  profileComplete: boolean
}

const sections: Array<{
  heading: string
  rows: Array<{
    href: string
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    destructive?: boolean
    statusKey?: keyof SettingsSummary
  }>
}> = [
  {
    heading: 'Public profile',
    rows: [
      {
        href: '/vendor/profile/edit',
        icon: User,
        title: 'Public identity',
        description: 'Bio, profile photo, links, signature',
        statusKey: 'profileComplete',
      },
    ],
  },
  {
    heading: 'Money',
    rows: [
      {
        href: '/vendor/profile/payment',
        icon: CreditCard,
        title: 'Payment',
        description: 'PayPal payout email',
        statusKey: 'paypalEmail',
      },
      {
        href: '/vendor/profile/tax',
        icon: FileText,
        title: 'Tax information',
        description: 'Tax ID, country, 1099 readiness',
        statusKey: 'taxComplete',
      },
    ],
  },
  {
    heading: 'Shipping & alerts',
    rows: [
      {
        href: '/vendor/profile/address',
        icon: MapPin,
        title: 'Delivery address',
        description: 'Where warehouse shipments go',
        statusKey: 'addressComplete',
      },
      {
        href: '/vendor/profile/notifications',
        icon: Bell,
        title: 'Notifications',
        description: 'Sale, payout, message alerts',
      },
    ],
  },
  {
    heading: 'Account',
    rows: [
      {
        href: '/vendor/signout',
        icon: LogOut,
        title: 'Sign out',
        description: 'End your session on this device',
        destructive: true,
      },
    ],
  },
]

export default function VendorSettingsPage() {
  const [summary, setSummary] = useState<SettingsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/vendor/profile', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          const v = json.vendor || {}
          setSummary({
            vendorName: v.vendor_name || v.name || 'Artist',
            contactEmail: v.contact_email || v.email || '',
            paypalEmail: v.paypal_email || '',
            taxComplete: !!(v.tax_id && v.tax_country),
            addressComplete: !!(v.delivery_address1 && v.delivery_city),
            profileComplete: !!(v.bio && (v.profile_image || v.profile_image_url)),
          })
        }
      } catch (err) {
        console.error('[settings] load', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function statusIcon(key?: keyof SettingsSummary) {
    if (!key || !summary) return null
    const raw = summary[key]
    const complete = typeof raw === 'boolean' ? raw : !!raw
    return complete ? (
      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
    ) : (
      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
    )
  }

  return (
    <div>
      <SettingsPageHeader
        title="Settings"
        subtitle="Payment, tax, shipping and alerts — one page each."
        backHref="/vendor/profile"
        backLabel="Profile"
      />

      <div className="px-4 pb-12 space-y-5">
        {/* Current summary */}
        {loading ? (
          <div className="h-20 bg-gray-100 rounded-impact-block-xs animate-pulse" />
        ) : summary ? (
          <ContentCard padding="md">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-body">Name</span>
                <span className="text-gray-900 font-body font-medium truncate max-w-[60%]">
                  {summary.vendorName}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-body">Email</span>
                <span className="text-gray-900 font-body font-medium truncate max-w-[60%]">
                  {summary.contactEmail || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-body">PayPal</span>
                <span
                  className={cn(
                    'font-body font-medium truncate max-w-[60%]',
                    summary.paypalEmail ? 'text-gray-900' : 'text-amber-600'
                  )}
                >
                  {summary.paypalEmail || 'Not set'}
                </span>
              </div>
            </div>
          </ContentCard>
        ) : null}

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.heading} className="space-y-2">
            <h2 className="text-xs font-bold text-gray-500 font-body uppercase tracking-wider px-1">
              {section.heading}
            </h2>
            <ContentCard padding="none">
              {section.rows.map((row, index) => {
                const Icon = row.icon
                return (
                  <Link
                    key={row.title}
                    href={row.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5',
                      'hover:bg-gray-50 active:bg-gray-100 transition-colors',
                      index < section.rows.length - 1 && 'border-b border-gray-50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-9 h-9 rounded-xl shrink-0',
                        row.destructive
                          ? 'bg-red-50 text-red-500'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm font-semibold font-body',
                          row.destructive ? 'text-red-500' : 'text-gray-900'
                        )}
                      >
                        {row.title}
                      </p>
                      <p className="text-xs text-gray-500 font-body">{row.description}</p>
                    </div>
                    {statusIcon(row.statusKey)}
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </Link>
                )
              })}
            </ContentCard>
          </div>
        ))}
      </div>
    </div>
  )
}
