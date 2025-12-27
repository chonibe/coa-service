"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Send, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
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
  const { toast } = useToast()

  const handleProcess = async () => {
    if (selectedPayouts.length === 0) return

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Vendor Payouts</DialogTitle>
          <DialogDescription>
            You are about to process payouts for {selectedPayouts.length} vendor
            {selectedPayouts.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              This will process payments for all selected vendors. Make sure all vendor payment
              details are correct before proceeding.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleProcess} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Process Payouts
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

