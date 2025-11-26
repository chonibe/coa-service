"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { formatUSD } from "@/lib/utils"
import { ChevronRight, Download, Eye } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface Payout {
  id: string | number
  vendor_name?: string
  amount: number
  status: string
  payout_date: string
  created_at: string
  reference?: string
  invoice_number?: string
  payment_method?: string
  product_count?: number
}

interface MobilePayoutViewProps {
  payouts: Payout[]
  isLoading?: boolean
  onPayoutClick?: (payout: Payout) => void
  isAdmin?: boolean
}

export function MobilePayoutView({ payouts, isLoading = false, onPayoutClick, isAdmin = false }: MobilePayoutViewProps) {
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>
      case "pending":
      case "processing":
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handlePayoutClick = (payout: Payout) => {
    setSelectedPayout(payout)
    if (onPayoutClick) {
      onPayoutClick(payout)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  if (payouts.length === 0) {
    return (
      <Card className="m-4">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No payouts found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3 p-4 pb-20">
      {payouts.map((payout) => (
        <Card
          key={payout.id}
          className="touch-manipulation active:scale-[0.98] transition-transform"
          onClick={() => handlePayoutClick(payout)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                {isAdmin && payout.vendor_name && (
                  <p className="text-sm font-medium text-muted-foreground mb-1 truncate">
                    {payout.vendor_name}
                  </p>
                )}
                <p className="text-lg font-bold">{formatUSD(payout.amount)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(payout.payout_date || payout.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 ml-2">
                {getStatusBadge(payout.status)}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {payout.payment_method && (
                <span className="capitalize">{payout.payment_method.replace("_", " ")}</span>
              )}
              {payout.product_count !== undefined && (
                <span>{payout.product_count} product{payout.product_count !== 1 ? "s" : ""}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Detail Sheet */}
      {selectedPayout && (
        <Sheet open={!!selectedPayout} onOpenChange={(open) => !open && setSelectedPayout(null)}>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Payout Details</SheetTitle>
              <SheetDescription>
                {format(new Date(selectedPayout.payout_date || selectedPayout.created_at), "PPP")}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold">{formatUSD(selectedPayout.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(selectedPayout.status)}</div>
              </div>
              {selectedPayout.vendor_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">{selectedPayout.vendor_name}</p>
                </div>
              )}
              {selectedPayout.payment_method && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">{selectedPayout.payment_method.replace("_", " ")}</p>
                </div>
              )}
              {selectedPayout.reference && (
                <div>
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="font-medium">{selectedPayout.reference}</p>
                </div>
              )}
              {selectedPayout.invoice_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">{selectedPayout.invoice_number}</p>
                </div>
              )}
              {(selectedPayout.status === "completed" || selectedPayout.status === "paid") &&
                selectedPayout.invoice_number && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      const link = document.createElement("a")
                      link.href = `/api/vendors/payouts/${selectedPayout.id}/invoice`
                      link.download = `invoice-${selectedPayout.invoice_number || selectedPayout.id}.pdf`
                      link.click()
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice
                  </Button>
                )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}


