"use client"

import { CardFooter } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Settings,
  Layers,
  BadgeIcon as Certificate,
  Download,
  Clock,
  Search,
} from "lucide-react"
import Link from "next/link"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clipboard, Check, ArrowUpDown, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"

export default function CertificateManagementPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // State for certificates data
  const [certificates, setCertificates] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)

  // State for pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // State for filtering
  const [productFilter, setProductFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<any[]>([])

  // State for sorting
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<string>("desc")

  // State for dialogs
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // State for copy to clipboard
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // State for bulk operations
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isBulkRegenerateDialogOpen, setIsBulkRegenerateDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isBulkGenerateDialogOpen, setIsBulkGenerateDialogOpen] = useState(false)
  const [bulkOperationProgress, setBulkOperationProgress] = useState(0)
  const [bulkOperationTotal, setBulkOperationTotal] = useState(0)
  const [bulkOperationCurrent, setBulkOperationCurrent] = useState(0)
  const [bulkOperationStatus, setBulkOperationStatus] = useState("")

  useEffect(() => {
    // Check if Supabase is configured
    const checkConfig = async () => {
      try {
        setIsLoading(true)
        const configured = isSupabaseConfigured()
        setIsConfigured(configured)

        if (!configured) {
          setError("Supabase configuration is missing. Please check your environment variables.")
        }
      } catch (err: any) {
        console.error("Error checking configuration:", err)
        setError(err.message || "An error occurred while checking configuration")
        setIsConfigured(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkConfig()
  }, [])

  // Load certificates on initial render and when filters change
  useEffect(() => {
    if (isConfigured) {
      fetchCertificates()
      fetchProducts()
    }
  }, [page, pageSize, productFilter, statusFilter, sortField, sortDirection, isConfigured])

  // Apply search filter with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isConfigured) {
        fetchCertificates()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, isConfigured])

  // Fetch certificates from the database
  const fetchCertificates = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Call our API endpoint instead of direct Supabase access
      const response = await fetch(
        `/api/certificates/list?page=${page}&pageSize=${pageSize}&productId=${
          productFilter !== "all" ? productFilter : ""
        }&status=${statusFilter !== "all" ? statusFilter : ""}&search=${searchTerm}&sortField=${sortField}&sortDirection=${sortDirection}`,
      )

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 504) {
          throw new Error("Request timed out. Please try again with fewer items or more specific filters.")
        }
        throw new Error(errorData.message || `Failed to fetch certificates: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch certificates")
      }

      setCertificates(data.certificates || [])
      setTotalCount(data.totalCount || 0)
    } catch (err: any) {
      console.error("Error fetching certificates:", err)
      setError(err.message || "Failed to fetch certificates")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch products for the filter dropdown
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products/list")

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch products")
      }

      setProducts(data.products || [])
    } catch (err: any) {
      console.error("Error fetching products:", err)
      // Don't set error state here to avoid blocking the main functionality
    }
  }

  // Handle search
  const handleSearch = () => {
    setPage(1) // Reset to first page
    fetchCertificates()
  }

  // Handle regenerating a certificate
  const handleRegenerateCertificate = async () => {
    if (!selectedCertificate) return

    try {
      setIsActionLoading(true)

      const response = await fetch("/api/certificate/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lineItemId: selectedCertificate.line_item_id }),
      })

      if (!response.ok) {
        throw new Error("Failed to regenerate certificate")
      }

      const data = await response.json()

      setActionSuccess(`Certificate regenerated successfully. New URL: ${data.certificateUrl}`)
      fetchCertificates()
    } catch (err: any) {
      setError(err.message || "Failed to regenerate certificate")
    } finally {
      setIsActionLoading(false)
      setIsRegenerateDialogOpen(false)
    }
  }

  // Handle deleting a certificate
  const handleDeleteCertificate = async () => {
    if (!selectedCertificate) return

    try {
      setIsActionLoading(true)

      const response = await fetch("/api/certificate/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineItemId: selectedCertificate.line_item_id,
          orderId: selectedCertificate.order_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete certificate")
      }

      setActionSuccess("Certificate deleted successfully")
      fetchCertificates()
    } catch (err: any) {
      setError(err.message || "Failed to delete certificate")
    } finally {
      setIsActionLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  // Handle bulk regenerating certificates
  const handleBulkRegenerateCertificates = async () => {
    if (selectedItems.size === 0) return

    try {
      setIsActionLoading(true)
      setBulkOperationProgress(0)
      setBulkOperationTotal(selectedItems.size)
      setBulkOperationCurrent(0)
      setBulkOperationStatus("Preparing to regenerate certificates...")

      // Convert selected items to array of objects with lineItemId and orderId
      const selectedItemsArray = Array.from(selectedItems).map((key) => {
        const [orderId, lineItemId] = key.split("-")
        return { lineItemId, orderId }
      })

      let successCount = 0
      let failCount = 0

      // Process each item
      for (let i = 0; i < selectedItemsArray.length; i++) {
        const item = selectedItemsArray[i]
        setBulkOperationCurrent(i + 1)
        setBulkOperationStatus(`Regenerating certificate ${i + 1} of ${selectedItemsArray.length}...`)
        setBulkOperationProgress(Math.round(((i + 1) / selectedItemsArray.length) * 100))

        try {
          const response = await fetch("/api/certificate/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ lineItemId: item.lineItemId }),
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          failCount++
          console.error(`Error regenerating certificate for ${item.lineItemId}:`, error)
        }

        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      setActionSuccess(
        `Bulk operation complete. Successfully regenerated ${successCount} certificates. Failed: ${failCount}`,
      )
      fetchCertificates()
      setSelectedItems(new Set())
    } catch (err: any) {
      setError(err.message || "Failed to regenerate certificates")
    } finally {
      setIsActionLoading(false)
      setIsBulkRegenerateDialogOpen(false)
    }
  }

  // Handle bulk deleting certificates
  const handleBulkDeleteCertificates = async () => {
    if (selectedItems.size === 0) return

    try {
      setIsActionLoading(true)
      setBulkOperationProgress(0)
      setBulkOperationTotal(selectedItems.size)
      setBulkOperationCurrent(0)
      setBulkOperationStatus("Preparing to delete certificates...")

      // Convert selected items to array of objects with lineItemId and orderId
      const selectedItemsArray = Array.from(selectedItems).map((key) => {
        const [orderId, lineItemId] = key.split("-")
        return { lineItemId, orderId }
      })

      let successCount = 0
      let failCount = 0

      // Process each item
      for (let i = 0; i < selectedItemsArray.length; i++) {
        const item = selectedItemsArray[i]
        setBulkOperationCurrent(i + 1)
        setBulkOperationStatus(`Deleting certificate ${i + 1} of ${selectedItemsArray.length}...`)
        setBulkOperationProgress(Math.round(((i + 1) / selectedItemsArray.length) * 100))

        try {
          const response = await fetch("/api/certificate/delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lineItemId: item.lineItemId,
              orderId: item.orderId,
            }),
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          failCount++
          console.error(`Error deleting certificate for ${item.lineItemId}:`, error)
        }

        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      setActionSuccess(
        `Bulk operation complete. Successfully deleted ${successCount} certificates. Failed: ${failCount}`,
      )
      fetchCertificates()
      setSelectedItems(new Set())
    } catch (err: any) {
      setError(err.message || "Failed to delete certificates")
    } finally {
      setIsActionLoading(false)
      setIsBulkDeleteDialogOpen(false)
    }
  }

  // Handle bulk generating certificates
  const handleBulkGenerateCertificates = async () => {
    if (selectedItems.size === 0) return

    try {
      setIsActionLoading(true)
      setBulkOperationProgress(0)
      setBulkOperationTotal(selectedItems.size)
      setBulkOperationCurrent(0)
      setBulkOperationStatus("Preparing to generate certificates...")

      // Convert selected items to array of objects with lineItemId and orderId
      const selectedItemsArray = Array.from(selectedItems).map((key) => {
        const [orderId, lineItemId] = key.split("-")
        return { lineItemId, orderId }
      })

      let successCount = 0
      let failCount = 0

      // Process each item
      for (let i = 0; i < selectedItemsArray.length; i++) {
        const item = selectedItemsArray[i]
        setBulkOperationCurrent(i + 1)
        setBulkOperationStatus(`Generating certificate ${i + 1} of ${selectedItemsArray.length}...`)
        setBulkOperationProgress(Math.round(((i + 1) / selectedItemsArray.length) * 100))

        try {
          const response = await fetch("/api/certificate/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ lineItemId: item.lineItemId }),
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          failCount++
          console.error(`Error generating certificate for ${item.lineItemId}:`, error)
        }

        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      setActionSuccess(
        `Bulk operation complete. Successfully generated ${successCount} certificates. Failed: ${failCount}`,
      )
      fetchCertificates()
      setSelectedItems(new Set())
    } catch (err: any) {
      setError(err.message || "Failed to generate certificates")
    } finally {
      setIsActionLoading(false)
      setIsBulkGenerateDialogOpen(false)
    }
  }

  // Handle copying certificate URL to clipboard
  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle sorting
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to ascending
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle exporting certificates as CSV
  const handleExportCsv = async () => {
    try {
      // Fetch all certificates with current filters but no pagination
      const response = await fetch(
        `/api/certificates/export?productId=${productFilter !== "all" ? productFilter : ""}&status=${statusFilter !== "all" ? statusFilter : ""}&search=${searchTerm}&sortField=${sortField}&sortDirection=${sortDirection}`,
      )

      if (!response.ok) {
        throw new Error(`Failed to export certificates: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to export certificates")
      }

      // Create CSV content
      const headers = [
        "Line Item ID",
        "Order ID",
        "Order Name",
        "Product ID",
        "Edition Number",
        "Edition Total",
        "Status",
        "Certificate URL",
        "Certificate Generated At",
      ]

      const rows = data.certificates.map((cert: any) => [
        cert.line_item_id,
        cert.order_id,
        cert.order_name,
        cert.product_id,
        cert.edition_number,
        cert.edition_total,
        cert.status,
        cert.certificate_url,
        cert.certificate_generated_at,
      ])

      const csvContent = [
        headers.join(","),
        ...rows.map((row: any) => row.map((cell: any) => `"${cell || ""}"`).join(",")),
      ].join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `certificates-export-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: any) {
      setError(err.message || "Failed to export certificates")
    }
  }

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  // Toggle selection of a single item
  const toggleItemSelection = (cert: any) => {
    const key = `${cert.order_id}-${cert.line_item_id}`
    const newSelectedItems = new Set(selectedItems)

    if (newSelectedItems.has(key)) {
      newSelectedItems.delete(key)
    } else {
      newSelectedItems.add(key)
    }

    setSelectedItems(newSelectedItems)
  }

  // Toggle selection of all items
  const toggleSelectAll = () => {
    if (selectedItems.size > 0) {
      // If any are selected, clear selection
      setSelectedItems(new Set())
    } else {
      // Otherwise select all visible items
      const newSelectedItems = new Set<string>()
      certificates.forEach((cert) => {
        const key = `${cert.order_id}-${cert.line_item_id}`
        newSelectedItems.add(key)
      })
      setSelectedItems(newSelectedItems)
    }
  }

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize)

  if (isLoading && certificates.length === 0) {
    return (
      <div className="container mx-auto py-10 max-w-7xl">
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading certificate management...</p>
        </div>
      </div>
    )
  }

  if (!isConfigured || error) {
    return (
      <div className="container mx-auto py-10 max-w-7xl">
        <div>
          <Link href="/admin/certificates" className="flex items-center text-sm mb-2 hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Certificates
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Management</h1>
          <p className="text-muted-foreground mt-2">View and manage all certificate URLs</p>
        </div>

        <div className="mt-8">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              {error || "There was an error connecting to the database. Please check your configuration."}
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Database Configuration Required</CardTitle>
              <CardDescription>
                The certificate management system requires a properly configured Supabase database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The application is unable to connect to the Supabase database. This is likely because the environment
                variables are not properly configured. Please check the following:
              </p>

              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">Required Environment Variables:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <code>NEXT_PUBLIC_SUPABASE_URL</code> - Your Supabase project URL
                  </li>
                  <li>
                    <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> - Your Supabase anonymous key
                  </li>
                  <li>
                    <code>SUPABASE_SERVICE_ROLE_KEY</code> - Your Supabase service role key
                  </li>
                </ul>
              </div>

              <p>You can find these values in your Supabase project dashboard under Project Settings &gt; API.</p>

              <div className="flex justify-end space-x-4 mt-4">
                <Button asChild variant="outline">
                  <Link href="/admin/test-connections">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Test Connections
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Go to Settings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div>
          <Link href="/admin/certificates" className="flex items-center text-sm mb-2 hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Certificates
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Management</h1>
          <p className="text-muted-foreground mt-2">View and manage all certificate URLs</p>

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
              <Link href="/admin/certificates/bulk">
                <Download className="mr-2 h-4 w-4" />
                Bulk Generation
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/certificates/logs">
                <Clock className="mr-2 h-4 w-4" />
                Access Logs
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

        {actionSuccess && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{actionSuccess}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Certificate Filters</CardTitle>
            <CardDescription>Filter and search certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by order or line item ID..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="product-filter">Product</Label>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger id="product-filter">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="removed">Removed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setProductFilter("all")
                    setStatusFilter("all")
                    setSortField("created_at")
                    setSortDirection("desc")
                    setPage(1)
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {certificates.length} of {totalCount} certificates
            </div>
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certificates</CardTitle>
            <CardDescription>Manage certificate URLs for all editions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No certificates found matching your filters.</div>
            ) : (
              <>
                {/* Bulk Actions */}
                {selectedItems.size > 0 && (
                  <div className="mb-4 p-4 bg-muted rounded-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="font-medium">{selectedItems.size}</span> items selected
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setIsBulkGenerateDialogOpen(true)}>
                          Generate URLs
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsBulkRegenerateDialogOpen(true)}>
                          Regenerate URLs
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setIsBulkDeleteDialogOpen(true)}>
                          Delete URLs
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={selectedItems.size > 0 && selectedItems.size === certificates.length}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="w-[80px]">
                          <Button
                            variant="ghost"
                            className="p-0 h-8 font-medium"
                            onClick={() => handleSort("edition_number")}
                          >
                            Edition #
                            <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="p-0 h-8 font-medium"
                            onClick={() => handleSort("order_name")}
                          >
                            Order
                            <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>
                          <Button variant="ghost" className="p-0 h-8 font-medium" onClick={() => handleSort("status")}>
                            Status
                            <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Certificate URL</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="p-0 h-8 font-medium"
                            onClick={() => handleSort("certificate_generated_at")}
                          >
                            Generated At
                            <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificates.map((cert) => (
                        <TableRow key={`${cert.order_id}-${cert.line_item_id}`}>
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.has(`${cert.order_id}-${cert.line_item_id}`)}
                              onCheckedChange={() => toggleItemSelection(cert)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {cert.edition_number !== null ? (
                              <span>
                                #{cert.edition_number}
                                {cert.edition_total && (
                                  <span className="text-muted-foreground">/{cert.edition_total}</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{cert.order_name || `Order ${cert.order_id}`}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                              ID: {cert.line_item_id}
                            </div>
                          </TableCell>
                          <TableCell>
                            {products.find((p) => p.id === cert.product_id)?.title || cert.product_id}
                          </TableCell>
                          <TableCell>
                            {cert.status === "active" ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200">
                                Removed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {cert.certificate_url ? (
                              <div className="flex items-center space-x-2">
                                <div className="truncate max-w-[200px] text-primary">{cert.certificate_url}</div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleCopyUrl(cert.certificate_url, cert.line_item_id)}
                                >
                                  {copiedId === cert.line_item_id ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Clipboard className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not generated</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(cert.certificate_generated_at)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Certificate Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {cert.certificate_url && (
                                  <>
                                  <DropdownMenuItem onClick={() => window.open(cert.certificate_url, "_blank")}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Certificate
                                  </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => window.open(`/admin/certificates/preview?lineItemId=${cert.line_item_id}`, "_blank")}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Preview Certificate
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCertificate(cert)
                                    setIsRegenerateDialogOpen(true)
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Regenerate URL
                                </DropdownMenuItem>
                                {cert.certificate_url && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedCertificate(cert)
                                      setIsDeleteDialogOpen(true)
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Certificate
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page > 1 ? page - 1 : 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                    disabled={page >= totalPages}
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

      {/* Regenerate Certificate Dialog */}
      <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Certificate</DialogTitle>
            <DialogDescription>
              This will create a new certificate URL and invalidate the old one. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedCertificate && (
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Order:</span> {selectedCertificate.order_name}
                </div>
                <div>
                  <span className="font-medium">Edition:</span> #{selectedCertificate.edition_number}
                  {selectedCertificate.edition_total && `/${selectedCertificate.edition_total}`}
                </div>
                {selectedCertificate.certificate_url && (
                  <div>
                    <span className="font-medium">Current URL:</span> {selectedCertificate.certificate_url}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegenerateDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleRegenerateCertificate} disabled={isActionLoading}>
              {isActionLoading ? "Regenerating..." : "Regenerate Certificate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Certificate Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Certificate</DialogTitle>
            <DialogDescription>
              This will remove the certificate URL. The edition number will be preserved. Are you sure you want to
              continue?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedCertificate && (
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Order:</span> {selectedCertificate.order_name}
                </div>
                <div>
                  <span className="font-medium">Edition:</span> #{selectedCertificate.edition_number}
                  {selectedCertificate.edition_total && `/${selectedCertificate.edition_total}`}
                </div>
                {selectedCertificate.certificate_url && (
                  <div>
                    <span className="font-medium">URL to delete:</span> {selectedCertificate.certificate_url}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleDeleteCertificate} disabled={isActionLoading} variant="destructive">
              {isActionLoading ? "Deleting..." : "Delete Certificate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Regenerate Certificates Dialog */}
      <Dialog open={isBulkRegenerateDialogOpen} onOpenChange={setIsBulkRegenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Regenerate Certificates</DialogTitle>
            <DialogDescription>
              This will create new certificate URLs for {selectedItems.size} selected items and invalidate the old ones.
              Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          {isActionLoading && (
            <div className="py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{bulkOperationStatus}</span>
                  <span>
                    {bulkOperationCurrent} of {bulkOperationTotal}
                  </span>
                </div>
                <Progress value={bulkOperationProgress} className="h-2" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkRegenerateDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleBulkRegenerateCertificates} disabled={isActionLoading}>
              {isActionLoading ? "Regenerating..." : "Regenerate Certificates"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Certificates Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Delete Certificates</DialogTitle>
            <DialogDescription>
              This will remove certificate URLs for {selectedItems.size} selected items. The edition numbers will be
              preserved. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          {isActionLoading && (
            <div className="py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{bulkOperationStatus}</span>
                  <span>
                    {bulkOperationCurrent} of {bulkOperationTotal}
                  </span>
                </div>
                <Progress value={bulkOperationProgress} className="h-2" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleBulkDeleteCertificates} disabled={isActionLoading} variant="destructive">
              {isActionLoading ? "Deleting..." : "Delete Certificates"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Generate Certificates Dialog */}
      <Dialog open={isBulkGenerateDialogOpen} onOpenChange={setIsBulkGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Generate Certificates</DialogTitle>
            <DialogDescription>
              This will generate certificate URLs for {selectedItems.size} selected items that don't already have them.
              Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          {isActionLoading && (
            <div className="py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{bulkOperationStatus}</span>
                  <span>
                    {bulkOperationCurrent} of {bulkOperationTotal}
                  </span>
                </div>
                <Progress value={bulkOperationProgress} className="h-2" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkGenerateDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleBulkGenerateCertificates} disabled={isActionLoading}>
              {isActionLoading ? "Generating..." : "Generate Certificates"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
