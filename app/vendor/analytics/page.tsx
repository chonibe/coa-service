"use client"

import { SalesChart } from "./dashboard/components/sales-chart"
import { PeriodSelector } from "./dashboard/components/period-selector"
import { useState } from "react"
import type { Period } from "./dashboard/components/period-selector"

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d")

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <PeriodSelector value={period} onValueChange={setPeriod} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold">Sales Overview</h3>
              <SalesChart period={period} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 