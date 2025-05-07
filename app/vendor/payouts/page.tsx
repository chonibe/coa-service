"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, ArrowUpRight } from "lucide-react"

interface PayoutData {
  pendingAmount: number
  totalEarnings: number
  lastPayout: {
    amount: number
    date: string
  }
  nextPayout: {
    amount: number
    date: string
  }
}

export default function PayoutsPage() {
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPayoutData = async () => {
      try {
        const response = await fetch("/api/vendor/payouts/summary")
        if (response.ok) {
          const data = await response.json()
          setPayoutData(data)
        }
      } catch (error) {
        console.error("Error fetching payout data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayoutData()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!payoutData) {
    return <div>Error loading payout data</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payouts</h1>
        <Button>
          <DollarSign className="mr-2 h-4 w-4" />
          Request Payout
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payoutData.pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available for payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payoutData.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payoutData.lastPayout.amount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {new Date(payoutData.lastPayout.date).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payoutData.nextPayout.amount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {new Date(payoutData.nextPayout.date).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 