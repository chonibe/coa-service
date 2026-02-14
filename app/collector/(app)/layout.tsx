'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { AppShell } from '@/components/app-shell'
import { collectorTabs, type TabItem } from '@/components/app-shell/BottomTabBar'

// ============================================================================
// Collector App Layout
//
// Wraps all collector app routes with the unified AppShell.
// Gated by NEXT_PUBLIC_APP_SHELL_ENABLED feature flag.
// When disabled, redirects to the old /collector/dashboard.
// Fetches credit balance for the persistent header display.
// Fetches activity count for the inbox badge.
// Auth is handled by the parent /collector/layout.tsx (server component).
// ============================================================================

const APP_SHELL_ENABLED = process.env.NEXT_PUBLIC_APP_SHELL_ENABLED !== 'false'

export default function CollectorAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [ready, setReady] = useState(APP_SHELL_ENABLED)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [inboxBadge, setInboxBadge] = useState(0)

  useEffect(() => {
    if (!APP_SHELL_ENABLED) {
      router.replace('/collector/dashboard')
      return
    }

    // Fetch credit balance for the header badge
    async function fetchData() {
      try {
        const res = await fetch('/api/collector/dashboard')
        const json = await res.json()
        if (json.success) {
          setCreditBalance(
            json.banking?.credits_balance || json.banking?.creditsBalance || 0
          )
        }
      } catch (err) {
        console.error('[Layout] Failed to fetch credits:', err)
      }

      // Fetch activity count for inbox badge
      try {
        const res = await fetch('/api/collector/activity')
        const json = await res.json()
        if (json.success) {
          // Show count of recent unseen events (last 24 hours as a proxy)
          const dayAgo = Date.now() - 86400000
          const recentCount = (json.events || []).filter(
            (e: any) => new Date(e.timestamp).getTime() > dayAgo
          ).length
          setInboxBadge(recentCount)
        }
      } catch (err) {
        // Silently fail — badge just won't show
      }
    }
    fetchData()
  }, [router])

  // Dynamically set inbox badge on tabs
  const tabs: TabItem[] = useMemo(() => {
    return collectorTabs.map((tab) => {
      if (tab.id === 'inbox' && inboxBadge > 0) {
        return { ...tab, badge: inboxBadge }
      }
      return tab
    })
  }, [inboxBadge])

  if (!ready) return null

  return (
    <AppShell
      tabs={tabs}
      headerProps={{
        showCart: true,
        logoHref: '/collector/home',
        creditBalance,
      }}
    >
      {children}
    </AppShell>
  )
}
