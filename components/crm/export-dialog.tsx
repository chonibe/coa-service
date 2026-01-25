"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from "lucide-react"





import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox, Label } from "@/components/ui"
export interface ExportDialogProps {
  entityType: "people" | "companies" | "conversations" | "activities"
  filters?: any
  selectedIds?: string[]
  trigger?: React.ReactNode
}

const defaultColumns: Record<string, { id: string; label: string; default: boolean }[]> = {
  people: [
    { id: "id", label: "ID", default: false },
    { id: "email", label: "Email", default: true },
    { id: "first_name", label: "First Name", default: true },
    { id: "last_name", label: "Last Name", default: true },
    { id: "phone", label: "Phone", default: true },
    { id: "instagram_username", label: "Instagram", default: false },
    { id: "total_orders", label: "Total Orders", default: true },
    { id: "total_spent", label: "Total Spent", default: true },
    { id: "created_at", label: "Created At", default: false },
  ],
  companies: [
    { id: "id", label: "ID", default: false },
    { id: "name", label: "Name", default: true },
    { id: "domain", label: "Domain", default: true },
    { id: "industry", label: "Industry", default: true },
    { id: "website", label: "Website", default: false },
    { id: "created_at", label: "Created At", default: false },
  ],
  conversations: [
    { id: "id", label: "ID", default: false },
    { id: "customer_id", label: "Customer ID", default: false },
    { id: "platform", label: "Platform", default: true },
    { id: "status", label: "Status", default: true },
    { id: "is_starred", label: "Starred", default: false },
    { id: "unread_count", label: "Unread Count", default: true },
    { id: "last_message_at", label: "Last Message", default: true },
    { id: "created_at", label: "Created At", default: false },
  ],
  activities: [
    { id: "id", label: "ID", default: false },
    { id: "entity_type", label: "Entity Type", default: true },
    { id: "entity_id", label: "Entity ID", default: false },
    { id: "activity_type", label: "Activity Type", default: true },
    { id: "description", label: "Description", default: true },
    { id: "created_at", label: "Created At", default: true },
  ],
}

export function ExportDialog({ entityType, filters, selectedIds, trigger }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [format, setFormat] = useState<"csv" | "excel" | "json">("csv")
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    defaultColumns[entityType]?.filter((c) => c.default).map((c) => c.id) || []
  )
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const columns = defaultColumns[entityType] || []

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    )
  }

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one column to export",
      })
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch("/api/crm/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType,
          format,
          filters: selectedIds ? { ids: selectedIds } : filters,
          columns: selectedColumns,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Export failed")
      }

      // Handle file download
      if (format === "json") {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${entityType}-export-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const extension = format === "excel" ? "xlsx" : "csv"
        a.download = `${entityType}-export-${new Date().toISOString().split("T")[0]}.${extension}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }

      toast({
        title: "Export complete",
        description: `Exported ${entityType} to ${format.toUpperCase()}`,
      })

      setIsOpen(false)
    } catch (error: any) {
      console.error("Export error:", error)
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error.message || "Failed to export data",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const formatIcon = {
    csv: FileText,
    excel: FileSpreadsheet,
    json: FileJson,
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export {entityType}</DialogTitle>
          <DialogDescription>
            Choose export format and select columns to include in the export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div>
            <Label className="mb-2 block">Export Format</Label>
            <Select value={format} onValueChange={(value: any) => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>CSV</span>
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Excel (XLSX)</span>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    <span>JSON</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Column Selection */}
          <div>
            <Label className="mb-2 block">Select Columns</Label>
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedColumns(columns.map((c) => c.id))}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedColumns([])}
              >
                Deselect All
              </Button>
            </div>
            <ScrollArea className="h-64 border rounded-md p-4">
              <div className="space-y-2">
                {columns.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.id}
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={() => handleColumnToggle(column.id)}
                    />
                    <Label
                      htmlFor={column.id}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Export Info */}
          {selectedIds && selectedIds.length > 0 && (
            <div className="text-sm text-gray-500">
              Exporting {selectedIds.length} selected {entityType}
            </div>
          )}
          {filters && !selectedIds && (
            <div className="text-sm text-gray-500">
              Export will include all {entityType} matching current filters
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || selectedColumns.length === 0}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

