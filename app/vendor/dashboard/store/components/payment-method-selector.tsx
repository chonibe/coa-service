"use client"






import { Wallet, CreditCard, AlertCircle } from "lucide-react"

import { RadioGroup, RadioGroupItem, Label, Input, Card, CardContent, Alert, AlertDescription } from "@/components/ui"
interface PaymentMethodSelectorProps {
  paymentMethod: "payout_balance" | "external"
  onPaymentMethodChange: (method: "payout_balance" | "external") => void
  balance: number | null
  price: number
  externalPaymentId: string
  onExternalPaymentIdChange: (id: string) => void
}

export function PaymentMethodSelector({
  paymentMethod,
  onPaymentMethodChange,
  balance,
  price,
  externalPaymentId,
  onExternalPaymentIdChange,
}: PaymentMethodSelectorProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)

  const canUseBalance = balance !== null && balance >= price
  const balanceShortfall = balance !== null && balance < price ? price - balance : 0

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Payment Method</Label>
      <RadioGroup value={paymentMethod} onValueChange={onPaymentMethodChange}>
        <div className="space-y-3">
          <Card className={`cursor-pointer transition-colors ${paymentMethod === "payout_balance" ? "border-primary" : ""}`}>
            <label htmlFor="balance" className="cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="payout_balance" id="balance" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <Label htmlFor="balance" className="font-medium cursor-pointer">
                        Use Payout Balance
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Available: {balance !== null ? formatCurrency(balance) : "Loading..."}
                    </p>
                    {!canUseBalance && balance !== null && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Insufficient balance. You need {formatCurrency(balanceShortfall)} more.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
            </label>
          </Card>

          <Card className={`cursor-pointer transition-colors ${paymentMethod === "external" ? "border-primary" : ""}`}>
            <label htmlFor="external" className="cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="external" id="external" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <Label htmlFor="external" className="font-medium cursor-pointer">
                        External Payment
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pay via PayPal, Stripe, or other payment method
                    </p>
                    {paymentMethod === "external" && (
                      <div className="mt-3">
                        <Input
                          placeholder="Payment Reference ID"
                          value={externalPaymentId}
                          onChange={(e) => onExternalPaymentIdChange(e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter the transaction ID or reference from your payment
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </label>
          </Card>
        </div>
      </RadioGroup>
    </div>
  )
}

