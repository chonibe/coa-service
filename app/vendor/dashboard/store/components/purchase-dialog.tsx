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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PaymentMethodSelector } from "./payment-method-selector"
import { CreditPaymentOption } from "./credit-payment-option"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, MapPin, CheckCircle2 } from "lucide-react"
import Link from "next/link"

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
  const [paymentMethod, setPaymentMethod] = useState<"payout_balance" | "external" | "credits">("payout_balance")
  const [creditAmount, setCreditAmount] = useState(0)
  const [collectorIdentifier, setCollectorIdentifier] = useState<string | null>(null)
  const [externalPaymentId, setExternalPaymentId] = useState("")
  const [balance, setBalance] = useState<number | null>(null)
  const [address, setAddress] = useState<string>("")
  const [hasAddress, setHasAddress] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchBalance()
      fetchAddress()
      fetchCollectorIdentifier()
    }
  }, [open])

  const fetchCollectorIdentifier = async () => {
    try {
      const response = await fetch("/api/banking/collector-identifier", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCollectorIdentifier(data.collectorIdentifier)
        }
      }
    } catch (error) {
      console.error("Error fetching collector identifier:", error)
    }
  }

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

  const fetchAddress = async () => {
    try {
      const response = await fetch("/api/vendor/profile", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        const vendor = data.vendor
        
        // Check if structured delivery address is complete
        const hasStructuredAddress = !!(
          vendor?.delivery_address1 &&
          vendor?.delivery_city &&
          vendor?.delivery_province &&
          vendor?.delivery_country &&
          vendor?.delivery_zip
        )
        
        if (hasStructuredAddress) {
          // Format structured address for display
          const addressParts = [
            vendor.delivery_address1,
            vendor.delivery_address2,
            `${vendor.delivery_city}, ${vendor.delivery_province} ${vendor.delivery_zip}`,
            vendor.delivery_country,
          ].filter(Boolean)
          setAddress(addressParts.join("\n"))
          setHasAddress(true)
        } else {
          // Fall back to business address if delivery address is incomplete
          const fallbackAddress = vendor?.address || ""
          setAddress(fallbackAddress)
          setHasAddress(fallbackAddress && fallbackAddress.trim() !== "")
        }
      }
    } catch (error) {
      console.error("Error fetching address:", error)
    }
  }

  const handlePurchase = async () => {
    // Validate address (required for delivery)
    if (!address || address.trim() === "") {
      toast({
        title: "Delivery Address Required",
        description: "Please add a delivery address to complete your purchase",
        variant: "destructive",
      })
      return
    }

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
          paymentMethod: paymentMethod === "credits" ? "credits" : paymentMethod,
          externalPaymentId: paymentMethod === "external" ? externalPaymentId : undefined,
          creditAmount: paymentMethod === "credits" ? creditAmount : undefined,
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

          {/* Delivery Address Step */}
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Address
            </Label>
            {hasAddress ? (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">Address on file</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">{address}</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 mt-1 text-xs text-green-700 dark:text-green-300"
                      asChild
                    >
                      <Link href="/vendor/dashboard/settings">Update address</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-900 dark:text-amber-100 mb-2">
                  Delivery address is required for shipping
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/vendor/dashboard/settings">
                    <MapPin className="h-4 w-4 mr-2" />
                    Add Delivery Address
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            balance={balance}
            price={price}
            externalPaymentId={externalPaymentId}
            onExternalPaymentIdChange={setExternalPaymentId}
          />

          {/* Credit Payment Option */}
          {collectorIdentifier && (
            <CreditPaymentOption
              collectorIdentifier={collectorIdentifier}
              price={price}
              onCreditAmountChange={setCreditAmount}
              selectedCreditAmount={creditAmount}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handlePurchase} 
            disabled={isProcessing || !hasAddress || (paymentMethod === "payout_balance" && !canUseBalance) || (paymentMethod === "external" && !externalPaymentId.trim())}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

