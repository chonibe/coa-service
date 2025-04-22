"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Settings,
  Tag,
  Trash2,
  Wifi,
  Clipboard,
} from "lucide-react"
import Link from "next/link"
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
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

export default function NFCManagementPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nfcTags, setNfcTags] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("created_at")
  const [sortDirection, setSortDirection] = useState("desc")
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isBulkCreateDialogOpen, setIsBulkCreateDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Form states
  const [newTagId, setNewTagId] = useState("")
  const [newTagNotes, setNewTagNotes] = useState("")
  const [bulkCreateMethod, setBulkCreateMethod] = useState("list")
  const [bulkTagIds, setBulkTagIds] = useState("")
  const [bulkPrefix, setBulkPrefix] = useState("TAG")
  const [bulkStartNumber, setBulkStartNumber] = useState("1")
  const [bulkCount, setBulkCount] = useState("10")
  const [selectedTagId, setSelectedTagId] = useState("")
  const [selectedLineItemId, setSelectedLineItemId] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("unassigned")
  const [statusNotes, setStatusNotes] = useState("")
  const [programmingData, setProgrammingData] = useState<any>(null)

  useEffect(() => {
    fetchNfcTags()
  }, [currentPage, pageSize, activeTab, sortField, sortDirection])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNfcTags()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchNfcTags = async () => {
    try {
      setIsLoading(true)
      setError(null)

      let url = `/api/nfc-tags/list?page=${currentPage}&pageSize=${pageSize}&sortField=${sortField}&sortDirection=${sortDirection}`

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }

      if (activeTab !== "all") {
        url += `&status=${activeTab}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch NFC tags`)
      }

      const data = await response.json()

      setNfcTags(data.nfcTags || [])
      setTotalCount(data.totalCount || 0)
    } catch (err: any) {
      console.error("Error fetching NFC tags:", err)
      setError(err.message || "Failed to fetch NFC tags")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagId) {
      setError("Tag ID is required")
      return
    }

    try {
      setIsActionLoading(true)
      setError(null)

      const response = await fetch("/api/nfc-tags/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tagId: newTagId,
          notes: newTagNotes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}`)
      }

      const data = await response.json()

      setActionSuccess(`NFC tag ${newTagId} created successfully`)
      setIsCreateDialogOpen(false)
      setNewTagId("")
      setNewTagNotes("")
      fetchNfcTags()
    } catch (err: any) {
      console.error("Error creating NFC tag:", err)
      setError(err.message || "Failed to create NFC tag")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleBulkCreateTags = async () => {
    try {
      setIsActionLoading(true)
      setError(null)

      let requestBody: any = {}

      if (bulkCreateMethod === "list") {
        const tagIds = bulkTagIds
          .split(/[\s,]+/)
          .map((tag) => tag.trim())
          .filter((tag) => tag !== "")

        requestBody = {
          tagIds,
        }
      } else {
        requestBody = {
          prefix: bulkPrefix,
          startNumber: bulkStartNumber,
          count: bulkCount,
        }
      }

      const response = await fetch("/api/nfc-tags/bulk-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}`)
      }

      const data = await response.json()

      setActionSuccess(
        `${data.createdCount} NFC tags created successfully. ${data.skippedCount} tags skipped (already exist).`,
      )
      setIsBulkCreateDialogOpen(false)
      setBulkTagIds("")
      setBulkPrefix("TAG")
      setBulkStartNumber("1")
      setBulkCount("10")
      fetchNfcTags()
    } catch (err: any) {
      console.error("Error creating NFC tags:", err)
      setError(err.message || "Failed to create NFC tags")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleAssignTag = async () => {
    if (!selectedTagId || !selectedLineItemId || !selectedOrderId) {
      setError("Tag ID, Line Item ID, and Order ID are required")
      return
    }

    try {
      setIsActionLoading(true)
      setError(null)

      const response = await fetch("/api/nfc-tags/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tagId: selectedTagId,
          lineItemId: selectedLineItemId,
          orderId: selectedOrderId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}`)
      }

      const data = await response.json()

      setActionSuccess(`NFC tag ${selectedTagId} assigned successfully`)
      setIsAssignDialogOpen(false)
      setSelectedTagId("")
      setSelectedLineItemId("")
      setSelectedOrderId("")
      fetchNfcTags()
    } catch (err: any) {
      console.error("Error assigning NFC tag:", err)
      setError(err.message || "Failed to assign NFC tag")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedTagId || !selectedStatus) {
      setError("Tag ID and status are required")
      return
    }

    try {
      setIsActionLoading(true)
      setError(null)

      const response = await fetch("/api/nfc-tags/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tagId: selectedTagId,
          status: selectedStatus,
          notes: statusNotes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}`)
      }

      const data = await response.json()

      setActionSuccess(`NFC tag ${selectedTagId} status updated to ${selectedStatus}`)
      setIsStatusDialogOpen(false)
      setSelectedTagId("")
      setSelectedStatus("unassigned")
      setStatusNotes("")
      fetchNfcTags()
    } catch (err: any) {
      console.error("Error updating NFC tag status:", err)
      setError(err.message || "Failed to update NFC tag status")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteTag = async () => {
    if (!selectedTagId) {
      setError("Tag ID is required")
      return
    }

    try {
      setIsActionLoading(true)
      setError(null)

      const response = await fetch("/api/nfc-tags/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tagId: selectedTagId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}`)
      }

      const data = await response.json()

      setActionSuccess(`NFC tag ${selectedTagId} deleted successfully`)
      setIsDeleteDialogOpen(false)
      setSelectedTagId("")
      fetchNfcTags()
    } catch (err: any) {
      console.error("Error deleting NFC tag:", err)
      setError(err.message || "Failed to delete NFC tag")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleGetProgrammingData = async () => {
    if (!selectedTagId) {
      setError("Tag ID is required")
      return
    }

    try {
      setIsActionLoading(true)
      setError(null)

      const response = await fetch(`/api/nfc-tags/get-programming-data?tagId=${encodeURIComponent(selectedTagId)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}`)
      }

      const data = await response.json()

      setProgrammingData(data.programmingData)
    } catch (err: any) {
      console.error("Error getting programming data:", err)
      setError(err.message || "Failed to get programming data")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleMarkAsProgrammed = async () => {
    if (!selectedTagId) {
      setError("Tag ID is required")
      return
    }

    try {
      setIsActionLoading(true)
      setError(null)

      const response = await fetch("/api/nfc-tags/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tagId: selectedTagId,
          status: "programmed",
          notes: "Marked as programmed via NFC management interface",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}`)
      }

      const data = await response.json()

      setActionSuccess(`NFC tag ${selectedTagId} marked as programmed`)
      setIsProgramDialogOpen(false)
      setSelectedTagId("")
      setProgrammingData(null)
      fetchNfcTags()
    } catch (err: any) {
      console.error("Error marking NFC tag as programmed:", err)
      setError(err.message || "Failed to mark NFC tag as programmed")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleExportTags = () => {
    // Create CSV content
    const headers = [
      "Tag ID",
      "Line Item ID",
      "Order ID",
      "Certificate URL",
      "Status",
      "Notes",
      "Created At",
      "Updated At",
      "Programmed At",
    ]

    const rows = nfcTags.map((tag) => [
      tag.tag_id,
      tag.line_item_id || "",
      tag.order_id || "",
      tag.certificate_url || "",
      tag.status,
      tag.notes || "",
      tag.created_at,
      tag.updated_at,
      tag.programmed_at || "",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `nfc-tags-export-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateQRCode = (url: string) => {
    // In a real implementation, you would generate a QR code image
    // For now, we'll just return a placeholder URL
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unassigned":
        return <Badge variant="outline">Unassigned</Badge>
      case "assigned":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Assigned
          </Badge>
        )
      case "programmed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Programmed
          </Badge>
        )
      case "deployed":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            Deployed
          </Badge>
        )
      case "lost":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Lost
          </Badge>
        )
      case "damaged":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            Damaged
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div>
          <Link href="/admin/certificates" className="flex items-center text-sm mb-2 hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Certificates
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">NFC Tag Management</h1>
          <p className="text-muted-foreground mt-2">Manage NFC tags for certificate URLs</p>
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
            <CardTitle>NFC Tag Management</CardTitle>
            <CardDescription>Create, assign, and program NFC tags for certificate URLs</CardDescription>
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6 mb-4">
                <TabsTrigger value="all">All Tags</TabsTrigger>
                <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
                <TabsTrigger value="assigned">Assigned</TabsTrigger>
                <TabsTrigger value="programmed">Programmed</TabsTrigger>
                <TabsTrigger value="deployed">Deployed</TabsTrigger>
                <TabsTrigger value="damaged">Damaged/Lost</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : nfcTags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No NFC tags found matching your criteria</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag ID</TableHead>
                      <TableHead>Certificate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Programmed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nfcTags.map((tag) => (
                      <TableRow key={tag.tag_id}>
                        <TableCell className="font-medium">{tag.tag_id}</TableCell>
                        <TableCell>
                          {tag.certificate_url ? (
                            <div className="flex flex-col">
                              <div className="truncate max-w-[200px] text-primary">
                                <a href={tag.certificate_url} target="_blank" rel="noopener noreferrer">
                                  {tag.certificate_url}
                                </a>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {tag.line_item_id ? `Line Item: ${tag.line_item_id}` : "No line item assigned"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(tag.status)}</TableCell>
                        <TableCell>{formatDate(tag.created_at)}</TableCell>
                        <TableCell>{tag.programmed_at ? formatDate(tag.programmed_at) : "Not programmed"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {tag.status === "unassigned" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTagId(tag.tag_id)
                                    setIsAssignDialogOpen(true)
                                  }}
                                >
                                  <Tag className="h-4 w-4 mr-2" />
                                  Assign to Certificate
                                </DropdownMenuItem>
                              )}
                              {tag.status === "assigned" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTagId(tag.tag_id)
                                    setIsProgramDialogOpen(true)
                                    handleGetProgrammingData()
                                  }}
                                >
                                  <Wifi className="h-4 w-4 mr-2" />
                                  Program NFC Tag
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTagId(tag.tag_id)
                                  setSelectedStatus(tag.status)
                                  setStatusNotes(tag.notes || "")
                                  setIsStatusDialogOpen(true)
                                }}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTagId(tag.tag_id)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Tag
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Create Tag Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create NFC Tag</DialogTitle>
            <DialogDescription>
              Add a new NFC tag to the system. You can assign it to a certificate later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tag-id">Tag ID</Label>
                <Input
                  id="tag-id"
                  placeholder="Enter tag ID"
                  value={newTagId}
                  onChange={(e) => setNewTagId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-notes">Notes (Optional)</Label>
                <Textarea
                  id="tag-notes"
                  placeholder="Enter notes about this tag"
                  value={newTagNotes}
                  onChange={(e) => setNewTagNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateTag} disabled={isActionLoading}>
              {isActionLoading ? "Creating..." : "Create Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={isBulkCreateDialogOpen} onOpenChange={setIsBulkCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Create NFC Tags</DialogTitle>
            <DialogDescription>Add multiple NFC tags to the system at once.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Label>Creation Method</Label>
                <Select value={bulkCreateMethod} onValueChange={setBulkCreateMethod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">List of Tag IDs</SelectItem>
                    <SelectItem value="sequence">Sequential Tags</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bulkCreateMethod === "list" ? (
                <div className="space-y-2">
                  <Label htmlFor="bulk-tag-ids">Tag IDs</Label>
                  <Textarea
                    id="bulk-tag-ids"
                    placeholder="Enter tag IDs, separated by commas, spaces, or new lines"
                    value={bulkTagIds}
                    onChange={(e) => setBulkTagIds(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter multiple tag IDs separated by commas, spaces, or new lines.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-prefix">Prefix</Label>
                    <Input
                      id="bulk-prefix"
                      placeholder="Enter prefix"
                      value={bulkPrefix}
                      onChange={(e) => setBulkPrefix(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">The prefix for all generated tag IDs (e.g., "TAG").</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bulk-start-number">Start Number</Label>
                      <Input
                        id="bulk-start-number"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={bulkStartNumber}
                        onChange={(e) => setBulkStartNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bulk-count">Count</Label>
                      <Input
                        id="bulk-count"
                        type="number"
                        min="1"
                        max="1000"
                        placeholder="10"
                        value={bulkCount}
                        onChange={(e) => setBulkCount(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will generate tags like {bulkPrefix}-{bulkStartNumber}, {bulkPrefix}-
                    {Number.parseInt(bulkStartNumber) + 1}, etc.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkCreateDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleBulkCreateTags} disabled={isActionLoading}>
              {isActionLoading ? "Creating..." : "Create Tags"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Tag Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign NFC Tag to Certificate</DialogTitle>
            <DialogDescription>
              Link this NFC tag to a certificate by providing the line item ID and order ID.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assign-tag-id">Tag ID</Label>
                <Input
                  id="assign-tag-id"
                  placeholder="Enter tag ID"
                  value={selectedTagId}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                  disabled={!!selectedTagId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-line-item-id">Line Item ID</Label>
                <Input
                  id="assign-line-item-id"
                  placeholder="Enter line item ID"
                  value={selectedLineItemId}
                  onChange={(e) => setSelectedLineItemId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The line item ID from the order that contains the certificate.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-order-id">Order ID</Label>
                <Input
                  id="assign-order-id"
                  placeholder="Enter order ID"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">The order ID that contains the line item.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleAssignTag} disabled={isActionLoading}>
              {isActionLoading ? "Assigning..." : "Assign Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update NFC Tag Status</DialogTitle>
            <DialogDescription>Change the status of this NFC tag and add optional notes.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status-tag-id">Tag ID</Label>
                <Input
                  id="status-tag-id"
                  placeholder="Enter tag ID"
                  value={selectedTagId}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                  disabled={!!selectedTagId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-select">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="status-select">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="programmed">Programmed</SelectItem>
                    <SelectItem value="deployed">Deployed</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-notes">Notes (Optional)</Label>
                <Textarea
                  id="status-notes"
                  placeholder="Enter notes about this status change"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isActionLoading}>
              {isActionLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete NFC Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this NFC tag? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-tag-id">Tag ID</Label>
              <Input id="delete-tag-id" value={selectedTagId} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleDeleteTag} disabled={isActionLoading} variant="destructive">
              {isActionLoading ? "Deleting..." : "Delete Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Program Tag Dialog */}
      <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Program NFC Tag</DialogTitle>
            <DialogDescription>
              Use this information to program your NFC tag with the certificate URL.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isActionLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : programmingData ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Tag ID</Label>
                  <div className="p-2 bg-muted rounded-md font-mono text-sm">{programmingData.tagId}</div>
                </div>

                <div className="space-y-2">
                  <Label>Certificate URL</Label>
                  <div className="p-2 bg-muted rounded-md font-mono text-sm break-all">{programmingData.url}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(programmingData.url)
                      setActionSuccess("URL copied to clipboard")
                    }}
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>QR Code</Label>
                  <div className="flex justify-center p-4 bg-white rounded-md">
                    <img
                      src={generateQRCode(programmingData.url) || "/placeholder.svg"}
                      alt="QR Code"
                      className="w-40 h-40"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Scan this QR code to test the certificate URL
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>NFC Programming Instructions</Label>
                  <div className="text-sm space-y-2">
                    <p>1. Open your NFC programming app on your smartphone</p>
                    <p>2. Select "Write URL" or "Write Web Link" option</p>
                    <p>3. Enter or paste the certificate URL shown above</p>
                    <p>4. Place the NFC tag near your phone and write the data</p>
                    <p>5. Test the tag by scanning it with your phone</p>
                    <p>6. Mark the tag as programmed when complete</p>
                  </div>
                </div>

                {programmingData.certificateInfo && (
                  <div className="space-y-2">
                    <Label>Certificate Information</Label>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      <p>
                        Edition: #{programmingData.certificateInfo.editionNumber} of{" "}
                        {programmingData.certificateInfo.editionTotal}
                      </p>
                      <p>Status: {programmingData.certificateInfo.status}</p>
                      <p>Created: {formatDate(programmingData.certificateInfo.createdAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No programming data available for this tag</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProgramDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            {programmingData && (
              <Button onClick={handleMarkAsProgrammed} disabled={isActionLoading}>
                {isActionLoading ? "Updating..." : "Mark as Programmed"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
