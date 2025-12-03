"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileJson } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExportButtonProps {
  entityType: "person" | "company"
  filters?: any
  selectedIds?: string[]
}

export function ExportButton({ entityType, filters, selectedIds }: ExportButtonProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: "csv" | "json") => {
    try {
      setIsExporting(true)

      let url = `/api/crm/${entityType === "person" ? "people" : "companies"}?limit=10000`
      
      if (selectedIds && selectedIds.length > 0) {
        // Export selected records
        url += `&ids=${selectedIds.join(",")}`
      } else if (filters) {
        // Apply filters
        url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch data")

      const data = await response.json()
      const records = data[entityType === "person" ? "people" : "companies"] || []

      if (format === "csv") {
        exportToCSV(records, entityType)
      } else {
        exportToJSON(records, entityType)
      }

      toast({
        title: "Export complete",
        description: `Exported ${records.length} ${entityType}s to ${format.toUpperCase()}`,
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: err.message || "Failed to export data",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportToCSV = (records: any[], entityType: string) => {
    if (records.length === 0) return

    const headers = Object.keys(records[0]).filter(
      (key) => !key.startsWith("crm_") && key !== "id"
    )
    const csvRows = [
      headers.join(","),
      ...records.map((record) =>
        headers
          .map((header) => {
            const value = record[header]
            if (value === null || value === undefined) return ""
            if (Array.isArray(value)) return JSON.stringify(value)
            if (typeof value === "object") return JSON.stringify(value)
            return String(value).replace(/"/g, '""')
          })
          .join(",")
      ),
    ]

    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${entityType}s-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportToJSON = (records: any[], entityType: string) => {
    const jsonContent = JSON.stringify(records, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${entityType}s-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

