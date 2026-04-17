'use client'

import { useEffect, useState } from 'react'
import { ContentCard, ContentCardHeader } from '@/components/app-shell'
import { ChevronRight, User, Mail, CreditCard, FileText, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Vendor Profile Settings — Phase 3.1
//
// Embed or link to profile edit form (4 tabs: Contact, Payment, Tax, Notifications)
// ============================================================================

interface VendorSettings {
  vendorName: string
  email: string
  paypalEmail?: string
  phone?: string
  taxId?: string
  notificationPrefs?: {
    salesAlerts: boolean
    payoutAlerts: boolean
    collectorMessages: boolean
  }
}

const settingsSections = [
  {
    id: 'contact',
    title: 'Contact Information',
    items: [
      { label: 'Edit Profile', description: 'Name, bio, profile image', icon: User, href: '/vendor/profile/edit#contact' },
      { label: 'Email & Contact', description: 'Update email address', icon: Mail, href: '/vendor/profile/edit#contact' },
    ],
  },
  {
    id: 'payment',
    title: 'Payment',
    items: [
      { label: 'PayPal Settings', description: 'Payout email and preferences', icon: CreditCard, href: '/vendor/profile/edit#payment' },
    ],
  },
  {
    id: 'tax',
    title: 'Tax & Legal',
    items: [
      { label: 'Tax Information', description: 'Tax ID and compliance docs', icon: FileText, href: '/vendor/profile/edit#tax' },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      { label: 'Sign Out', description: 'Sign out of your account', icon: LogOut, href: '/vendor/signout', destructive: true },
    ],
  },
]

export default function VendorSettingsPage() {
  const [settings, setSettings] = useState<VendorSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/vendor/profile', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          const v = json.vendor || {}
          setSettings({
            vendorName: v.vendor_name || v.name || 'Artist',
            email: v.email || '',
            paypalEmail: v.paypal_email || v.paypalEmail || '',
            phone: v.phone || '',
            taxId: v.tax_id || '',
          })
        }
      } catch (err) {
        console.error('[Settings] Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  return (
    <div className="px-4 py-4 space-y-5">
      <h1 className="text-lg font-heading font-semibold text-gray-900">Settings</h1>

      {/* Current info summary */}
      {settings && (
        <ContentCard padding="md">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-body">Name</span>
              <span className="text-gray-900 font-body font-medium">{settings.vendorName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-body">Email</span>
              <span className="text-gray-900 font-body font-medium">{settings.email || '—'}</span>
            </div>
            {settings.paypalEmail && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-body">PayPal</span>
                <span className="text-gray-900 font-body font-medium">{settings.paypalEmail}</span>
              </div>
            )}
          </div>
        </ContentCard>
      )}

      {/* Settings sections */}
      {settingsSections.map((section) => (
        <div key={section.title} id={section.id} className="space-y-2 scroll-mt-20">
          <h2 className="text-xs font-bold text-gray-500 font-body uppercase tracking-wider px-1">
            {section.title}
          </h2>
          <ContentCard padding="none">
            {section.items.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5',
                  'hover:bg-gray-50 active:bg-gray-100',
                  'transition-colors duration-200',
                  index < section.items.length - 1 && 'border-b border-gray-50',
                  (item as any).destructive && 'text-red-500'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-xl shrink-0',
                  (item as any).destructive ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'
                )}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'text-sm font-semibold font-body',
                    (item as any).destructive ? 'text-red-500' : 'text-gray-900'
                  )}>{item.label}</p>
                  <p className="text-xs text-gray-500 font-body">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </a>
            ))}
          </ContentCard>
        </div>
      ))}
    </div>
  )
}
