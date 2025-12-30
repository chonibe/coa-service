"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle2, Search, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface OrderComparison {
  order_id: string
  order_number: string
  db_financial_status: string | null
  shopify_financial_status: string | null
  db_fulfillment_status: string | null
  shopify_fulfillment_status: string | null
  db_cancelled: boolean
  shopify_cancelled: boolean
  db_archived: boolean | null
  shopify_archived: boolean
  mismatches: string[]
  shopify_order_data?: any
}

interface ComparisonResult {
  success: boolean
  comparisons: OrderComparison[]
  mismatches: OrderComparison[]
  summary: {
    total_checked: number
    mismatches: number
    matches: number
  }
  message?: string
}

export default function CompareOrdersButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState("")
  const [limit, setLimit] = useState("100")

  const runComparison = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const params = new URLSearchParams()
      if (orderNumber) {
        params.append("orderNumber", orderNumber)
      }
      if (limit) {
        params.append("limit", limit)
      }

      const response = await fetch(`/api/admin/orders/compare-shopify?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to compare orders")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string | null, isMatch: boolean) => {
    if (!status) return <Badge variant="outline">null</Badge>
    return (
      <Badge variant={isMatch ? "default" : "destructive"} className="text-xs">
        {status}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="h-4 w-4" />
          Compare with Shopify
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Orders: Database vs Shopify</DialogTitle>
          <DialogDescription>
            Cross-reference orders between the database and Shopify API to identify mismatches
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orderNumber">Order Number (optional, e.g., 1114)</Label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Leave empty to check all orders"
              />
            </div>
            <div>
              <Label htmlFor="limit">Limit</Label>
              <Input
                id="limit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>

          <Button onClick={runComparison} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Comparing orders...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Run Comparison
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Summary */}
          {result && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>
                      Checked {result.summary.total_checked} orders
                    </span>
                    <div className="flex gap-4">
                      <Badge variant="destructive">
                        {result.summary.mismatches} Mismatches
                      </Badge>
                      <Badge variant="default">
                        {result.summary.matches} Matches
                      </Badge>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Mismatches List */}
              {result.mismatches.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Mismatches Found:</h3>
                  <div className="space-y-4">
                    {result.mismatches.map((comparison) => (
                      <div
                        key={comparison.order_id}
                        className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">
                            Order #{comparison.order_number} (ID: {comparison.order_id})
                          </h4>
                          <Badge variant="destructive">{comparison.mismatches.length} issues</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-sm font-medium mb-1">Financial Status</div>
                            <div className="flex gap-2">
                              <div>
                                <span className="text-xs text-muted-foreground">DB: </span>
                                {getStatusBadge(
                                  comparison.db_financial_status,
                                  comparison.db_financial_status === comparison.shopify_financial_status
                                )}
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Shopify: </span>
                                {getStatusBadge(
                                  comparison.shopify_financial_status,
                                  comparison.db_financial_status === comparison.shopify_financial_status
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium mb-1">Fulfillment Status</div>
                            <div className="flex gap-2">
                              <div>
                                <span className="text-xs text-muted-foreground">DB: </span>
                                {getStatusBadge(
                                  comparison.db_fulfillment_status,
                                  comparison.db_fulfillment_status === comparison.shopify_fulfillment_status
                                )}
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Shopify: </span>
                                {getStatusBadge(
                                  comparison.shopify_fulfillment_status,
                                  comparison.db_fulfillment_status === comparison.shopify_fulfillment_status
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium mb-1">Cancelled</div>
                            <div className="flex gap-2">
                              <Badge variant={comparison.db_cancelled === comparison.shopify_cancelled ? "default" : "destructive"}>
                                DB: {comparison.db_cancelled ? "Yes" : "No"}
                              </Badge>
                              <Badge variant={comparison.db_cancelled === comparison.shopify_cancelled ? "default" : "destructive"}>
                                Shopify: {comparison.shopify_cancelled ? "Yes" : "No"}
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium mb-1">Archived</div>
                            <div className="flex gap-2">
                              <Badge variant="outline">
                                DB: {comparison.db_archived ? "Yes" : "No/Unknown"}
                              </Badge>
                              <Badge variant={comparison.shopify_archived ? "destructive" : "default"}>
                                Shopify: {comparison.shopify_archived ? "Yes" : "No"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="text-sm font-medium mb-1">Mismatch Details:</div>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {comparison.mismatches.map((mismatch, idx) => (
                              <li key={idx} className={mismatch.includes("CRITICAL") ? "text-red-600 font-semibold" : ""}>
                                {mismatch}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {comparison.shopify_order_data && (
                          <div className="mt-3 text-xs text-muted-foreground space-y-1">
                            <div>Shopify cancelled_at: {comparison.shopify_order_data.cancelled_at || "null"}</div>
                            <div>Shopify status: {comparison.shopify_order_data.status || "unknown"}</div>
                            <div>Shopify closed_at: {comparison.shopify_order_data.closed_at || "null"}</div>
                            <div>Shopify tags: {comparison.shopify_order_data.tags || "none"}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Comparisons (if no mismatches or if user wants to see all) */}
              {result.mismatches.length === 0 && result.comparisons.length > 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    All {result.summary.total_checked} orders match between database and Shopify!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

