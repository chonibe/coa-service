"use client"

import { useState, useEffect } from "react"

import { Progress } from "@/components/ui"

import { Skeleton } from "@/components/ui"


import { 
  Wallet, 
  TrendingUp, 
  Gift, 
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
interface BankingData {
  account: {
    id: string
    collectorIdentifier: string
    accountType: string
    accountStatus: string
  }
  balance: {
    balance: number
    creditsEarned: number
    creditsSpent: number
    creditsBalance?: number
    usdBalance?: number
    totalCreditsEarned?: number
    totalUsdEarned?: number
  }
  perks: {
    lamp: {
      unlocked: boolean
      progress: number
      creditsEarned: number
      threshold: number
    }
    proofPrint: {
      unlocked: boolean
      progress: number
      creditsEarned: number
      threshold: number
    }
  }
}

interface BankingDashboardProps {
  collectorIdentifier: string
}

export function BankingDashboard({ collectorIdentifier }: BankingDashboardProps) {
  const [data, setData] = useState<BankingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchBankingData()
  }, [collectorIdentifier])

  const fetchBankingData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        `/api/banking/balance?collector_identifier=${encodeURIComponent(collectorIdentifier)}`,
        { credentials: "include" }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch account data")
      }

      const result = await response.json()
      if (result.success) {
        setData(result)
      } else {
        throw new Error(result.error || "Failed to load account data")
      }
    } catch (err: any) {
      console.error("Error fetching account data:", err)
      setError(err.message || "Failed to load account data")
      toast({
        title: "Error",
        description: err.message || "Failed to load account data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCredits = (credits: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(credits)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const creditsToUSD = (credits: number) => {
    return credits * 0.01 // 1 credit = $0.01
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Error
          </CardTitle>
              <CardDescription>{error || "Failed to load account data"}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Calculate unified balance: credits + USD (converted to credits)
  // 1 credit = $0.01, so $1 = 100 credits
  const usdBalance = data.balance.usdBalance || 0
  const creditsBalance = data.balance.creditsBalance ?? data.balance.balance
  const totalBalanceCredits = creditsBalance + (usdBalance * 100) // Convert USD to credits
  const totalBalanceUSD = totalBalanceCredits * 0.01 // Convert back to USD for display
  
  const totalEarnedCredits = (data.balance.totalCreditsEarned ?? data.balance.creditsEarned) + ((data.balance.totalUsdEarned || 0) * 100)
  const totalEarnedUSD = totalEarnedCredits * 0.01

  return (
    <div className="space-y-6">
      {/* Unified Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Account Balance
          </CardTitle>
          <CardDescription>Your balance can be used as credits or withdrawn as USD</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
              {formatCurrency(totalBalanceUSD)}
            </span>
            <span className="text-lg text-muted-foreground">
              ({formatCredits(totalBalanceCredits)} credits)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-lg font-semibold">
                {formatCurrency(totalEarnedUSD)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCredits(totalEarnedCredits)} credits
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-lg font-semibold">
                {formatCurrency(creditsToUSD(data.balance.creditsSpent))}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCredits(data.balance.creditsSpent)} credits
              </p>
            </div>
          </div>
          {data.account.accountType === 'vendor' && (
            <div className="pt-4 border-t">
              <Button 
                className="w-full"
                onClick={() => {
                  window.location.href = '/vendor/dashboard/payouts'
                }}
              >
                Request Payout
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Perk Unlocks - Temporarily hidden */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Perk Unlocks
          </CardTitle>
          <CardDescription>Earn credits to unlock free perks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lamp Unlock */}
          {/* <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Free Lamp</span>
                {data.perks.lamp.unlocked ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Unlocked
                  </Badge>
                ) : (
                  <Badge variant="secondary">Locked</Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatCredits(data.perks.lamp.creditsEarned)} / {formatCredits(data.perks.lamp.threshold)}
              </span>
            </div>
            <Progress value={data.perks.lamp.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Spend {formatCurrency(255)} to unlock a free lamp ($85 value)
            </p>
          </div> */}

          {/* Proof Print Unlock */}
          {/* <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Free Proof Print</span>
                {data.perks.proofPrint.unlocked ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Unlocked
                  </Badge>
                ) : (
                  <Badge variant="secondary">Locked</Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatCredits(data.perks.proofPrint.creditsEarned)} / {formatCredits(data.perks.proofPrint.threshold)}
              </span>
            </div>
            <Progress value={data.perks.proofPrint.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Spend {formatCurrency(24)} to unlock a free proof print ($8 value)
            </p>
          </div>
        </CardContent>
      </Card> */}

    </div>
  )
}


