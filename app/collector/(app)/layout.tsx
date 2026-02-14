'use client'

import { AppShell, collectorTabs } from '@/components/app-shell'

// ============================================================================
// Collector App Layout
//
// Wraps all collector app routes with the unified AppShell.
// Provides: SlimHeader + BottomTabBar (mobile) / LeftRail (desktop)
// Auth is handled by the parent /collector/layout.tsx (server component).
// ============================================================================

export default function CollectorAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell
      tabs={collectorTabs}
      headerProps={{
        showCart: true,
        logoHref: '/collector/home',
      }}
    >
      {children}
    </AppShell>
  )
}
