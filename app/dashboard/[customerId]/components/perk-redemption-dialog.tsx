"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Gift } from "lucide-react"
import type { CollectorPerkType } from "@/lib/banking/types"

interface PerkRedemptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  perkType: CollectorPerkType
  productSku?: string
  artworkSubmissionId?: string
  collectorIdentifier: string
  onSuccess?: () => void
}

export function PerkRedemptionDialog({
  open,
  onOpenChange,
  perkType,
  productSku,
  artworkSubmissionId,
  collectorIdentifier,
  onSuccess,
}: PerkRedemptionDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleRedeem = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/banking/perks/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          collector_identifier: collectorIdentifier,
          perk_type: perkType,
          product_sku: perkType === "lamp" ? productSku : undefined,
          artwork_submission_id: perkType === "proof_print" ? artworkSubmissionId : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to redeem perk")
      }

      toast({
        title: "Success",
        description: `Free ${perkType === "lamp" ? "lamp" : "proof print"} redeemed successfully!`,
      })

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Error redeeming perk:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to redeem perk",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const perkName = perkType === "lamp" ? "Lamp" : "Proof Print"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-500" />
            Redeem Free {perkName}
          </DialogTitle>
          <DialogDescription>
            You've unlocked a free {perkName.toLowerCase()}! This redemption is free and will not use any credits.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-900 dark:text-green-100">
              <strong>Congratulations!</strong> You've earned enough credits to unlock a free {perkName.toLowerCase()}.
              This redemption is completely free - no credits will be deducted.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleRedeem} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Redeem Free {perkName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

