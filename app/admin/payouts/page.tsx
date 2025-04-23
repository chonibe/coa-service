"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { formatter } from "@/lib/utils"

interface PayoutRequest {
  id: string
  amount: number
  status: "pending" | "approved" | "rejected"
  requested_at: string
  processed_at: string | null
  paypal_email: string
  admin_notes: string | null
  vendor_id: string
  vendor_name: string
}

export default function AdminPayoutsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null)
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch all payout requests
  const fetchPayouts = async () => {
    try {
      const res = await fetch("/api/admin/payouts")
      if (!res.ok) {
        throw new Error("Failed to fetch payout requests")
      }
      const data = await res.json()
      setPayouts(data.payouts)
    } catch (error) {
      console.error("Error fetching payouts:", error)
      toast({
        title: "Error",
        description: "Failed to load payout requests",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPayouts()
  }, [])

  const handleProcessPayout = async () => {
    if (!selectedPayout || !dialogAction) return

    setIsProcessing(true)

    try {
      const res = await fetch("/api/admin/payouts/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payoutId: selectedPayout.id,
          action: dialogAction,
          notes: adminNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to process payout")
      }

      toast({
        title: "Success",
        description: `Payout ${dialogAction}d successfully`,
      })

      // Refresh payout list
      fetchPayouts()

      // Close dialog and reset state
      setIsDialogOpen(false)
      setSelectedPayout(null)
      setDialogAction(null)
      setAdminNotes("")
    } catch (error) {
      console.error("Error processing payout:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payout",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const openProcessDialog = (payout: PayoutRequest, action: "approve" | "reject") => {
    setSelectedPayout(payout)
    setDialogAction(action)
    setIsDialogOpen(true)
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

  const pendingPayouts = payouts.filter((p) => p.status === "pending")
  const processedPayouts = payouts.filter((p) => p.status !== "pending")

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Vendor Payout Management</h1>

      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayouts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatter.format(pendingPayouts.reduce((sum, payout) => sum + payout.amount, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatter.format(
                processedPayouts
                  .filter((p) => {
                    const date = new Date(p.processed_at || "")
                    const now = new Date()
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                  })
                  .filter((p) => p.status === "approved")
                  .reduce((sum, payout) => sum + payout.amount, 0),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pending Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>
              {pendingPayouts.length === 0 ? "No pending payout requests" : "A list of pending payout requests"}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Date Requested</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>PayPal Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No pending payout requests found
                  </TableCell>
                </TableRow>
              ) : (
                pendingPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>{payout.vendor_name}</TableCell>
                    <TableCell>{new Date(payout.requested_at).toLocaleDateString()}</TableCell>
                    <TableCell>{formatter.format(payout.amount)}</TableCell>
                    <TableCell>{payout.paypal_email}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => openProcessDialog(payout, "approve")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openProcessDialog(payout, "reject")}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A history of all processed payout requests</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Date Requested</TableHead>
                <TableHead>Date Processed</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No processed payout requests found
                  </TableCell>
                </TableRow>
              ) : (
                processedPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>{payout.vendor_name}</TableCell>
                    <TableCell>{new Date(payout.requested_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {payout.processed_at ? new Date(payout.processed_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>{formatter.format(payout.amount)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(payout.status)}`}
                      >
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{payout.admin_notes || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogAction === "approve" ? "Approve" : "Reject"} Payout Request</DialogTitle>
            <DialogDescription>
              {dialogAction === "approve"
                ? "This will approve the payout request and mark it as processed."
                : "This will reject the payout request and it will not be processed."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedPayout && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Vendor</Label>
                  <p>{selectedPayout.vendor_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Amount</Label>
                  <p>{formatter.format(selectedPayout.amount)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">PayPal Email</Label>
                  <p>{selectedPayout.paypal_email}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Requested</Label>
                  <p>{new Date(selectedPayout.requested_at).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  dialogAction === "approve"
                    ? "Add any notes about this payout (optional)"
                    : "Provide a reason for rejecting this payout (recommended)"
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={dialogAction === "approve" ? "default" : "destructive"}
              onClick={handleProcessPayout}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : dialogAction === "approve" ? "Approve Payout" : "Reject Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
