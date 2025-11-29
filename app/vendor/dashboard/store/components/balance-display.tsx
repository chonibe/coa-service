"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function BalanceDisplay() {
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/vendor/store/balance", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch balance")
      }

      const data = await response.json()
      if (data.success) {
        setBalance(data.balance)
      }
    } catch (error: any) {
      console.error("Error fetching balance:", error)
      toast({
        title: "Error",
        description: "Failed to load balance",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Available Balance</CardTitle>
            <CardDescription>Use your payout balance for store purchases</CardDescription>
          </div>
          <Wallet className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formatCurrency(balance || 0)}</div>
        <p className="text-sm text-muted-foreground mt-2">
          This balance can be used to purchase Lamps and proof prints
        </p>
      </CardContent>
    </Card>
  )
}

