'use client'

import { ContentCard } from '@/components/app-shell'
import { ChevronRight, User, Bell as BellIcon, Shield, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Collector Settings Page
// ============================================================================

const settingsItems = [
  { label: 'Edit Profile', icon: User, href: '#' },
  { label: 'Notification Preferences', icon: BellIcon, href: '#' },
  { label: 'Privacy & Security', icon: Shield, href: '#' },
  { label: 'Sign Out', icon: LogOut, href: '/collector/signout', destructive: true },
]

export default function CollectorSettingsPage() {
  return (
    <div className="px-4 py-4">
      <h1 className="text-lg font-heading font-semibold text-gray-900 mb-4">Settings</h1>
      <ContentCard padding="none">
        {settingsItems.map((item, index) => (
          <a
            key={item.label}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3.5',
              'hover:bg-gray-50 active:bg-gray-100',
              'transition-colors duration-200',
              index < settingsItems.length - 1 && 'border-b border-gray-50',
              (item as any).destructive && 'text-red-500'
            )}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm font-body flex-1">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </a>
        ))}
      </ContentCard>
    </div>
  )
}
