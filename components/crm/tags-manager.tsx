"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TagsManagerProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  entityType: "person" | "company"
  entityId?: string
  updateEndpoint: string
}

const TAG_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
]

export function TagsManager({
  tags,
  onTagsChange,
  entityType,
  entityId,
  updateEndpoint,
}: TagsManagerProps) {
  const { toast } = useToast()
  const [newTag, setNewTag] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const getTagColor = (tag: string) => {
    const index = tag.charCodeAt(0) % TAG_COLORS.length
    return TAG_COLORS[index]
  }

  const handleAddTag = async () => {
    const trimmedTag = newTag.trim()
    if (!trimmedTag) return

    if (tags.includes(trimmedTag)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tag already exists",
      })
      return
    }

    const newTags = [...tags, trimmedTag]

    try {
      const response = await fetch(updateEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: newTags,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update tags")
      }

      onTagsChange(newTags)
      setNewTag("")
      setIsAdding(false)

      toast({
        variant: "success",
        title: "Success",
        description: "Tag added",
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to add tag",
      })
    }
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove)

    try {
      const response = await fetch(updateEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: newTags,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update tags")
      }

      onTagsChange(newTags)

      toast({
        variant: "success",
        title: "Success",
        description: "Tag removed",
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to remove tag",
      })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className={`${getTagColor(tag)} flex items-center gap-1`}
          >
            <Tag className="h-3 w-3" />
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:opacity-70"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {!isAdding && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Tag
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddTag()
              } else if (e.key === "Escape") {
                setIsAdding(false)
                setNewTag("")
              }
            }}
            placeholder="Enter tag name"
            className="max-w-xs"
            autoFocus
          />
          <Button size="sm" onClick={handleAddTag}>
            Add
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsAdding(false)
              setNewTag("")
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

