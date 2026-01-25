"use client"

import { Loader2, AlertCircle, RefreshCw, CheckCircle, X } from "lucide-react"
import { format } from "date-fns"
import { formatUSD } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import type { RedemptionRequest } from "../types"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Alert, AlertDescription, AlertTitle } from "@/components/ui"
interface RedemptionRequestsTabProps {
  requests: RedemptionRequest[]
  isLoading: boolean
  onRefresh: () => void
  onAction: (payoutId: number, action: "approve" | "reject", reason?: string) => Promise<void>
}

export function RedemptionRequestsTab({
  requests,
  isLoading,
  onRefresh,
  onAction,
}: RedemptionRequestsTabProps) {
  const { toast } = useToast()

  const handleAction = async (request: RedemptionRequest, action: "approve" | "reject") => {
    let reason: string | undefined
    if (action === "reject") {
      reason = prompt("Reason for rejection (optional):") || undefined
      if (reason === null) return // User cancelled
    }

    await onAction(request.id, action, reason)
  }

  return (
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
                      <TableCell>
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      </TableCell>
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
                  <TableHead>Products</TableHead>
                  <TableHead>PayPal Email</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.vendorName}</TableCell>
                    <TableCell>{formatUSD(request.amount)}</TableCell>
                    <TableCell>{request.productCount}</TableCell>
                    <TableCell>
                      {request.paypalEmail ? (
                        <span className="text-sm">{request.paypalEmail}</span>
                      ) : (
                        <Badge variant="destructive">Missing</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.createdAt), "MMM d, yyyy HH:mm")}
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
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleAction(request, "reject")}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

