"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { formatter } from "@/lib/utils"

interface PayoutHistory {
  id: string
  amount: number
  status: "pending" | "approved" | "rejected"
  requested_at: string
  processed_at: string | null
  paypal_email: string
  admin_notes: string | null
}

interface VendorData {
  accumulated_sales: number
  paid_amount: number
  paypal_email: string | null
}

export default function VendorPayoutsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vendorData, setVendorData] = useState<VendorData | null>(null)
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([])
  const [amount, setAmount] = useState("")
  const [paypalEmail, setPaypalEmail] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch vendor data and payout history
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vendor profile
        const profileRes = await fetch("/api/vendor/profile")
        if (!profileRes.ok) {
          throw new Error("Failed to fetch vendor profile")
        }
        const profileData = await profileRes.json()
        setVendorData(profileData.vendor)
        setPaypalEmail(profileData.vendor.paypal_email || "")

        // Fetch payout history
        const historyRes = await fetch("/api/vendor/payouts/history")
        if (!historyRes.ok) {
          throw new Error("Failed to fetch payout history")
        }
        const historyData = await historyRes.json()
        setPayoutHistory(historyData.payouts)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load vendor data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/vendor/payouts/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          paypal_email: paypalEmail,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit payout request")
      }

      toast({
        title: "Success",
        description: "Payout request submitted successfully",
      })

      // Refresh payout history
      const historyRes = await fetch("/api/vendor/payouts/history")
      const historyData = await historyRes.json()
      setPayoutHistory(historyData.payouts)

      // Close dialog and reset form
      setIsDialogOpen(false)
      setAmount("")
    } catch (error) {
      console.error("Error submitting payout request:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit payout request",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const availableBalance = vendorData ? vendorData.accumulated_sales - vendorData.paid_amount : 0

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Vendor Payouts</h1>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={availableBalance <= 0}>Request Payout</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Enter the amount you want to withdraw. The amount will be sent to your PayPal account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitRequest}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={availableBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Available balance: {formatter.format(availableBalance)}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paypal_email">PayPal Email</Label>
                  <Input
                    id="paypal_email"
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatter.format(availableBalance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatter.format(vendorData?.accumulated_sales || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatter.format(vendorData?.paid_amount || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of your payout requests</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date Requested</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processed Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No payout history found
                  </TableCell>
                </TableRow>
              ) : (
                payoutHistory.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>{new Date(payout.requested_at).toLocaleDateString()}</TableCell>
                    <TableCell>{formatter.format(payout.amount)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(payout.status)}`}
                      >
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {payout.processed_at ? new Date(payout.processed_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>{payout.admin_notes || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
