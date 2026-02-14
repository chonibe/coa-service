'use client'

import { SubTabBar, type SubTab } from '@/components/app-shell'

// ============================================================================
// Vendor Inbox Tab
//
// All communications in one place.
// Sub-tabs: Messages / Notifications
// Like Instagram DMs.
// ============================================================================

const inboxTabs: SubTab[] = [
  { id: 'messages', label: 'Messages', href: '/vendor/inbox' },
  { id: 'notifications', label: 'Notifications', href: '/vendor/inbox/notifications' },
]

export default function VendorInboxPage() {
  return (
    <div>
      <SubTabBar tabs={inboxTabs} />
      <div className="px-4 py-4">
        <p className="text-center text-sm text-gray-400 font-body py-12">
          Collector messages will appear here
        </p>
      </div>
    </div>
  )
}
