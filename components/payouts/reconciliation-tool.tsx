"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatUSD } from "@/lib/utils"
import { format } from "date-fns"

interface ReconciliationRecord {
  id: string
  payoutId: string
  vendorName: string
  expectedAmount: number
  actualAmount: number
  discrepancy: number
  status: "matched" | "discrepancy" | "pending"
  paymentProvider: string
  providerReference: string
  reconciledAt?: string
  reconciledBy?: string
  notes?: string
}

interface ReconciliationToolProps {
  isAdmin?: boolean
  vendorName?: string
}

export function ReconciliationTool({ isAdmin = false, vendorName }: ReconciliationToolProps) {
  const [records, setRecords] = useState<ReconciliationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReconciling, setIsReconciling] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ReconciliationRecord | null>(null)
  const [notes, setNotes] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchReconciliationData()
  }, [vendorName])

  const fetchReconciliationData = async () => {
    try {
      setIsLoading(true)
      const url = isAdmin
        ? "/api/payouts/reconcile"
        : `/api/payouts/reconcile?vendorName=${encodeURIComponent(vendorName || "")}`

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch reconciliation data")
      }

      const data = await response.json()
      setRecords(data.records || [])
    } catch (error) {
      console.error("Error fetching reconciliation data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reconciliation data",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReconcile = async () => {
    if (!selectedRecord) return

    try {
      setIsReconciling(true)
      const response = await fetch(`/api/payouts/reconcile/${selectedRecord.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes,
          manualReconciliation: true,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to reconcile")
      }

      toast({
        title: "Success",
        description: "Record reconciled successfully",
      })

      setIsDialogOpen(false)
      setSelectedRecord(null)
      setNotes("")
      fetchReconciliationData()
    } catch (error) {
      console.error("Error reconciling:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reconcile",
      })
    } finally {
      setIsReconciling(false)
    }
  }

  const handleAutoReconcile = async () => {
    try {
      setIsReconciling(true)
      const response = await fetch("/api/payouts/reconcile/auto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorName: isAdmin ? undefined : vendorName,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Auto-reconciliation failed")
      }

      const data = await response.json()
      toast({
        title: "Auto-Reconciliation Complete",
        description: `Matched ${data.matched} records, found ${data.discrepancies} discrepancies`,
      })

      fetchReconciliationData()
    } catch (error) {
      console.error("Error in auto-reconciliation:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Auto-reconciliation failed",
      })
    } finally {
      setIsReconciling(false)
    }
  }

  const openReconcileDialog = (record: ReconciliationRecord) => {
    setSelectedRecord(record)
    setNotes(record.notes || "")
    setIsDialogOpen(true)
  }

  const discrepancies = records.filter((r) => r.status === "discrepancy")
  const pending = records.filter((r) => r.status === "pending")
  const matched = records.filter((r) => r.status === "matched")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reconciliation Tool</CardTitle>
            <CardDescription>
              Match payouts with payment provider records and detect discrepancies
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchReconciliationData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={handleAutoReconcile} disabled={isReconciling}>
              {isReconciling ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reconciling...
                </>
              ) : (
                "Auto-Reconcile"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Matched</p>
                  <p className="text-2xl font-bold text-green-600">{matched.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Discrepancies</p>
                  <p className="text-2xl font-bold text-red-600">{discrepancies.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {discrepancies.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Discrepancies Detected</AlertTitle>
            <AlertDescription>
              {discrepancies.length} payout(s) have discrepancies that require attention.
            </AlertDescription>
          </Alert>
        )}

        {/* Records Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading reconciliation data...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No reconciliation records found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payout ID</TableHead>
                {isAdmin && <TableHead>Vendor</TableHead>}
                <TableHead>Expected</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow
                  key={record.id}
                  className={record.status === "discrepancy" ? "bg-red-50 dark:bg-red-950/20" : ""}
                >
                  <TableCell className="font-mono text-xs">{record.payoutId}</TableCell>
                  {isAdmin && <TableCell>{record.vendorName}</TableCell>}
                  <TableCell>{formatUSD(record.expectedAmount)}</TableCell>
                  <TableCell>{formatUSD(record.actualAmount)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        record.discrepancy === 0
                          ? "text-green-600"
                          : record.discrepancy > 0
                            ? "text-red-600"
                            : "text-amber-600"
                      }
                    >
                      {record.discrepancy > 0 ? "+" : ""}
                      {formatUSD(record.discrepancy)}
                    </span>
                  </TableCell>
                  <TableCell>{record.paymentProvider}</TableCell>
                  <TableCell>
                    {record.status === "matched" ? (
                      <Badge className="bg-green-500">Matched</Badge>
                    ) : record.status === "discrepancy" ? (
                      <Badge variant="destructive">Discrepancy</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openReconcileDialog(record)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Reconcile Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reconcile Record</DialogTitle>
              <DialogDescription>
                Review and reconcile this payout record with payment provider data
              </DialogDescription>
            </DialogHeader>

            {selectedRecord && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Expected Amount</Label>
                    <p className="text-lg font-bold">{formatUSD(selectedRecord.expectedAmount)}</p>
                  </div>
                  <div>
                    <Label>Actual Amount</Label>
                    <p className="text-lg font-bold">{formatUSD(selectedRecord.actualAmount)}</p>
                  </div>
                  <div>
                    <Label>Discrepancy</Label>
                    <p
                      className={`text-lg font-bold ${
                        selectedRecord.discrepancy === 0
                          ? "text-green-600"
                          : selectedRecord.discrepancy > 0
                            ? "text-red-600"
                            : "text-amber-600"
                      }`}
                    >
                      {selectedRecord.discrepancy > 0 ? "+" : ""}
                      {formatUSD(selectedRecord.discrepancy)}
                    </p>
                  </div>
                  <div>
                    <Label>Provider Reference</Label>
                    <p className="font-mono text-sm">{selectedRecord.providerReference}</p>
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add reconciliation notes..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReconcile} disabled={isReconciling}>
                {isReconciling ? "Reconciling..." : "Mark as Reconciled"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}



