'use client'

import { useEffect, useState } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import { ActivityFeed, type ActivityEvent } from '@/components/app-shell'

// ============================================================================
// Collector Inbox Tab
//
// Live activity feed — like Instagram's Activity tab.
// Shows purchases, NFC scans, certificates, series progress,
// level-ups, perk unlocks.
// Sub-tabs: Activity / Notifications
// ============================================================================

const inboxTabs: SubTab[] = [
  { id: 'activity', label: 'Activity', href: '/collector/inbox' },
  { id: 'notifications', label: 'Notifications', href: '/collector/inbox/notifications' },
]

export default function CollectorInboxPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch('/api/collector/activity')
        const json = await res.json()
        if (json.success) {
          setEvents(json.events || [])
        }
      } catch (err) {
        console.error('[Activity] Failed to fetch:', err)
        // Fallback: show empty state
      } finally {
        setLoading(false)
      }
    }
    fetchActivity()
  }, [])

  return (
    <div>
      <SubTabBar tabs={inboxTabs} />
      <ActivityFeed events={events} loading={loading} />
    </div>
  )
}
