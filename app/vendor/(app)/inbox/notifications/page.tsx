'use client'

import { SubTabBar, type SubTab } from '@/components/app-shell'

const inboxTabs: SubTab[] = [
  { id: 'messages', label: 'Messages', href: '/vendor/inbox' },
  { id: 'notifications', label: 'Notifications', href: '/vendor/inbox/notifications' },
]

export default function VendorNotificationsPage() {
  return (
    <div>
      <SubTabBar tabs={inboxTabs} />
      <div className="px-4 py-4">
        <p className="text-center text-sm text-gray-400 font-body py-12">
          Sales alerts, authentication events, and system updates will appear here
        </p>
      </div>
    </div>
  )
}
