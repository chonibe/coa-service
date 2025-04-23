"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function BackfillVendorNamesPage() {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleBackfill = async () => {
    if (!password) {
      setError("Admin password is required")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/backfill-vendor-names", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to backfill vendor names")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Backfill Vendor Names</h1>
      <p className="mb-6 text-muted-foreground">
        This utility will fetch vendor names from Shopify for line items that don't have a vendor name in the database.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Backfill Vendor Names</CardTitle>
          <CardDescription>
            Enter the admin password to start the backfill process. This will process up to 100 line items at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Admin Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleBackfill} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              "Start Backfill Process"
            )}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Backfill Process Results
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Processed: {result.processed} line items</p>
                <p className="text-sm text-muted-foreground">
                  Successfully updated: {result.results?.filter((r: any) => r.success).length || 0} line items
                </p>
              </div>

              {result.results?.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Line Item ID
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Product ID
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Vendor Name / Message
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-gray-200">
                      {result.results.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.lineItemId}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.productId}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {item.success ? (
                              <span className="text-green-500 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" /> Success
                              </span>
                            ) : (
                              <span className="text-red-500 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" /> Failed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {item.success ? item.vendorName : item.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {result.message && (
                <Alert>
                  <AlertTitle>Note</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
