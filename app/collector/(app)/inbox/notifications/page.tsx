'use client'

import { SubTabBar, type SubTab } from '@/components/app-shell'

// ============================================================================
// Collector Notifications Sub-Tab
//
// System notifications, price drops, new releases from followed artists.
// ============================================================================

const inboxTabs: SubTab[] = [
  { id: 'activity', label: 'Activity', href: '/collector/inbox' },
  { id: 'notifications', label: 'Notifications', href: '/collector/inbox/notifications' },
]

export default function CollectorNotificationsPage() {
  return (
    <div>
      <SubTabBar tabs={inboxTabs} />
      <div className="px-4 py-4">
        <p className="text-center text-sm text-gray-400 font-body py-12">
          System notifications will appear here
        </p>
      </div>
    </div>
  )
}
