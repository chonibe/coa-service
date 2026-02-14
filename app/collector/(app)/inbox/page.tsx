'use client'

import { SubTabBar, type SubTab } from '@/components/app-shell'

// ============================================================================
// Collector Inbox Tab
//
// All activity in one place.
// Sub-tabs: Activity / Notifications
// Like Instagram's Activity tab.
// ============================================================================

const inboxTabs: SubTab[] = [
  { id: 'activity', label: 'Activity', href: '/collector/inbox' },
  { id: 'notifications', label: 'Notifications', href: '/collector/inbox/notifications' },
]

export default function CollectorInboxPage() {
  return (
    <div>
      <SubTabBar tabs={inboxTabs} />
      <div className="px-4 py-4">
        <p className="text-center text-sm text-gray-400 font-body py-12">
          Authentication queue, order updates, and certificate-ready notifications will appear here
        </p>
      </div>
    </div>
  )
}
