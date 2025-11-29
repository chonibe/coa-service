"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet } from "lucide-react"

interface CreditPaymentOptionProps {
  collectorIdentifier: string
  price: number
  onCreditAmountChange?: (amount: number) => void
  selectedCreditAmount?: number
}

export function CreditPaymentOption({
  collectorIdentifier,
  price,
  onCreditAmountChange,
  selectedCreditAmount = 0,
}: CreditPaymentOptionProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBalance()
  }, [collectorIdentifier])

  const fetchBalance = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/banking/balance?collector_identifier=${encodeURIComponent(collectorIdentifier)}`,
        { credentials: "include" }
      )

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setBalance(result.balance.balance)
        }
      }
    } catch (error) {
      console.error("Error fetching credit balance:", error)
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

  const creditsToUSD = (credits: number) => credits * 0.01
  const usdToCredits = (usd: number) => Math.round(usd * 100)

  const priceInCredits = usdToCredits(price)
  const availableCredits = balance || 0
  const canPayFull = availableCredits >= priceInCredits
  const maxCreditsToUse = Math.min(availableCredits, priceInCredits)

  const handleCreditAmountChange = (value: string) => {
    const amount = parseInt(value) || 0
    if (onCreditAmountChange) {
      onCreditAmountChange(amount)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted w-32 rounded" />
            <div className="h-8 bg-muted w-24 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (availableCredits === 0) {
    return null // Don't show if no credits available
  }

  const remainingAfterCredits = price - creditsToUSD(selectedCreditAmount)
  const remainingInCredits = usdToCredits(remainingAfterCredits)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Pay with Credits
            </Label>
            <Badge variant="secondary">
              {formatCredits(availableCredits)} credits available
            </Badge>
          </div>

          <RadioGroup
            value={selectedCreditAmount.toString()}
            onValueChange={handleCreditAmountChange}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0" id="no-credits" />
              <Label htmlFor="no-credits" className="flex-1 cursor-pointer">
                Don't use credits
              </Label>
            </div>

            {canPayFull && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={priceInCredits.toString()} id="full-credits" />
                <Label htmlFor="full-credits" className="flex-1 cursor-pointer">
                  Pay full amount with credits ({formatCredits(priceInCredits)} credits = {formatCurrency(price)})
                </Label>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={maxCreditsToUse.toString()}
                id="max-credits"
              />
              <Label htmlFor="max-credits" className="flex-1 cursor-pointer">
                Use maximum available ({formatCredits(maxCreditsToUse)} credits = {formatCurrency(creditsToUSD(maxCreditsToUse))})
              </Label>
            </div>
          </RadioGroup>

          {selectedCreditAmount > 0 && (
            <div className="p-3 bg-muted rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span>Credits used:</span>
                <span className="font-semibold">
                  {formatCredits(selectedCreditAmount)} ({formatCurrency(creditsToUSD(selectedCreditAmount))})
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Remaining to pay:</span>
                <span className="font-semibold">
                  {formatCurrency(remainingAfterCredits)}
                  {remainingInCredits > 0 && ` (${formatCredits(remainingInCredits)} credits)`}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

