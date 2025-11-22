"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Mail, Download, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"
import { format } from "date-fns"

interface EmailLog {
  id: number
  recipient_email: string
  recipient_name: string | null
  subject: string
  email_type: string
  status: "sent" | "failed" | "pending"
  message_id: string | null
  error_message: string | null
  sent_at: string
  delivered_at: string | null
  opened_at: string | null
  metadata: Record<string, any>
}

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    vendor: "",
    type: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  })

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.vendor) params.append("vendor", filters.vendor)
      if (filters.type) params.append("type", filters.type)
      if (filters.status) params.append("status", filters.status)
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom)
      if (filters.dateTo) params.append("dateTo", filters.dateTo)

      const response = await fetch(`/api/admin/payouts/email-logs?${params}`)
      if (!response.ok) throw new Error("Failed to fetch email logs")
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load email logs")
    } finally {
      setLoading(false)
    }
  }

  const resendEmail = async (logId: number) => {
    try {
      const response = await fetch(`/api/admin/payouts/email-logs/${logId}/resend`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to resend email")
      }

      toast.success("Email queued for resending")
      fetchLogs()
    } catch (error: any) {
      toast.error(error.message || "Failed to resend email")
    }
  }

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/admin/payouts/email-logs/export?${params}`)
      if (!response.ok) throw new Error("Failed to export logs")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `email-logs-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Email logs exported")
    } catch (error: any) {
      toast.error(error.message || "Failed to export logs")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Logs</h1>
          <p className="text-muted-foreground mt-1">
            View and manage email delivery status
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Vendor name"
              value={filters.vendor}
              onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
            />
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Email type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="payout_processed">Payout Processed</SelectItem>
                <SelectItem value="payout_failed">Payout Failed</SelectItem>
                <SelectItem value="payout_pending">Payout Pending</SelectItem>
                <SelectItem value="refund_deduction">Refund Deduction</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            <Input
              type="date"
              placeholder="To date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email History</CardTitle>
          <CardDescription>{logs.length} emails found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No emails found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.sent_at), "PPp")}</TableCell>
                      <TableCell>{log.recipient_email}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.email_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        {log.delivered_at ? (
                          <span className="text-green-600">
                            {format(new Date(log.delivered_at), "PPp")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.status === "failed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resendEmail(log.id)}
                          >
                            Resend
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

