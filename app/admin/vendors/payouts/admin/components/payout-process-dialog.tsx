"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Send, AlertCircle, CheckCircle2, DollarSign, Users, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatUSD } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { PendingPayout } from "../types"

interface PayoutProcessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPayouts: PendingPayout[]
  onSuccess: () => void
}

export function PayoutProcessDialog({
  open,
  onOpenChange,
  selectedPayouts,
  onSuccess,
}: PayoutProcessDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("paypal")
  const [generateInvoices, setGenerateInvoices] = useState(true)
  const [payoutNotes, setPayoutNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { toast } = useToast()

  // Calculate summary
  const summary = useMemo(() => {
    const totalAmount = selectedPayouts.reduce((sum, p) => sum + p.amount, 0)
    const vendorsWithIssues = selectedPayouts.filter((p) => p.amount < 0 || !p.paypal_email)
    const missingEmails = selectedPayouts.filter((p) => !p.paypal_email)
    const negativeBalances = selectedPayouts.filter((p) => p.amount < 0)

    return {
      totalAmount,
      vendorCount: selectedPayouts.length,
      vendorsWithIssues: vendorsWithIssues.length,
      missingEmails: missingEmails.length,
      negativeBalances: negativeBalances.length,
      isLargeAmount: totalAmount > 10000, // Flag for large amounts
    }
  }, [selectedPayouts])

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = []
    if (selectedPayouts.length === 0) {
      errors.push("No vendors selected")
    }
    if (summary.missingEmails > 0) {
      errors.push(`${summary.missingEmails} vendor(s) missing PayPal emails`)
    }
    if (summary.negativeBalances > 0) {
      errors.push(`${summary.negativeBalances} vendor(s) have negative balances`)
    }
    return errors
  }, [selectedPayouts, summary])

  const canProcess = validationErrors.length === 0 && selectedPayouts.length > 0

  const handleProcess = async () => {
    if (!canProcess) {
      toast({
        variant: "destructive",
        title: "Cannot Process",
        description: validationErrors.join(". "),
      })
      return
    }

    // Show confirmation for large amounts
    if (summary.isLargeAmount && !showConfirmation) {
      setShowConfirmation(true)
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/vendors/payouts/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payouts: selectedPayouts,
          payment_method: paymentMethod,
          generate_invoices: generateInvoices,
          notes: payoutNotes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to process payouts")
      }

      const result = await response.json()

      toast({
        title: "Payouts processed",
        description: `Successfully processed ${result.processed} payouts.`,
      })

      // Reset form
      setPayoutNotes("")
      setPaymentMethod("paypal")
      setGenerateInvoices(true)
      setShowConfirmation(false)

      // Close dialog and notify parent
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      console.error("Error processing payouts:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to process payouts",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Reset confirmation when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowConfirmation(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Vendor Payouts</DialogTitle>
          <DialogDescription>
            Review and confirm payout processing for {selectedPayouts.length} vendor
            {selectedPayouts.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary Section */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Vendors</span>
              </div>
              <div className="text-2xl font-bold">{summary.vendorCount}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Amount</span>
              </div>
              <div className="text-2xl font-bold">{formatUSD(summary.totalAmount)}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <AlertTriangle
                  className={cn(
                    "h-4 w-4",
                    summary.vendorsWithIssues > 0 ? "text-amber-500" : "text-muted-foreground"
                  )}
                />
                <span className="text-sm text-muted-foreground">Issues</span>
              </div>
              <div
                className={cn(
                  "text-2xl font-bold",
                  summary.vendorsWithIssues > 0 && "text-amber-600"
                )}
              >
                {summary.vendorsWithIssues}
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Cannot Process</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Vendor Breakdown */}
          {selectedPayouts.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Vendor Breakdown</Label>
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                <div className="divide-y">
                  {selectedPayouts.map((payout) => (
                    <div
                      key={payout.vendor_name}
                      className="p-3 flex items-center justify-between hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{payout.vendor_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          {payout.paypal_email ? (
                            <Badge variant="outline" className="text-xs">
                              {payout.paypal_email}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              No Email
                            </Badge>
                          )}
                          {payout.amount < 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Negative Balance
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatUSD(payout.amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {payout.product_count} product{payout.product_count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Large Amount Warning */}
          {summary.isLargeAmount && !showConfirmation && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Large Payout Amount</AlertTitle>
              <AlertDescription>
                You are about to process a payout of {formatUSD(summary.totalAmount)}. Please verify all
                details before proceeding.
              </AlertDescription>
            </Alert>
          )}

          {/* Confirmation Step */}
          {showConfirmation && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Confirm Large Payout</AlertTitle>
              <AlertDescription>
                You are about to process a payout of {formatUSD(summary.totalAmount)} to{" "}
                {summary.vendorCount} vendor{summary.vendorCount !== 1 ? "s" : ""}. This action cannot
                be undone. Are you sure you want to proceed?
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="manual">Manual (Other)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="generate-invoices"
              checked={generateInvoices}
              onCheckedChange={(checked) => setGenerateInvoices(checked as boolean)}
            />
            <Label
              htmlFor="generate-invoices"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Generate self-billed invoices
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input
              placeholder="Add notes about this payout batch"
              value={payoutNotes}
              onChange={(e) => setPayoutNotes(e.target.value)}
            />
          </div>

          {!showConfirmation && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                This will process payments for all selected vendors. Make sure all vendor payment
                details are correct before proceeding.
                {generateInvoices && (
                  <span className="block mt-1">
                    Self-billed invoices will be generated for each vendor.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          {showConfirmation && (
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isProcessing}
            >
              Back
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleProcess} disabled={isProcessing || !canProcess}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : showConfirmation ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm & Process
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Process Payouts
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


