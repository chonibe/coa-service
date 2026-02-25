"use client"

import { useState } from "react"
import { Loader2, AlertCircle, RefreshCw, CheckCircle, X, AlertTriangle } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { formatUSD } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import type { RedemptionRequest } from "../types"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Alert, AlertDescription, AlertTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui"
interface RedemptionRequestsTabProps {
  requests: RedemptionRequest[]
  isLoading: boolean
  onRefresh: () => void
  onAction: (payoutId: number, action: "approve" | "reject", reason?: string) => Promise<void>
}

function getRequestAge(createdAt: string): { text: string; urgency: "normal" | "amber" | "red" } {
  const created = new Date(createdAt)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  const text = formatDistanceToNow(created, { addSuffix: true })

  if (daysDiff >= 7) return { text, urgency: "red" }
  if (daysDiff >= 3) return { text, urgency: "amber" }
  return { text, urgency: "normal" }
}

export function RedemptionRequestsTab({
  requests,
  isLoading,
  onRefresh,
  onAction,
}: RedemptionRequestsTabProps) {
  const { toast } = useToast()
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    request: RedemptionRequest | null
    action: "approve" | "reject"
  }>({ open: false, request: null, action: "approve" })
  const [isActioning, setIsActioning] = useState(false)

  const handleAction = async (request: RedemptionRequest, action: "approve" | "reject") => {
    if (action === "approve") {
      // Show confirmation dialog for approve
      setConfirmDialog({ open: true, request, action })
      return
    }

    // For reject, prompt for reason
    const reason = prompt("Reason for rejection (optional):") || undefined
    if (reason === null) return // User cancelled

    setIsActioning(true)
    try {
      await onAction(request.id, action, reason)
    } finally {
      setIsActioning(false)
    }
  }

  const handleConfirmAction = async () => {
    if (!confirmDialog.request) return
    setIsActioning(true)
    try {
      await onAction(confirmDialog.request.id, confirmDialog.action)
      setConfirmDialog({ open: false, request: null, action: "approve" })
    } finally {
      setIsActioning(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Redemption Requests</CardTitle>
              <CardDescription>Vendor payout requests awaiting approval</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Ledger Balance</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>PayPal Email</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <Alert>
                <AlertTitle>No redemption requests</AlertTitle>
                <AlertDescription>
                  There are no pending redemption requests at this time. Vendors can request payouts from their dashboard.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Ledger Balance</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>PayPal Email</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const age = getRequestAge(request.createdAt)
                    const balanceMismatch = Math.abs(request.ledgerBalance - request.amount) > 0.01
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.vendorName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {formatUSD(request.amount)}
                            {balanceMismatch && (
                              <AlertTriangle className="h-4 w-4 text-amber-500" title="Amount differs from ledger balance" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-medium",
                            balanceMismatch && "text-amber-600"
                          )}>
                            {formatUSD(request.ledgerBalance)}
                          </span>
                        </TableCell>
                        <TableCell>{request.productCount}</TableCell>
                        <TableCell>
                          {request.paypalEmail ? (
                            <span className="text-sm">{request.paypalEmail}</span>
                          ) : (
                            <Badge variant="destructive">Missing</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">
                              {format(new Date(request.createdAt), "MMM d, yyyy HH:mm")}
                            </span>
                            <span className={cn(
                              "text-xs",
                              age.urgency === "red" && "text-red-600 font-medium",
                              age.urgency === "amber" && "text-amber-600 font-medium",
                              age.urgency === "normal" && "text-muted-foreground"
                            )}>
                              {age.text}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{request.reference}</code>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAction(request, "approve")}
                              disabled={isActioning}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleAction(request, "reject")}
                              disabled={isActioning}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Approve */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, request: null, action: "approve" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payout Approval</DialogTitle>
            <DialogDescription>
              You are about to approve a payout for <strong>{confirmDialog.request?.vendorName}</strong>.
            </DialogDescription>
          </DialogHeader>
          {confirmDialog.request && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Requested Amount</div>
                  <div className="text-lg font-semibold">{formatUSD(confirmDialog.request.amount)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Ledger Balance</div>
                  <div className={cn(
                    "text-lg font-semibold",
                    Math.abs(confirmDialog.request.ledgerBalance - confirmDialog.request.amount) > 0.01 && "text-amber-600"
                  )}>
                    {formatUSD(confirmDialog.request.ledgerBalance)}
                  </div>
                </div>
              </div>
              {Math.abs(confirmDialog.request.ledgerBalance - confirmDialog.request.amount) > 0.01 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Balance Mismatch</AlertTitle>
                  <AlertDescription>
                    The requested amount differs from the current ledger balance. This could indicate the balance has changed since the request was made.
                  </AlertDescription>
                </Alert>
              )}
              <div className="text-sm text-muted-foreground">
                PayPal: {confirmDialog.request.paypalEmail || "Not set"}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, request: null, action: "approve" })} disabled={isActioning}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isActioning}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              {isActioning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirm Approval
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

