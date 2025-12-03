"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Archive, ArchiveRestore, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ArchiveButtonProps {
  entityType: "person" | "company"
  entityId: string
  isArchived: boolean
  onArchiveChange?: (archived: boolean) => void
}

export function ArchiveButton({
  entityType,
  entityId,
  isArchived,
  onArchiveChange,
}: ArchiveButtonProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleArchive = async () => {
    setIsLoading(true)
    try {
      const action = isArchived ? "restore" : "archive"
      const response = await fetch(`/api/crm/${entityType}s/${entityId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update archive status")
      }

      const newArchivedStatus = !isArchived
      toast({
        title: "Success",
        description: `Record ${newArchivedStatus ? "archived" : "restored"} successfully`,
        variant: "success",
      })

      if (onArchiveChange) {
        onArchiveChange(newArchivedStatus)
      }
    } catch (err: any) {
      console.error("Error updating archive status:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update archive status",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleArchive}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isArchived ? (
        <ArchiveRestore className="mr-2 h-4 w-4" />
      ) : (
        <Archive className="mr-2 h-4 w-4" />
      )}
      {isArchived ? "Restore" : "Archive"}
    </Button>
  )
}


