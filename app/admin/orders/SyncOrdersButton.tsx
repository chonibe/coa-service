"use client"

import { useState } from "react"




import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react"



import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Badge, Alert, AlertDescription, Input, Label } from "@/components/ui"
interface SyncResult {
  order_id: string
  order_number: string
  updated: boolean
  changes: string[]
  errors: string[]
}

interface SyncResponse {
  success: boolean
  results: SyncResult[]
  summary: {
    total_processed: number
    updated: number
    errors: number
    no_changes: number
  }
  dryRun?: boolean
  message?: string
}

export default function SyncOrdersButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SyncResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState("")
  const [limit, setLimit] = useState("50")
  const [dryRun, setDryRun] = useState(true)

  const runSync = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/orders/sync-shopify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber: orderNumber || undefined,
          limit: parseInt(limit) || 50,
          dryRun,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to sync orders")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Sync with Shopify
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sync Orders with Shopify</DialogTitle>
          <DialogDescription>
            Update database orders to match Shopify status 1:1. Cancelled orders will be set to voided, and all status fields will be synced.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="syncOrderNumber">Order Number (optional, e.g., 1114)</Label>
              <Input
                id="syncOrderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Leave empty to sync multiple orders"
              />
            </div>
            <div>
              <Label htmlFor="syncLimit">Limit</Label>
              <Input
                id="syncLimit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="50"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dryRun"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="dryRun" className="cursor-pointer">
              Dry run (preview changes without applying)
            </Label>
          </div>

          <Button onClick={runSync} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing orders...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {dryRun ? "Preview Sync" : "Sync Orders"}
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
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>
                      Processed {result.summary.total_processed} orders
                    </span>
                    <div className="flex gap-4">
                      <Badge variant="default">
                        {result.summary.updated} Updated
                      </Badge>
                      {result.summary.errors > 0 && (
                        <Badge variant="destructive">
                          {result.summary.errors} Errors
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {result.summary.no_changes} No Changes
                      </Badge>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {result.dryRun && result.summary.updated > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This was a dry run. Run again without dry run to apply changes.
                  </AlertDescription>
                </Alert>
              )}

              {/* Updated Orders */}
              {result.results.filter(r => r.updated).length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Updated Orders:</h3>
                  <div className="space-y-4">
                    {result.results
                      .filter(r => r.updated)
                      .map((result) => (
                        <div
                          key={result.order_id}
                          className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">
                              Order #{result.order_number} (ID: {result.order_id})
                            </h4>
                            <Badge variant="default">{result.changes.length} changes</Badge>
                          </div>
                          <div className="space-y-1">
                            {result.changes.map((change, idx) => (
                              <div key={idx} className="text-sm text-green-700 dark:text-green-300">
                                ✓ {change}
                              </div>
                            ))}
                          </div>
                          {result.errors.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {result.errors.map((error, idx) => (
                                <div key={idx} className="text-sm text-red-600 dark:text-red-400">
                                  ⚠️ {error}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Orders with Errors */}
              {result.results.filter(r => r.errors.length > 0).length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Orders with Errors:</h3>
                  <div className="space-y-4">
                    {result.results
                      .filter(r => r.errors.length > 0)
                      .map((result) => (
                        <div
                          key={result.order_id}
                          className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">
                              Order #{result.order_number} (ID: {result.order_id})
                            </h4>
                            <Badge variant="destructive">{result.errors.length} errors</Badge>
                          </div>
                          <div className="space-y-1">
                            {result.errors.map((error, idx) => (
                              <div key={idx} className="text-sm text-red-600 dark:text-red-400">
                                ❌ {error}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* No Changes */}
              {result.summary.no_changes > 0 && result.results.filter(r => !r.updated && r.errors.length === 0).length > 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    {result.summary.no_changes} orders are already in sync with Shopify.
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
