"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PaymentMethodSelector } from "./payment-method-selector"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface PurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseType: "lamp" | "proof_print"
  productSku?: string
  productName?: string
  artworkSubmissionId?: string
  artworkTitle?: string
  price: number
  onSuccess?: () => void
}

export function PurchaseDialog({
  open,
  onOpenChange,
  purchaseType,
  productSku,
  productName,
  artworkSubmissionId,
  artworkTitle,
  price,
  onSuccess,
}: PurchaseDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"payout_balance" | "external">("payout_balance")
  const [externalPaymentId, setExternalPaymentId] = useState("")
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchBalance()
    }
  }, [open])

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/vendor/store/balance", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setBalance(data.balance)
        }
      }
    } catch (error) {
      console.error("Error fetching balance:", error)
    }
  }

  const handlePurchase = async () => {
    if (paymentMethod === "external" && !externalPaymentId.trim()) {
      toast({
        title: "Error",
        description: "Please provide a payment reference ID",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "payout_balance" && balance !== null && balance < price) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${formatCurrency(price - balance)} more to complete this purchase`,
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/vendor/store/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          purchaseType,
          productSku: purchaseType === "lamp" ? productSku : undefined,
          artworkSubmissionId: purchaseType === "proof_print" ? artworkSubmissionId : undefined,
          paymentMethod,
          externalPaymentId: paymentMethod === "external" ? externalPaymentId : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process purchase")
      }

      toast({
        title: "Success",
        description: "Purchase completed successfully",
      })

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Error processing purchase:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process purchase",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)

  const canUseBalance = balance !== null && balance >= price

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Purchase {purchaseType === "lamp" ? productName : "Proof Print"}
          </DialogTitle>
          <DialogDescription>
            {purchaseType === "lamp"
              ? `Complete your purchase of ${productName}`
              : `Order a proof print of "${artworkTitle}"`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="font-medium">Total</span>
            <span className="text-2xl font-bold">{formatCurrency(price)}</span>
          </div>

          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            balance={balance}
            price={price}
            externalPaymentId={externalPaymentId}
            onExternalPaymentIdChange={setExternalPaymentId}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handlePurchase} 
            disabled={isProcessing || (paymentMethod === "payout_balance" && !canUseBalance) || (paymentMethod === "external" && !externalPaymentId.trim())}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

