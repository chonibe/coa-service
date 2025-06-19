"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Tag, Package, CheckCircle } from "lucide-react"

interface ConfirmPairingProps {
  itemDetails: {
    id: string
    productName: string
    orderNumber: string
    quantity: number
  }
  tagDetails: {
    serialNumber: string
    id?: string
  }
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function ConfirmPairing({
  itemDetails,
  tagDetails,
  onConfirm,
  onCancel
}: ConfirmPairingProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>()
  const [isComplete, setIsComplete] = useState(false)

  const handleConfirm = async () => {
    setError(undefined)
    setIsProcessing(true)

    try {
      await onConfirm()
      setIsComplete(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to complete pairing. Please try again."
      )
    } finally {
      setIsProcessing(false)
    }
  }

  if (isComplete) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h3 className="text-lg font-semibold">Pairing Complete</h3>
            <p className="text-sm text-muted-foreground">
              The NFC tag has been successfully paired with the selected item.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Confirm Pairing Details</h3>
            <p className="text-sm text-muted-foreground">
              Please review the details below before confirming the pairing.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
              <Package className="h-5 w-5 mt-0.5 text-primary" />
              <div className="space-y-1">
                <p className="font-medium">Selected Item</p>
                <p className="text-sm">{itemDetails.productName}</p>
                <p className="text-sm text-muted-foreground">
                  Order: {itemDetails.orderNumber} • Quantity: {itemDetails.quantity}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
              <Tag className="h-5 w-5 mt-0.5 text-primary" />
              <div className="space-y-1">
                <p className="font-medium">NFC Tag</p>
                <p className="text-sm font-mono">{tagDetails.serialNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {tagDetails.id ? "Existing tag" : "New tag"}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between space-x-4">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Pairing...
            </>
          ) : (
            "Confirm Pairing"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
} 