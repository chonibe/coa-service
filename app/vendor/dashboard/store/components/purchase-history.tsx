"use client"

import { useState, useEffect } from "react"



import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "@/components/ui"
interface Purchase {
  id: string
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

export function PurchaseHistory() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/vendor/store/purchases", {
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
        description: "Failed to load purchase history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (purchases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>Your store purchase history will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No purchases yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase History</CardTitle>
        <CardDescription>View all your store purchases</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell>
                  {format(new Date(purchase.created_at), "MMM d, yyyy")}
                </TableCell>
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
                <TableCell>{purchase.quantity}</TableCell>
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
                    <span className="text-sm">External</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(purchase.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

