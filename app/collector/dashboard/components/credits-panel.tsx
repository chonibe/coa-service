"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BankingDashboard } from "@/app/dashboard/[customerId]/components/banking-dashboard"
import { SubscriptionManager } from "@/app/dashboard/[customerId]/components/subscription-manager"

interface CreditsPanelProps {
  collectorIdentifier: string | null
}

export function CreditsPanel({ collectorIdentifier }: CreditsPanelProps) {
  if (!collectorIdentifier) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credits & subscriptions</CardTitle>
          <CardDescription>Sign in with your collector account to manage credits.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <BankingDashboard collectorIdentifier={collectorIdentifier} />
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>Automate credits or perks for your collection.</CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionManager collectorIdentifier={collectorIdentifier} />
        </CardContent>
      </Card>
    </div>
  )
}

