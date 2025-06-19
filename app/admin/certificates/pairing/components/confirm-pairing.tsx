"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Tag, Package, AlertTriangle } from "lucide-react"

interface LineItem {
  id: string
  product_name: string
  order_number: string
  quantity: number
}

interface NFCTagData {
  serialNumber: string
  id?: string
}

interface ConfirmPairingProps {
  itemDetails: LineItem
  tagDetails: NFCTagData
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function ConfirmPairing({
  itemDetails,
  tagDetails,
  onConfirm,
  onCancel
}: ConfirmPairingProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string>()

  const handleConfirm = async () => {
    try {
      setIsConfirming(true)
      setError(undefined)
      await onConfirm()
    } catch (err) {
      console.error("Error confirming pairing:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to complete pairing. Please try again."
      )
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm NFC Tag Pairing</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Item Details */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Item Details
            </h3>
            <div className="bg-accent/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">{itemDetails.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Order #{itemDetails.order_number}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    Quantity: {itemDetails.quantity}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* NFC Tag Details */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              NFC Tag Details
            </h3>
            <div className="bg-accent/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Serial Number</p>
                  <p className="text-sm font-mono bg-background px-2 py-1 rounded mt-1">
                    {tagDetails.serialNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. Please verify the details above before
              confirming.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isConfirming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm Pairing"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 