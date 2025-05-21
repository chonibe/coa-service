"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Download, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Backup {
  id: string
  type: "database" | "sheets"
  createdAt: string
  status: "success" | "failed"
  url?: string
  size?: string
}

export function RecentBackups() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBackups()

    // Listen for backup-created event
    const handleBackupCreated = () => {
      fetchBackups()
    }

    window.addEventListener("backup-created", handleBackupCreated)

    return () => {
      window.removeEventListener("backup-created", handleBackupCreated)
    }
  }, [])

  async function fetchBackups() {
    try {
      const response = await fetch("/api/admin/backup/list")
      if (!response.ok) {
        throw new Error("Failed to fetch backups")
      }
      const data = await response.json()
      setBackups(data)
    } catch (error) {
      toast.error("Failed to fetch backups")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteBackup(id: string) {
    try {
      const response = await fetch(`/api/admin/backup/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete backup")
      }

      toast.success("Backup deleted successfully")
      fetchBackups()
    } catch (error) {
      toast.error("Failed to delete backup")
      console.error(error)
    }
  }

  if (isLoading) {
    return <div>Loading backups...</div>
  }

  if (backups.length === 0) {
    return <div>No backups found</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Size</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {backups.map((backup) => (
          <TableRow key={backup.id}>
            <TableCell>
              <Badge variant={backup.type === "database" ? "default" : "secondary"}>
                {backup.type === "database" ? "Database" : "Google Sheets"}
              </Badge>
            </TableCell>
            <TableCell>{new Date(backup.createdAt).toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={backup.status === "success" ? "default" : "destructive"}>
                {backup.status}
              </Badge>
            </TableCell>
            <TableCell>{backup.size || "N/A"}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {backup.url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(backup.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                {backup.type === "database" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(`/api/admin/backup/${backup.type}/download`, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteBackup(backup.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 