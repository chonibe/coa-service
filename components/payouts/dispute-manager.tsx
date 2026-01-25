"use client"

import { useState, useEffect } from "react"









import { AlertCircle, MessageSquare, Plus, Send, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { formatUSD } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Textarea, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input } from "@/components/ui"
interface Dispute {
  id: string
  payoutId: string
  vendorName: string
  amount: number
  reason: string
  status: "open" | "in_review" | "resolved" | "escalated" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  createdAt: string
  updatedAt: string
  createdBy?: string
  assignedTo?: string
  comments: DisputeComment[]
}

interface DisputeComment {
  id: string
  text: string
  author: string
  createdAt: string
  isInternal: boolean
}

interface DisputeManagerProps {
  isAdmin?: boolean
  vendorName?: string
}

export function DisputeManager({ isAdmin = false, vendorName }: DisputeManagerProps) {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [newComment, setNewComment] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const { toast } = useToast()

  const [newDispute, setNewDispute] = useState({
    payoutId: "",
    reason: "",
    priority: "medium" as Dispute["priority"],
  })

  useEffect(() => {
    fetchDisputes()
  }, [vendorName])

  const fetchDisputes = async () => {
    try {
      setIsLoading(true)
      const url = isAdmin
        ? "/api/payouts/disputes"
        : `/api/payouts/disputes?vendorName=${encodeURIComponent(vendorName || "")}`

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch disputes")
      }

      const data = await response.json()
      setDisputes(data.disputes || [])
    } catch (error) {
      console.error("Error fetching disputes:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load disputes",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDispute = async () => {
    try {
      const response = await fetch("/api/payouts/disputes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newDispute,
          vendorName: isAdmin ? undefined : vendorName,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create dispute")
      }

      toast({
        title: "Success",
        description: "Dispute created successfully",
      })

      setIsDialogOpen(false)
      setNewDispute({ payoutId: "", reason: "", priority: "medium" })
      fetchDisputes()
    } catch (error) {
      console.error("Error creating dispute:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create dispute",
      })
    }
  }

  const handleAddComment = async () => {
    if (!selectedDispute || !newComment.trim()) return

    try {
      const response = await fetch(`/api/payouts/disputes/${selectedDispute.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: newComment,
          isInternal,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add comment")
      }

      toast({
        title: "Success",
        description: "Comment added",
      })

      setNewComment("")
      setIsInternal(false)
      fetchDisputes()
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add comment",
      })
    }
  }

  const handleUpdateStatus = async (disputeId: string, newStatus: Dispute["status"]) => {
    try {
      const response = await fetch(`/api/payouts/disputes/${disputeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      toast({
        title: "Success",
        description: "Dispute status updated",
      })

      fetchDisputes()
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      })
    }
  }

  const getStatusBadge = (status: Dispute["status"]) => {
    switch (status) {
      case "open":
        return <Badge variant="outline">Open</Badge>
      case "in_review":
        return <Badge className="bg-blue-500">In Review</Badge>
      case "resolved":
        return <Badge className="bg-green-500">Resolved</Badge>
      case "escalated":
        return <Badge variant="destructive">Escalated</Badge>
      case "closed":
        return <Badge variant="secondary">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: Dispute["priority"]) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>
      case "high":
        return <Badge className="bg-orange-500">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>
      case "low":
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const openDisputes = disputes.filter((d) => d.status === "open" || d.status === "in_review")
  const urgentDisputes = disputes.filter((d) => d.priority === "urgent" && d.status !== "closed")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Dispute Management
            </CardTitle>
            <CardDescription>Track and resolve payout disputes</CardDescription>
          </div>
          <Dialog open={isDialogOpen && !selectedDispute} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Dispute
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Dispute</DialogTitle>
                <DialogDescription>
                  Report an issue with a payout that requires investigation
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label>Payout ID</Label>
                  <Input
                    value={newDispute.payoutId}
                    onChange={(e) => setNewDispute({ ...newDispute, payoutId: e.target.value })}
                    placeholder="Enter payout ID"
                  />
                </div>
                <div>
                  <Label>Reason</Label>
                  <Textarea
                    value={newDispute.reason}
                    onChange={(e) => setNewDispute({ ...newDispute, reason: e.target.value })}
                    placeholder="Describe the issue..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={newDispute.priority}
                    onValueChange={(value) =>
                      setNewDispute({ ...newDispute, priority: value as Dispute["priority"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDispute}>Create Dispute</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Disputes</p>
                  <p className="text-2xl font-bold">{openDisputes.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Urgent</p>
                  <p className="text-2xl font-bold text-red-600">{urgentDisputes.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{disputes.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Disputes Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading disputes...</div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No disputes found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                {isAdmin && <TableHead>Vendor</TableHead>}
                <TableHead>Payout ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell className="font-mono text-xs">{dispute.id.slice(0, 8)}</TableCell>
                  {isAdmin && <TableCell>{dispute.vendorName}</TableCell>}
                  <TableCell className="font-mono text-xs">{dispute.payoutId}</TableCell>
                  <TableCell>{formatUSD(dispute.amount)}</TableCell>
                  <TableCell>{getPriorityBadge(dispute.priority)}</TableCell>
                  <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                  <TableCell>{format(new Date(dispute.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDispute(dispute)
                        setIsDialogOpen(true)
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Dispute Detail Dialog */}
        {selectedDispute && (
          <Dialog open={isDialogOpen && !!selectedDispute} onOpenChange={(open) => {
            if (!open) {
              setSelectedDispute(null)
              setIsDialogOpen(false)
            }
          }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Dispute Details</DialogTitle>
                <DialogDescription>
                  Payout ID: {selectedDispute.payoutId} • {formatUSD(selectedDispute.amount)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedDispute.status)}</div>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <div className="mt-1">{getPriorityBadge(selectedDispute.priority)}</div>
                  </div>
                </div>

                <div>
                  <Label>Reason</Label>
                  <p className="mt-1 text-sm">{selectedDispute.reason}</p>
                </div>

                <div>
                  <Label>Comments ({selectedDispute.comments.length})</Label>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {selectedDispute.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3 rounded-md ${
                          comment.isInternal ? "bg-muted" : "bg-background border"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                        {comment.isInternal && (
                          <Badge variant="outline" className="mt-1 text-xs">Internal</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Add Comment</Label>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="mt-2"
                  />
                  {isAdmin && (
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="internal-comment"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="internal-comment" className="text-sm">
                        Internal comment (not visible to vendor)
                      </label>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div>
                    <Label>Update Status</Label>
                    <Select
                      value={selectedDispute.status}
                      onValueChange={(value) => handleUpdateStatus(selectedDispute.id, value as Dispute["status"])}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="escalated">Escalated</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setSelectedDispute(null)
                  setIsDialogOpen(false)
                }}>
                  Close
                </Button>
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}



