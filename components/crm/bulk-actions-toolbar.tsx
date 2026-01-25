"use client"

import { useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"




import { MoreHorizontal, Tag, Trash2, ListPlus, ListMinus, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Label, Badge } from "@/components/ui"
interface BulkActionsToolbarProps {
  selectedIds: string[]
  entityType: "person" | "company"
  onActionComplete: () => void
}

export function BulkActionsToolbar({ selectedIds, entityType, onActionComplete }: BulkActionsToolbarProps) {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})

  const handleBulkAction = async (operation: string, data?: any) => {
    if (selectedIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No records selected",
      })
      return
    }

    try {
      const response = await fetch(`/api/crm/${entityType === "person" ? "people" : "companies"}/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation,
          record_ids: selectedIds,
          data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to perform bulk operation")
      }

      const result = await response.json()

      toast({
        variant: "success",
        title: "Success",
        description: `${result.updated} record(s) updated`,
      })

      setIsDialogOpen(false)
      setCurrentAction(null)
      setFormData({})
      onActionComplete()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to perform bulk operation",
      })
    }
  }

  const openDialog = (action: string) => {
    setCurrentAction(action)
    setIsDialogOpen(true)
    setFormData({})
  }

  const renderDialog = () => {
    if (!currentAction) return null

    switch (currentAction) {
      case "tag":
        return (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tags</DialogTitle>
              <DialogDescription>
                Add tags to {selectedIds.length} selected record(s)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={typeof formData.tags === "string" ? formData.tags : (formData.tags || []).join(", ")}
                  onChange={(e) => setFormData({ 
                    tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) 
                  })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleBulkAction("tag", { tags: formData.tags })}>
                  Add Tags
                </Button>
              </div>
            </div>
          </DialogContent>
        )

      case "remove_tags":
        return (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Tags</DialogTitle>
              <DialogDescription>
                Remove tags from {selectedIds.length} selected record(s)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tags">Tags to remove (comma-separated)</Label>
                <Input
                  id="tags"
                  value={typeof formData.tags === "string" ? formData.tags : (formData.tags || []).join(", ")}
                  onChange={(e) => setFormData({ 
                    tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) 
                  })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleBulkAction("remove_tags", { tags: formData.tags })}>
                  Remove Tags
                </Button>
              </div>
            </div>
          </DialogContent>
        )

      case "archive":
        return (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Archive Records</DialogTitle>
              <DialogDescription>
                Are you sure you want to archive {selectedIds.length} selected record(s)?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleBulkAction("archive")}>
                Archive
              </Button>
            </div>
          </DialogContent>
        )

      case "restore":
        return (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restore Records</DialogTitle>
              <DialogDescription>
                Are you sure you want to restore {selectedIds.length} selected record(s)?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleBulkAction("restore")}>
                Restore
              </Button>
            </div>
          </DialogContent>
        )

      case "add_to_list":
        return (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to List</DialogTitle>
              <DialogDescription>
                Add {selectedIds.length} selected record(s) to a list
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="list_id">List ID</Label>
                <Input
                  id="list_id"
                  value={formData.list_id || ""}
                  onChange={(e) => setFormData({ list_id: e.target.value })}
                  placeholder="Enter list ID"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleBulkAction("add_to_list", formData)}>
                  Add to List
                </Button>
              </div>
            </div>
          </DialogContent>
        )

      case "remove_from_list":
        return (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove from List</DialogTitle>
              <DialogDescription>
                Remove {selectedIds.length} selected record(s) from a list
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="list_id">List ID</Label>
                <Input
                  id="list_id"
                  value={formData.list_id || ""}
                  onChange={(e) => setFormData({ list_id: e.target.value })}
                  placeholder="Enter list ID"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleBulkAction("remove_from_list", formData)}>
                  Remove from List
                </Button>
              </div>
            </div>
          </DialogContent>
        )

      case "delete":
        return (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Records</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedIds.length} selected record(s)? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleBulkAction("delete")}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        )

      default:
        return null
    }
  }

  if (selectedIds.length === 0) {
    return null
  }

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
        <Badge variant="secondary">{selectedIds.length} selected</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Bulk Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openDialog("tag")}>
              <Tag className="h-4 w-4 mr-2" />
              Add Tags
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog("remove_tags")}>
              <Tag className="h-4 w-4 mr-2" />
              Remove Tags
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openDialog("archive")}>
              <Edit className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog("restore")}>
              <Edit className="h-4 w-4 mr-2" />
              Restore
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => openDialog("delete")}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {renderDialog()}
      </Dialog>
    </>
  )
}

