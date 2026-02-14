'use client'

import { SubTabBar, type SubTab } from '@/components/app-shell'
import { ContentCard, ContentCardHeader } from '@/components/app-shell'

// ============================================================================
// Vendor Insights Tab
//
// Your numbers — analytics, payouts, collectors.
// Sub-tabs: Overview / Payouts / Collectors
// Like Instagram Insights for creators.
// ============================================================================

const insightsTabs: SubTab[] = [
  { id: 'overview', label: 'Overview', href: '/vendor/insights' },
  { id: 'payouts', label: 'Payouts', href: '/vendor/insights/payouts' },
  { id: 'collectors', label: 'Collectors', href: '/vendor/insights/collectors' },
]

export default function VendorInsightsPage() {
  return (
    <div>
      <SubTabBar tabs={insightsTabs} />

      <div className="px-4 py-4 space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Sales', value: '—' },
            { label: 'Revenue', value: '—' },
            { label: 'Pending Payout', value: '—' },
            { label: 'Collectors', value: '—' },
          ].map((metric) => (
            <ContentCard key={metric.label} padding="md">
              <p className="text-[11px] text-gray-500 font-body uppercase tracking-wide">
                {metric.label}
              </p>
              <p className="text-xl font-semibold text-gray-900 font-body mt-1">
                {metric.value}
              </p>
            </ContentCard>
          ))}
        </div>

        {/* Sales chart placeholder */}
        <ContentCard
          padding="md"
          header={<ContentCardHeader title="Sales Over Time" />}
        >
          <div className="h-48 flex items-center justify-center text-gray-400">
            <p className="text-sm font-body">Sales chart will appear here</p>
          </div>
        </ContentCard>
      </div>
    </div>
  )
}
