"use client"

import { useState, useEffect } from "react"




import { Skeleton } from "@/components/ui"

import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
interface Purchase {
  id: string
  vendor_name: string
  purchase_type: "lamp" | "proof_print"
  product_sku: string | null
  artwork_submission_id: string | null
  quantity: number
  unit_price: number
  discount_percentage: number | null
  total_amount: number
  payment_method: "payout_balance" | "external"
  payout_balance_used: number | null
  external_payment_id: string | null
  status: "pending" | "processing" | "fulfilled" | "cancelled"
  fulfilled_at: string | null
  created_at: string
}

export default function StorePurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchPurchases()
  }, [statusFilter])

  const fetchPurchases = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/store/purchases?status=${statusFilter}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch purchases")
      }

      const data = await response.json()
      if (data.success) {
        setPurchases(data.purchases)
      }
    } catch (error: any) {
      console.error("Error fetching purchases:", error)
      toast({
        title: "Error",
        description: "Failed to load purchases",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updatePurchaseStatus = async (purchaseId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/store/purchases/${purchaseId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status")
      }

      toast({
        title: "Success",
        description: "Purchase status updated",
      })

      fetchPurchases()
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "fulfilled":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "default",
      fulfilled: "default",
      cancelled: "destructive",
    }
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredPurchases = statusFilter === "all" 
    ? purchases 
    : purchases.filter(p => p.status === statusFilter)

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Purchases</h1>
          <p className="text-muted-foreground mt-2">
            Manage and fulfill vendor store purchases
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchases ({filteredPurchases.length})</CardTitle>
          <CardDescription>View and manage all vendor store purchases</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No purchases found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      {format(new Date(purchase.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">{purchase.vendor_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {purchase.purchase_type === "lamp" ? "Lamp" : "Proof Print"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {purchase.purchase_type === "lamp"
                        ? purchase.product_sku || "Lamp"
                        : "Proof Print"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatCurrency(purchase.total_amount)}
                        </span>
                        {purchase.discount_percentage && (
                          <span className="text-xs text-muted-foreground">
                            {purchase.discount_percentage}% off
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {purchase.payment_method === "payout_balance" ? (
                        <span className="text-sm">Balance</span>
                      ) : (
                        <span className="text-sm">
                          {purchase.external_payment_id || "External"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(purchase.status)}
                        {getStatusBadge(purchase.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {purchase.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updatePurchaseStatus(purchase.id, "processing")}
                            >
                              Mark Processing
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updatePurchaseStatus(purchase.id, "fulfilled")}
                            >
                              Fulfill
                            </Button>
                          </>
                        )}
                        {purchase.status === "processing" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updatePurchaseStatus(purchase.id, "fulfilled")}
                          >
                            Mark Fulfilled
                          </Button>
                        )}
                        {purchase.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updatePurchaseStatus(purchase.id, "cancelled")}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

