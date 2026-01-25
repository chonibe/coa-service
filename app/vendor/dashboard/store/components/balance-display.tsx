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
    const requestId = `balance_display_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] [BalanceDisplay] Starting to fetch balance`, {
      url: "/api/vendor/store/balance",
    });

    try {
      setIsLoading(true)
      const startTime = Date.now();
      const response = await fetch("/api/vendor/store/balance", {
        credentials: "include",
      })

      const duration = Date.now() - startTime;
      console.log(`[${requestId}] [BalanceDisplay] Response received:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${duration}ms`,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { raw: errorText };
        }

        console.error(`[${requestId}] [BalanceDisplay] Response not OK:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData.error || "Failed to fetch balance")
      }

      const data = await response.json();
      console.log(`[${requestId}] [BalanceDisplay] Response data:`, {
        success: data.success,
        balance: data.balance,
        currency: data.currency,
        requestId: data.requestId,
        error: data.error,
      });

      if (data.success) {
        setBalance(data.balance)
      } else {
        throw new Error(data.error || "Failed to load balance");
      }
    } catch (error: any) {
      console.error(`[${requestId}] [BalanceDisplay] Fetch error:`, {
        error: error.message,
        stack: error.stack,
        name: error.name,
      });
      toast({
        title: "Error",
        description: error.message || "Failed to load balance",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      console.log(`[${requestId}] [BalanceDisplay] Loading complete`);
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
        <div className="text-2xl font-bold">{formatCurrency(balance || 0)}</div>
        <p className="text-sm text-muted-foreground mt-2">
          This balance can be used to purchase Lamps and proof prints
        </p>
      </CardContent>
    </Card>
  )
}

