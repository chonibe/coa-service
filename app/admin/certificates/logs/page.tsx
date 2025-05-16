"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertCircle,
  Search,
  RefreshCw,
  ArrowLeft,
  Download,
  Calendar,
  Layers,
  BadgeIcon as Certificate,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CertificateLogsPage() {
  const [mounted, setMounted] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lineItemId, setLineItemId] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [totalPages, setTotalPages] = useState(1)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchLogs()
    }
  }, [currentPage, pageSize, mounted])

  // Don't render anything until mounted
  if (!mounted) {
    return null
  }

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build the URL with query parameters
      let url = `/api/certificate/access-logs?page=${currentPage}&limit=${pageSize}`
      if (lineItemId) {
        url += `&lineItemId=${lineItemId}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch logs`)
      }

      const data = await response.json()

      setLogs(data.logs || [])
      setTotalLogs(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err: any) {
      console.error("Error fetching logs:", err)
      setError(err.message || "Failed to fetch certificate access logs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page
    fetchLogs()
  }

  const exportLogsToCsv = () => {
    // Create CSV content
    const headers = ["ID", "Line Item ID", "Order ID", "Product ID", "Accessed At", "IP Address", "User Agent"]

    const rows = logs.map((log) => [
      log.id,
      log.line_item_id,
      log.order_id,
      log.product_id,
      log.accessed_at,
      log.ip_address,
      log.user_agent,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell || ""}"`).join(","))].join(
      "\n",
    )

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `certificate-access-logs-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div>
          <Link href="/admin/certificates" className="flex items-center text-sm mb-2 hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Certificates
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Access Logs</h1>
          <p className="text-muted-foreground mt-2">Track when and how certificates are accessed</p>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" asChild>
              <Link href="/admin">
                <Layers className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates">
                <Certificate className="mr-2 h-4 w-4" />
                Certificates
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates/management">
                <Settings className="mr-2 h-4 w-4" />
                Certificate Management
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates/bulk">
                <Download className="mr-2 h-4 w-4" />
                Bulk Generation
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
            <CardDescription>Filter access logs by line item ID</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Filter by Line Item ID..."
                    value={lineItemId}
                    onChange={(e) => setLineItemId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleSearch} disabled={isLoading}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLineItemId("")
                      setCurrentPage(1)
                      fetchLogs()
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <div className="flex-1">
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number.parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Items per page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                      <SelectItem value="200">200 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={exportLogsToCsv}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Logs</CardTitle>
            <CardDescription>
              Showing {logs.length} of {totalLogs} access logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No access logs found matching your criteria</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Line Item ID</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Product ID</TableHead>
                      <TableHead>Accessed At</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>User Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{log.line_item_id}</div>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                            <Link
                              href={`/admin/certificates/management?searchQuery=${log.line_item_id}&searchField=line_item_id`}
                            >
                              View Certificate
                            </Link>
                          </Button>
                        </TableCell>
                        <TableCell>{log.order_id}</TableCell>
                        <TableCell>{log.product_id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                            {formatDate(log.accessed_at)}
                          </div>
                        </TableCell>
                        <TableCell>{log.ip_address}</TableCell>
                        <TableCell>
                          <div className="truncate max-w-[300px] text-xs text-muted-foreground">{log.user_agent}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper components for pagination
function ChevronLeft(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRight(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
