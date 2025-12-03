"use client"

import { useState, useEffect } from "react"
import { Plus, Tag, Edit2, Trash2, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface Tag {
  id: string
  name: string
  color: string
  workspace_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface TagsPanelProps {
  conversationId?: string
  onTagAdded?: (tagId: string) => void
  onTagRemoved?: (tagId: string) => void
  className?: string
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
  "#6366F1", // Indigo
]

export function TagsPanel({
  conversationId,
  onTagAdded,
  onTagRemoved,
  className = "",
}: TagsPanelProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const { toast } = useToast()

  // Fetch all tags
  const fetchTags = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/crm/tags")
      if (!response.ok) {
        throw new Error("Failed to fetch tags")
      }
      const data = await response.json()
      setTags(data.tags || [])
    } catch (error: any) {
      console.error("Error fetching tags:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load tags",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [])

  // Create new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: "Error",
        description: "Tag name is required",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/crm/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create tag")
      }

      const data = await response.json()
      setTags([...tags, data.tag])
      setNewTagName("")
      setNewTagColor(PRESET_COLORS[0])
      setIsCreateDialogOpen(false)

      toast({
        title: "Success",
        description: "Tag created successfully",
      })

      // If conversation ID is provided, add tag to conversation
      if (conversationId && onTagAdded) {
        await addTagToConversation(data.tag.id)
      }
    } catch (error: any) {
      console.error("Error creating tag:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create tag",
        variant: "destructive",
      })
    }
  }

  // Update tag
  const handleUpdateTag = async () => {
    if (!editingTag || !newTagName.trim()) {
      return
    }

    try {
      const response = await fetch(`/api/crm/tags/${editingTag.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update tag")
      }

      const data = await response.json()
      setTags(tags.map((tag) => (tag.id === editingTag.id ? data.tag : tag)))
      setEditingTag(null)
      setIsEditDialogOpen(false)
      setNewTagName("")
      setNewTagColor(PRESET_COLORS[0])

      toast({
        title: "Success",
        description: "Tag updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating tag:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update tag",
        variant: "destructive",
      })
    }
  }

  // Delete tag
  const handleDeleteTag = async () => {
    if (!tagToDelete) return

    try {
      const response = await fetch(`/api/crm/tags/${tagToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete tag")
      }

      setTags(tags.filter((tag) => tag.id !== tagToDelete.id))
      setTagToDelete(null)

      toast({
        title: "Success",
        description: "Tag deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting tag:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete tag",
        variant: "destructive",
      })
    }
  }

  // Add tag to conversation
  const addTagToConversation = async (tagId: string) => {
    if (!conversationId) return

    try {
      const response = await fetch(`/api/crm/conversations/${conversationId}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag_id: tagId }),
      })

      if (!response.ok) {
        throw new Error("Failed to add tag to conversation")
      }

      if (onTagAdded) {
        onTagAdded(tagId)
      }
    } catch (error: any) {
      console.error("Error adding tag to conversation:", error)
      toast({
        title: "Error",
        description: "Failed to add tag to conversation",
        variant: "destructive",
      })
    }
  }

  // Remove tag from conversation
  const removeTagFromConversation = async (tagId: string) => {
    if (!conversationId) return

    try {
      const response = await fetch(`/api/crm/conversations/${conversationId}/tags/${tagId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove tag from conversation")
      }

      if (onTagRemoved) {
        onTagRemoved(tagId)
      }
    } catch (error: any) {
      console.error("Error removing tag from conversation:", error)
      toast({
        title: "Error",
        description: "Failed to remove tag from conversation",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag)
    setNewTagName(tag.name)
    setNewTagColor(tag.color)
    setIsEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setEditingTag(null)
    setNewTagName("")
    setNewTagColor(PRESET_COLORS[0])
    setIsEditDialogOpen(false)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Tags</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tag</DialogTitle>
              <DialogDescription>
                Create a new tag to organize your conversations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tag Name</label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g., Important, Follow-up"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateTag()
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagColor(color)}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        newTagColor === color
                          ? "border-gray-900 scale-110"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTag}>Create Tag</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags List */}
      <ScrollArea className="max-h-[400px]">
        {isLoading ? (
          <div className="text-sm text-gray-500 py-4">Loading tags...</div>
        ) : tags.length === 0 ? (
          <div className="text-sm text-gray-500 py-4 text-center">
            No tags yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 group"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: tag.color,
                      color: tag.color,
                      backgroundColor: `${tag.color}10`,
                    }}
                  >
                    <Tag className="h-2.5 w-2.5 mr-1" />
                    {tag.name}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => openEditDialog(tag)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                    onClick={() => setTagToDelete(tag)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={closeEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>Update tag name and color</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tag Name</label>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdateTag()
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={`w-8 h-8 rounded-md border-2 transition-all ${
                      newTagColor === color
                        ? "border-gray-900 scale-110"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTag}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!tagToDelete}
        onOpenChange={(open) => !open && setTagToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag "{tagToDelete?.name}"? This action cannot be
              undone and will remove the tag from all conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

