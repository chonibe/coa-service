"use client"

import { CardFooter } from "@/components/ui/card"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PayoutsPage() {
  const [lineItemId, setLineItemId] = useState("")
  const [orderId, setOrderId] = useState("")
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutType, setPayoutType] = useState("percentage")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePayoutSubmit = async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineItemId,
          orderId,
          payoutAmount: Number(payoutAmount),
          payoutType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}`)
      }

      setSuccessMessage("Payout information updated successfully!")
    } catch (err: any) {
      console.error("Error updating payout information:", err)
      setError(err.message || "Failed to update payout information")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div className="flex flex-col space-y-8">
        <div>
          <Link href="/admin/vendors" className="flex items-center text-sm mb-2 hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Vendors
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Configure Payouts</h1>
          <p className="text-muted-foreground mt-2">Set payout amounts for each artwork sold</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Payout Configuration</CardTitle>
            <CardDescription>Set the payout amount for a specific line item</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="line-item-id">Line Item ID</Label>
                <Input
                  id="line-item-id"
                  placeholder="Enter line item ID"
                  value={lineItemId}
                  onChange={(e) => setLineItemId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-id">Order ID</Label>
                <Input
                  id="order-id"
                  placeholder="Enter order ID"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payout-type">Payout Type</Label>
                <Select value={payoutType} onValueChange={setPayoutType}>
                  <SelectTrigger id="payout-type">
                    <SelectValue placeholder="Select payout type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handlePayoutSubmit} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Payout"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
