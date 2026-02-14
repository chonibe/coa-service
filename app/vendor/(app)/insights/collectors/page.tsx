'use client'

import { SubTabBar, type SubTab } from '@/components/app-shell'

const insightsTabs: SubTab[] = [
  { id: 'overview', label: 'Overview', href: '/vendor/insights' },
  { id: 'payouts', label: 'Payouts', href: '/vendor/insights/payouts' },
  { id: 'collectors', label: 'Collectors', href: '/vendor/insights/collectors' },
]

export default function VendorCollectorsPage() {
  return (
    <div>
      <SubTabBar tabs={insightsTabs} />
      <div className="px-4 py-4">
        <p className="text-center text-sm text-gray-400 font-body py-12">
          Collector analytics will appear here — who buys your work
        </p>
      </div>
    </div>
  )
}
